import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../services/authService';

export function useRegister() {
  const { register } = useAuth();
  const [values, setValues] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function change(field, value) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setError(null);
  }

  async function submit() {
    if (inFlight.current) return;
    const { username, email, password, confirmPassword } = values;
    const name = username.trim().toLowerCase();
    let message;
    if (Object.values(values).some((value) => !value.trim())) message = 'Completá todos los campos.';
    else if (name.length < 3 || name.length > 30) message = 'El nombre debe tener entre 3 y 30 caracteres.';
    else if (name.includes('/') || /^__.*__$/.test(name)) message = 'Elegí un nombre sin barras ni formato reservado.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) message = 'Ingresá un correo válido.';
    else if (password.length < 6) message = 'La contraseña debe tener al menos 6 caracteres.';
    else if (password !== confirmPassword) message = 'Las contraseñas no coinciden.';
    if (message) { setError(message); return; }

    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await register(values);
    } catch (failure) {
      if (mounted.current) setError(authErrorMessage(failure));
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return { values, change, submit, busy, error };
}
