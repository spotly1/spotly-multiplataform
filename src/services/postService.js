import { collection, doc, GeoPoint, getFirestore, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseApp } from '../config/firebaseApp';
import { getFirebaseAuth } from '../config/firebase';
import { requireConnection } from './connectionService';

export function newPostId() { return doc(collection(getFirestore(getFirebaseApp()), 'posts')).id; }
export async function publishPost(id, uid, image, description, location) {
  await requireConnection();
  if (getFirebaseAuth().currentUser?.uid !== uid) throw new Error('Tu sesión terminó. Volvé a ingresar.');
  const text = description.trim();
  if (!text || text.length > 1000) throw new Error('La descripción debe tener entre 1 y 1000 caracteres.');
  const db = getFirestore(getFirebaseApp());
  const ref = doc(db, 'posts', id);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists()) {
      if (existing.data().authorId !== uid) throw new Error('No se pudo guardar la publicación.');
      return; // Mismo ID al reintentar: nunca crea dos publicaciones.
    }
    transaction.set(ref, {
      authorId: uid, imageUrl: image.url, imagePublicId: image.publicId, description: text,
      createdAt: serverTimestamp(),
      location: location ? new GeoPoint(location.latitude, location.longitude) : null,
    });
  });
}
