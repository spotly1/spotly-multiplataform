import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from 'firebase/firestore';

const pending = new Map();
const keyFor = (uid, kind) => 'spotly:feed:v1:' + uid + ':' + kind;
async function read(key) {
  const value = JSON.parse(await AsyncStorage.getItem(key) || 'null');
  return value?.version === 1 && Array.isArray(value.posts) ? value : null;
}
function enqueue(key, change) {
  const task = (pending.get(key) || Promise.resolve()).catch(() => {}).then(async () => {
    const value = await change(await read(key).catch(() => null));
    if (value) await AsyncStorage.setItem(key, JSON.stringify(value));
  });
  pending.set(key, task);
  task.finally(() => { if (pending.get(key) === task) pending.delete(key); }).catch(() => {});
  return task;
}
export async function readFeedCache(uid, kind) {
  const key = keyFor(uid, kind);
  await pending.get(key)?.catch(() => {});
  const cached = await read(key);
  if (!cached) return null;
  return { ...cached, posts: cached.posts.filter((post) => typeof post.id === 'string' && typeof post.authorId === 'string'
    && typeof post.description === 'string' && typeof post.imageUrl === 'string').slice(0, 50).map((post) => ({ ...post,
    createdAt: Number.isFinite(post.createdAtMillis) ? Timestamp.fromMillis(post.createdAtMillis) : null,
  })) };
}
export function saveFeedCache(uid, kind, state, knownAuthors = new Map()) {
  return enqueue(keyFor(uid, kind), (previous) => {
    const authors = new Map(previous?.posts.map((post) => [post.authorId, post.cachedAuthor]) || []);
    return { version: 1, savedAt: Date.now(), hasFollowing: state.hasFollowing ?? null,
      posts: state.posts.slice(0, 50).map((post) => ({ id: post.id, authorId: post.authorId,
        description: post.description, imageUrl: post.imageUrl,
        createdAtMillis: post.createdAt?.toMillis?.() ?? null,
        location: post.location ? { latitude: post.location.latitude, longitude: post.location.longitude } : null,
        cachedAuthor: knownAuthors.get(post.authorId) || authors.get(post.authorId) || null,
      })) };
  });
}
export function saveFeedAuthor(uid, kind, authorId, profile) {
  return enqueue(keyFor(uid, kind), (previous) => previous ? { ...previous, posts: previous.posts.map((post) =>
    post.authorId === authorId ? { ...post, cachedAuthor: { username: profile.username, profileImageUrl: profile.profileImageUrl } } : post) } : null);
}
