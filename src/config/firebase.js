import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from './firebaseApp';

// Versión para navegador. Metro elige firebase.native.js en Android e iOS.
export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
