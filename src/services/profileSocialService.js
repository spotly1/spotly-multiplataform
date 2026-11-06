import { collection, doc, getDoc, getFirestore, limit, onSnapshot, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { getFirebaseApp } from '../config/firebaseApp';
import { getFirebaseAuth } from '../config/firebase';
import { requireConnection } from './connectionService';

const db = () => getFirestore(getFirebaseApp());
function currentUid() {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error('Tu sesión terminó. Volvé a ingresar.');
  return uid;
}
const postData = (snapshot) => ({ ...snapshot.data(), id: snapshot.id });

export function observePosts(uid, own, next, fail) {
  const constraints = [where('authorId', '==', uid)];
  if (!own) constraints.push(limit(50));
  return onSnapshot(query(collection(db(), 'posts'), ...constraints), (snapshot) => {
    next(snapshot.docs.map(postData).sort((a, b) =>
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0) || a.id.localeCompare(b.id)));
  }, fail);
}
export function observePost(id, next, fail) {
  return onSnapshot(doc(db(), 'posts', id), (s) => next(s.exists() ? postData(s) : null), fail);
}
export function observeRelations(uid, type, next, fail, confirmedOnly = false) {
  const followers = type === 'followers';
  return onSnapshot(query(collection(db(), 'follows'), where(followers ? 'followedId' : 'followerId', '==', uid)), { includeMetadataChanges: true },
    (snapshot) => {
      if (confirmedOnly && (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)) return;
      next([...new Set(snapshot.docs.map((s) => s.data()[followers ? 'followerId' : 'followedId']).filter(Boolean))]);
    }, fail);
}
export function observeLikes(id, next, fail) {
  return onSnapshot(collection(db(), 'posts', id, 'likes'), (s) => next(s.docs.map((d) => d.id)), fail);
}
export function observePeople(uid, type, next, fail) {
  let active = true;
  let revision = 0;
  const listen = type === 'likes' ? observeLikes : (id, ok, error) => observeRelations(id, type, ok, error);
  const stop = listen(uid, async (ids) => {
    const version = ++revision;
    try {
      const users = [];
      for (let i = 0; i < ids.length; i += 8) {
        if (!active || version !== revision) return;
        const found = await Promise.all(ids.slice(i, i + 8).map((id) => getDoc(doc(db(), 'users', id))));
        users.push(...found.filter((s) => s.exists()).map((s) => ({
          uid: s.id, username: s.data().username || '', description: s.data().description || '',
          profileImageUrl: s.data().profileImageUrl || '',
        })));
      }
      if (active && version === revision) next(users.sort((a, b) => a.username.localeCompare(b.username)));
    } catch (error) { if (active && version === revision) fail(error); }
  }, fail);
  return () => { active = false; revision++; stop(); };
}
const notice = (actorId, recipientId, type, postId = '', postImageUrl = '') =>
  ({ actorId, recipientId, type, postId, postImageUrl, createdAt: serverTimestamp(), read: false });

export async function setFollowing(target, following) {
  await requireConnection();
  const uid = currentUid();
  if (uid === target) throw new Error('No podés seguirte a vos mismo.');
  const ref = doc(db(), 'follows', uid + '_' + target);
  const notification = doc(db(), 'notifications', 'follow_' + uid + '_' + target);
  await runTransaction(db(), async (tx) => {
    const exists = (await tx.get(ref)).exists();
    if (following && !exists) {
      tx.set(ref, { followerId: uid, followedId: target, createdAt: serverTimestamp() });
      tx.set(notification, notice(uid, target, 'follow'));
    } else if (!following && exists) { tx.delete(ref); tx.delete(notification); }
  });
}
export async function setLiked(id, liked) {
  await requireConnection();
  const uid = currentUid();
  const postRef = doc(db(), 'posts', id);
  const ref = doc(postRef, 'likes', uid);
  const notification = doc(db(), 'notifications', 'like_' + id + '_' + uid);
  await runTransaction(db(), async (tx) => {
    const post = await tx.get(postRef);
    if (!post.exists()) throw new Error('La publicación ya no existe.');
    const exists = (await tx.get(ref)).exists();
    const { authorId, imageUrl } = post.data();
    if (liked && !exists) {
      tx.set(ref, { createdAt: serverTimestamp() });
      if (authorId !== uid) tx.set(notification, notice(uid, authorId, 'like', id, imageUrl));
    } else if (!liked && exists) {
      tx.delete(ref);
      if (authorId !== uid) tx.delete(notification);
    }
  });
}
export async function changePost(id, description, remove = false) {
  const uid = currentUid();
  const text = description?.trim();
  if (!remove && (!text || text.length > 1000)) throw new Error('La descripción debe tener entre 1 y 1000 caracteres.');
  await runTransaction(db(), async (tx) => {
    const ref = doc(db(), 'posts', id);
    const found = await tx.get(ref);
    if (!found.exists() || found.data().authorId !== uid) throw new Error('No podés modificar esta publicación.');
    if (remove) tx.delete(ref);
    else tx.update(ref, { description: text });
  });
}
