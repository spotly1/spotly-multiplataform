import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirebaseApp } from './firebaseApp';

let auth;
export function getFirebaseAuth() {
  if (auth) return auth;
  const app = getFirebaseApp();
  try {
    // Firebase conserva la sesión; nosotros no guardamos la contraseña.
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error.code !== 'auth/already-initialized') throw error;
    auth = getAuth(app);
  }
  return auth;
}
