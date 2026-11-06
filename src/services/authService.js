import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';

export function observeSession(onChange, onError) {
  return onAuthStateChanged(getFirebaseAuth(), onChange, onError);
}

export function login(email, password) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export function logout() {
  return signOut(getFirebaseAuth());
}

export function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'La contraseña no cumple los requisitos de seguridad de Firebase.';
    case 'app/username-taken':
      return 'Ese nombre de usuario ya está en uso. Elegí otro.';
    case 'app/registration-failed':
      return 'No se pudo guardar el perfil. Revisá tu conexión e intentá nuevamente.';
    case 'app/registration-cleanup-failed':
      return 'No se completó el perfil ni se pudo eliminar la cuenta recién creada. Contactá al administrador antes de reintentar con ese correo.';
    case 'app/missing-config':
      return 'Falta configurar Firebase en el archivo .env. Completalo y reiniciá Expo.';
    case 'auth/invalid-email':
      return 'Ingresá un correo válido.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada.';
    case 'auth/too-many-requests':
      return 'Hubo demasiados intentos. Esperá un momento y volvé a intentar.';
    case 'auth/network-request-failed':
      return 'No pudimos conectar. Revisá tu conexión a Internet.';
    case 'auth/operation-not-allowed':
      return 'El acceso con correo y contraseña no está habilitado en Firebase.';
    case 'auth/invalid-api-key':
    case 'auth/app-not-authorized':
      return 'La configuración de Firebase no permite conectar esta app. Revisá los datos del proyecto.';
    default:
      return 'No pudimos completar la operación. Intentá nuevamente.';
  }
}
