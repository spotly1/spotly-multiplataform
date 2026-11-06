import { getApp, getApps, initializeApp } from 'firebase/app';

// Expo necesita estas referencias explícitas para incluir la configuración.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseApp() {
  if (Object.values(config).some((value) => !value?.trim())) {
    const error = new Error('Falta la configuración local de Firebase.');
    error.code = 'app/missing-config';
    throw error;
  }
  return getApps().length ? getApp() : initializeApp(config);
}
