import { useCallback, useEffect, useRef, useState } from 'react';
import { loadExplorePage } from '../services/feedService';
import { observeRelations } from '../services/profileSocialService';

export function useExplore(uid, enabled = true) {
  const [state, setState] = useState({ status: 'loading', posts: [], loadingMore: false, hasMore: true, error: null });
  const [attempt, setAttempt] = useState(0);
  const loader = useRef(() => {});
  useEffect(() => {
    if (!enabled) { loader.current = () => {}; return; }
    setState({ status: 'loading', posts: [], loadingMore: false, hasMore: true, error: null });
    let active = true;
    let version = 0;
    let cursor = null;
    let busy = false;
    let hasMore = true;
    let excluded = new Set([uid]);
    let previousKey;
    let posts = [];
    const emit = (extra) => { if (active) setState({ status: 'ready', posts: [...posts], loadingMore: false, hasMore, error: null, ...extra }); };
    async function load() {
      if (busy || !hasMore) return;
      busy = true;
      const current = version;
      emit({ status: posts.length ? 'ready' : 'loading', loadingMore: true });
      try {
        // Seguir avanzando si un lote completo pertenece a autores excluidos.
        let added = 0;
        let scanned = 0;
        do {
          const page = await loadExplorePage(cursor);
          scanned++;
          if (!active || current !== version) return;
          cursor = page.cursor; hasMore = page.hasMore;
          const incoming = page.posts.filter((post) => post.authorId && !excluded.has(post.authorId));
          const unique = new Map(posts.map((post) => [post.id, post]));
          incoming.forEach((post) => unique.set(post.id, post));
          added += unique.size - posts.length;
          posts = [...unique.values()];
        } while (hasMore && added === 0 && scanned < 3);
        emit({});
      } catch {
        if (active && current === version) emit({ status: posts.length ? 'ready' : 'error', error: 'No se pudo cargar Explorar. Revisá tu conexión y reintentá.' });
      } finally { if (current === version) busy = false; }
    }
    const stop = observeRelations(uid, 'following', (ids) => {
      const key = [...ids].sort().join('|');
      if (key === previousKey) return;
      previousKey = key; version++; busy = false;
      excluded = new Set([uid, ...ids]); cursor = null; posts = []; hasMore = true;
      loader.current = load;
      load();
    }, () => {
      version++; busy = false;
      if (active) setState({ status: 'error', posts: [], hasMore: false, loadingMore: false, error: 'No se pudieron cargar tus seguidos. Reintentá.' });
    }, true);
    return () => { active = false; version++; stop(); loader.current = () => {}; };
  }, [uid, attempt, enabled]);
  return { ...state, loadMore: useCallback(() => loader.current(), []), retry: () => setAttempt((n) => n + 1) };
}
