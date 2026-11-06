import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnection } from '../context/ConnectionContext';
import { readFeedCache, saveFeedAuthor, saveFeedCache } from '../services/feedCacheService';

export function useCachedFeed(uid, kind, live) {
  const { online } = useConnection();
  const [cached, setCached] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cacheError, setCacheError] = useState(null);
  const mounted = useRef(false);
  const authors = useRef(new Map());
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setCached(null); setCacheError(null);
    readFeedCache(uid, kind).then((value) => { if (active) setCached(value); })
      .catch(() => { if (active) setCacheError('No se pudo leer el contenido guardado.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid, kind, online]);
  useEffect(() => {
    if (!online || live.status !== 'ready' || live.loadingMore || live.error) return;
    saveFeedCache(uid, kind, live, authors.current).catch(() => {
      if (mounted.current) setCacheError('No se pudo guardar este feed para verlo sin Internet.');
    });
  }, [uid, kind, online, live.status, live.posts, live.hasFollowing, live.loadingMore, live.error]);
  const rememberAuthor = useCallback((id, profile) => {
    authors.current.set(id, { username: profile.username, profileImageUrl: profile.profileImageUrl });
    if (authors.current.size > 100) authors.current.delete(authors.current.keys().next().value);
    saveFeedAuthor(uid, kind, id, profile).catch(() => {
      if (mounted.current) setCacheError('No se pudo guardar el autor para verlo sin Internet.');
    });
  }, [uid, kind]);
  return online ? { ...live, online, cacheError, rememberAuthor } : {
    status: loading ? 'loading' : 'ready', posts: cached?.posts || [], hasFollowing: cached?.hasFollowing,
    savedAt: cached?.savedAt, online: false, hasMore: false, loadingMore: false, cacheError, retry: () => {},
  };
}
