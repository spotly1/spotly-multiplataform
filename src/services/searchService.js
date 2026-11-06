import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, endAt, getDocsFromServer, getFirestore, limit, orderBy, query, startAt } from 'firebase/firestore';
import { getFirebaseApp } from '../config/firebaseApp';

export const normalizeSearch = (value) => value.trim().toLowerCase().slice(0, 30);
const key = (uid) => 'spotly:recent-searches:' + uid;
export async function searchUsers(value) {
  const prefix = normalizeSearch(value);
  if (!prefix) return [];
  const snapshot = await getDocsFromServer(query(collection(getFirestore(getFirebaseApp()), 'users'),
    orderBy('username'), startAt(prefix), endAt(prefix + '\uf8ff'), limit(20)));
  return snapshot.docs.map((item) => ({ uid: item.id, ...item.data() }));
}
export async function readRecentSearches(uid) {
  const stored = JSON.parse(await AsyncStorage.getItem(key(uid)) || '[]');
  return Array.isArray(stored) ? [...new Set(stored.filter((s) => typeof s === 'string').map(normalizeSearch).filter(Boolean))].slice(0, 10) : [];
}
export const saveRecentSearches = (uid, values) => AsyncStorage.setItem(key(uid), JSON.stringify(values.slice(0, 10)));
