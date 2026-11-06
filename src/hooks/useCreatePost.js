import { useEffect, useRef, useState } from 'react';
import { pickPostImage, uploadPostImage } from '../services/profileImageService';
import { getCurrentLocation } from '../services/locationService';
import { newPostId, publishPost } from '../services/postService';
import { publishErrorMessage } from '../services/publishErrors';
import { requireConnection } from '../services/connectionService';

export function useCreatePost(uid, onPublished) {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  const uploaded = useRef(null);
  const draft = useRef(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  async function perform(label, action) {
    if (pending.current) return;
    pending.current = true; setPhase(label); setError(null);
    try { await action(); }
    catch (failure) {
      if (__DEV__) console.warn('[Spotly/publicar]', failure.code || failure.name || 'unknown');
      if (alive.current) setError(publishErrorMessage(failure));
    } finally {
      pending.current = false;
      if (alive.current) setPhase('');
    }
  }
  const select = (camera) => {
    if (submitted) return;
    return perform('Preparando foto…', async () => {
      const selected = await pickPostImage(camera);
      if (selected && alive.current) { setImage(selected); uploaded.current = null; }
    });
  };
  const locate = () => {
    if (submitted) return;
    return perform('Buscando ubicación…', async () => {
      const point = await getCurrentLocation();
      if (alive.current) setLocation(point);
    });
  };
  async function publish() {
    if (pending.current) return;
    if (!image || !description.trim() || description.trim().length > 1000) {
      setError('Elegí una foto y escribí una descripción de hasta 1000 caracteres.'); return;
    }
    return perform('Subiendo foto…', async () => {
      await requireConnection();
      if (!uploaded.current) uploaded.current = await uploadPostImage(uid, image);
      if (!alive.current) return;
      if (!draft.current) draft.current = { id: newPostId(), description, location, image: uploaded.current };
      // Congelar el intento hasta confirmar su resultado evita duplicar o cambiar un envío incierto.
      setSubmitted(true); setPhase('Publicando…');
      const data = draft.current;
      await publishPost(data.id, uid, data.image, data.description, data.location);
      if (alive.current) onPublished();
    });
  }
  return {
    image, description, location, phase, error, submitted, busy: !!phase,
    dirty: !!image || !!description || !!location,
    select, locate, publish,
    changeDescription: (value) => { if (!submitted && !pending.current) { setDescription(value); setError(null); } },
    removeImage: () => { if (!submitted && !pending.current) { setImage(null); uploaded.current = null; } },
    removeLocation: () => { if (!submitted && !pending.current) setLocation(null); },
  };
}
