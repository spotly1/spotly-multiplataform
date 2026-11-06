import { useEffect, useState } from 'react';
import { observeProfile, profileErrorMessage } from '../services/profileService';

export function useProfile(uid) {
  const [state, setState] = useState({ status: 'loading', profile: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let unsubscribe;
    setState({ status: 'loading', profile: null, error: null });
    const fail = (error) => {
      if (active) setState({ status: 'error', profile: null, error: profileErrorMessage(error) });
    };
    if (!uid) return () => { active = false; };
    try {
      unsubscribe = observeProfile(uid, (profile) => {
        if (active) setState({ status: profile ? 'ready' : 'missing', profile, error: null });
      }, fail);
    } catch (error) { fail(error); }
    // Al cerrar sesión o cambiar de usuario, dejamos de escuchar ese perfil.
    return () => { active = false; unsubscribe?.(); };
  }, [uid, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
