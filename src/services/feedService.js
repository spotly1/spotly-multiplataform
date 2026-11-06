import { collection, documentId, getDocsFromServer, getFirestore, limit, onSnapshot, orderBy, query, startAfter, where } from 'firebase/firestore';
import { getFirebaseApp } from '../config/firebaseApp';
import { observeRelations } from './profileSocialService';

const db = () => getFirestore(getFirebaseApp());
const mapPost = (snapshot) => ({ ...snapshot.data(), id: snapshot.id });
const sortPosts = (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0) || b.id.localeCompare(a.id);

export function observeHome(uid, next, fail) {
  let stops = [];
  let generation = 0;
  let active = true;
  function clear() { stops.forEach((stop) => stop()); stops = []; }
  const relationStop = observeRelations(uid, 'following', (following) => {
    clear();
    const current = ++generation;
    const ids = [...new Set([uid, ...following])];
    const groups = [];
    for (let i = 0; i < ids.length; i += 30) groups.push(ids.slice(i, i + 30));
    const pages = new Array(groups.length);
    // No mostramos el lote de una lista de seguidos anterior.
    next({ posts: [], hasFollowing: following.length > 0, loading: true });
    groups.forEach((authors, index) => {
      const ref = query(collection(db(), 'posts'), where('authorId', 'in', authors), orderBy('createdAt', 'desc'), limit(50));
      stops.push(onSnapshot(ref, { includeMetadataChanges: true }, (snapshot) => {
        if (!active || current !== generation) return;
        if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
        pages[index] = snapshot.docs.map(mapPost);
        if (pages.filter(Boolean).length !== groups.length) return;
        const unique = new Map(pages.flat().map((post) => [post.id, post]));
        next({ posts: [...unique.values()].sort(sortPosts).slice(0, 50), hasFollowing: following.length > 0, loading: false });
      }, (error) => { if (active && current === generation) fail(error); }));
    });
  }, (error) => { clear(); generation++; if (active) fail(error); }, true);
  return () => { active = false; generation++; relationStop(); clear(); };
}
export async function loadExplorePage(cursor) {
  const constraints = [orderBy('createdAt', 'desc'), orderBy(documentId(), 'desc'), limit(50)];
  if (cursor) constraints.push(startAfter(cursor));
  let timer;
  try {
    const snapshot = await Promise.race([
      getDocsFromServer(query(collection(db(), 'posts'), ...constraints)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('La consulta tardó demasiado.')), 20000); }),
    ]);
    return { posts: snapshot.docs.map(mapPost), cursor: snapshot.docs.at(-1) || null, hasMore: snapshot.size === 50 };
  } finally { clearTimeout(timer); }
}
