import { collection, doc, getDoc, getFirestore, limit, onSnapshot, orderBy, query, runTransaction, where } from 'firebase/firestore';
import { getFirebaseApp } from '../config/firebaseApp';
import { getFirebaseAuth } from '../config/firebase';

const db = () => getFirestore(getFirebaseApp());
export function observeNotifications(uid, next, fail, onlyUnread = false) {
  let active = true;
  let revision = 0;
  const actors = new Map();
  const stop = onSnapshot(query(collection(db(), 'notifications'), where('recipientId', '==', uid),
    ...(onlyUnread ? [where('read', '==', false)] : []),
    orderBy('createdAt', 'desc'), limit(50)), { includeMetadataChanges: true }, async (snapshot) => {
    const version = ++revision;
    try {
      const items = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      const missing = [...new Set(items.map((item) => item.actorId))].filter((id) => id && !actors.has(id));
      for (let i = 0; i < missing.length; i += 8) {
        await Promise.all(missing.slice(i, i + 8).map(async (id) => {
          const actor = await getDoc(doc(db(), 'users', id));
          actors.set(id, actor.exists() ? actor.data() : {});
        }));
        if (!active || version !== revision) return;
      }
      if (active && version === revision) next({ items: items.map((item) => ({ ...item, actor: actors.get(item.actorId) || {} })),
        confirmed: !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites });
    } catch (error) { if (active && version === revision) fail(error); }
  }, fail);
  return () => { active = false; revision++; stop(); };
}
// Independiente del límite de la lista: detecta también un aviso antiguo sin leer.
export function observeUnread(uid, next, fail) {
  return onSnapshot(query(collection(db(), 'notifications'), where('recipientId', '==', uid), where('read', '==', false),
    orderBy('createdAt', 'desc'), limit(1)), (snapshot) => next(!snapshot.empty), fail);
}
export async function markNotificationRead(id) {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error('Tu sesión terminó.');
  await runTransaction(db(), async (tx) => {
    const ref = doc(db(), 'notifications', id);
    const notice = await tx.get(ref);
    if (!notice.exists()) return;
    if (notice.data().recipientId !== uid) throw new Error('Este aviso no pertenece a tu cuenta.');
    if (notice.data().read !== true) tx.update(ref, { read: true });
  });
}
export function notificationTarget(notice) {
  if (notice.type === 'like' && typeof notice.postId === 'string' && notice.postId && !notice.postId.includes('/')) return { type: 'post', id: notice.postId };
  if (notice.type === 'follow' && typeof notice.actorId === 'string' && notice.actorId && !notice.actorId.includes('/')) return { type: 'profile', id: notice.actorId };
  return null;
}
export const notificationText = (notice) => (notice.actor?.username || 'Un usuario') +
  (notice.type === 'follow' ? ' empezó a seguirte.' : ' indicó que le gusta tu publicación.');
