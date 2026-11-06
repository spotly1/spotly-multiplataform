import { useEffect, useRef, useState } from 'react';
import { normalizeSearch, readRecentSearches, saveRecentSearches, searchUsers } from '../services/searchService';

export function useSearch(uid) {
  const [text, setText] = useState('');
  const [recent, setRecent] = useState([]);
  const [historyError, setHistoryError] = useState(null);
  const [state, setState] = useState({ status: 'ready', data: [], error: null });
  const [attempt, setAttempt] = useState(0);
  const history = useRef([]);
  const writes = useRef(Promise.resolve());
  const mounted = useRef(false);
  const historyReady = useRef(false);
  const prefix = normalizeSearch(text);
  useEffect(() => {
    mounted.current = true;
    readRecentSearches(uid).then((items) => {
      if (mounted.current) { history.current = items; setRecent(items); }
    }).catch(() => { if (mounted.current) setHistoryError('No se pudieron leer las búsquedas recientes.'); })
      .finally(() => { historyReady.current = true; });
    return () => { mounted.current = false; };
  }, [uid]);
  useEffect(() => {
    let active = true;
    if (!prefix) { setState({ status: 'ready', data: [], error: null }); return; }
    setState({ status: 'loading', data: [], error: null });
    const timer = setTimeout(() => {
      searchUsers(prefix).then((data) => {
        if (active) setState({ status: 'ready', data, error: null });
      }).catch(() => {
        if (active) setState({ status: 'error', data: [], error: 'No se pudo buscar. Revisá tu conexión y reintentá.' });
      });
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [prefix, attempt]);
  function persist(items) {
    if (!historyReady.current) return;
    history.current = items; setRecent(items); setHistoryError(null);
    writes.current = writes.current.catch(() => {}).then(() => saveRecentSearches(uid, items)).catch(() => {
      if (mounted.current) setHistoryError('No se pudieron guardar las búsquedas recientes.');
    });
  }
  function remember(value = text) {
    const term = normalizeSearch(value);
    if (term) persist([term, ...history.current.filter((item) => item !== term)].slice(0, 10));
  }
  return { ...state, text, prefix, setText, recent, remember, historyError,
    removeRecent: (term) => persist(history.current.filter((item) => item !== term)),
    clearRecent: () => persist([]), retry: () => setAttempt((n) => n + 1) };
}
