import { doc, getFirestore, onSnapshot, runTransaction } from 'firebase/firestore';
import { getFirebaseAuth } from '../config/firebase';
import { getFirebaseApp } from '../config/firebaseApp';

export function observeProfile(uid, onChange, onError) {
  const ref = doc(getFirestore(getFirebaseApp()), 'users', uid);
  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) { onChange(null); return; }
    const data = snapshot.data();
    onChange({
      username: typeof data.username === 'string' ? data.username : '',
      description: typeof data.description === 'string' ? data.description : '',
      profileImageUrl: typeof data.profileImageUrl === 'string' ? data.profileImageUrl : '',
    });
  }, onError);
}

export function profileErrorMessage(error) {
  switch (error?.code) {
    case 'permission-denied': return 'No tenés permiso para consultar este perfil.';
    case 'unavailable': return 'No pudimos conectar con Firebase. Revisá tu conexión.';
    default: return 'No se pudo cargar tu perfil. Intentá nuevamente.';
  }
}

export async function updateProfile(uid, description, imageChange) {
  if (getFirebaseAuth().currentUser?.uid !== uid) throw new Error('Tu sesión cambió. Volvé a ingresar.');
  const text = description.trim();
  if (text.length > 300) throw new Error('La descripción admite hasta 300 caracteres.');
  const db = getFirestore(getFirebaseApp());
  const ref = doc(db, 'users', uid);
  const updates = { description: text };
  // undefined conserva la foto actual; null la quita; un objeto la reemplaza.
  if (imageChange !== undefined) {
    updates.profileImageUrl = imageChange?.url || '';
    updates.profileImagePublicId = imageChange?.publicId || '';
  }
  try {
    await runTransaction(db, async (transaction) => {
      if (!(await transaction.get(ref)).exists()) throw new Error('missing-profile');
      transaction.update(ref, updates);
    });
  } catch {
    throw new Error('No se guardaron los cambios. Revisá tu conexión y reintentá.');
  }
}
