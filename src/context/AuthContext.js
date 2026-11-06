import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { registerAccount } from '../services/registerService';
import { authErrorMessage, observeSession } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ loading: true, user: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const registering = useRef(false);

  async function register(values) {
    if (registering.current) return;
    registering.current = true;
    try {
      const user = await registerAccount(values);
      setSession({ loading: false, user, error: null });
    } catch (error) {
      setSession({ loading: false, user: null, error: null });
      throw error;
    } finally {
      registering.current = false;
    }
  }

  useEffect(() => {
    let active = true;
    let unsubscribe;
    setSession({ loading: true, user: null, error: null });
    const fail = (error) => {
      if (active) setSession({ loading: false, user: null, error: authErrorMessage(error) });
    };
    try {
      unsubscribe = observeSession((user) => {
        if (active && !registering.current) setSession({ loading: false, user, error: null });
      }, fail);
    } catch (error) {
      fail(error);
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [attempt]);

  return (
    <AuthContext.Provider value={{ ...session, register, retry: () => setAttempt((value) => value + 1) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
}
