import { useEffect, useRef, useState } from 'react';

// subscribe se mantiene estable con useCallback en cada pantalla.
export function useLiveData(subscribe) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let stop;
    setState({ status: 'loading', data: null, error: null });
    const fail = (error) => { if (active) setState({ status: 'error', data: null, error: error?.code === 'failed-precondition'
      ? 'Esta consulta necesita un índice de Firestore. Revisá la configuración del proyecto Firebase.'
      : 'No se pudieron cargar los datos. Revisá tu conexión y reintentá.' }); };
    try {
      stop = subscribe((data) => {
        if (active) setState({ status: 'ready', data, error: null });
      }, fail);
    } catch { fail(); }
    return () => { active = false; stop?.(); };
  }, [subscribe, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  async function run(action) {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setError(null);
    try { await action(); return mounted.current; }
    catch (failure) {
      if (mounted.current) setError(failure.code ? 'No se pudo completar la acción. Revisá tu conexión y reintentá.' : failure.message);
      return false;
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return { busy, error, run };
}
