import { useEffect, useRef, useState } from 'react';
import { pickProfileImage, uploadProfileImage } from '../services/profileImageService';
import { updateProfile } from '../services/profileService';

export function useEditProfile(uid, profile, onSaved) {
  const [description, setDescription] = useState(profile.description);
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const uploaded = useRef(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function selectImage(camera) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null); setPhase('Preparando foto…');
    try {
      const selected = await pickProfileImage(camera);
      if (selected && mounted.current) {
        setImage(selected); setRemoveImage(false); uploaded.current = null;
      }
    } catch (failure) {
      if (mounted.current) setError(failure.message || 'No se pudo abrir la foto.');
    } finally {
      pending.current = false;
      if (mounted.current) { setBusy(false); setPhase(''); }
    }
  }

  async function save() {
    if (pending.current) return;
    if (description.trim().length > 300) { setError('La descripción admite hasta 300 caracteres.'); return; }
    pending.current = true; setBusy(true); setError(null);
    try {
      let imageChange = removeImage ? null : undefined;
      if (image) {
        setPhase('Subiendo foto…');
        // Si Firestore falla, el reintento reutiliza la misma subida.
        if (!uploaded.current) uploaded.current = await uploadProfileImage(uid, image);
        imageChange = uploaded.current;
      }
      if (!mounted.current) return;
      setPhase('Guardando perfil…');
      await updateProfile(uid, description, imageChange);
      if (mounted.current) onSaved();
    } catch (failure) {
      if (mounted.current) setError(failure.message || 'No se pudieron guardar los cambios.');
    } finally {
      pending.current = false;
      if (mounted.current) { setBusy(false); setPhase(''); }
    }
  }
  return {
    description, image, removeImage, busy, phase, error, selectImage, save,
    dirty: description !== profile.description || !!image || removeImage,
    changeDescription: (value) => { setDescription(value); setError(null); },
    clearImage: () => {
      if (pending.current) return;
      setImage(null); setRemoveImage(true); setError(null); uploaded.current = null;
    },
  };
}
