import { useEffect, useRef, useState } from 'react';
import { authErrorMessage, login } from '../services/authService';

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function submit() {
    if (inFlight.current) return;
    if (!email.trim() || !password) {
      setError('Completá el correo y la contraseña.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresá un correo válido.');
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      if (mounted.current) setPassword('');
      // El cambio de pantalla depende del listener de sesión del Provider.
    } catch (failure) {
      if (mounted.current) setError(authErrorMessage(failure));
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return {
    email, password, busy, error, submit,
    changeEmail: (value) => { setEmail(value); setError(null); },
    changePassword: (value) => { setPassword(value); setError(null); },
  };
}
