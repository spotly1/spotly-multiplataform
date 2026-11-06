import { createUserWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { doc, getFirestore, runTransaction } from 'firebase/firestore';
import { getFirebaseAuth } from '../config/firebase';
import { getFirebaseApp } from '../config/firebaseApp';

function registrationError(code) {
  return Object.assign(new Error(code), { code });
}

export async function registerAccount({ username, email, password }) {
  const auth = getFirebaseAuth();
  const db = getFirestore(getFirebaseApp());
  const name = username.trim().toLowerCase();
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    // Los tres documentos se guardan juntos, igual que en Spotly nativa.
    await runTransaction(db, async (transaction) => {
      const nameRef = doc(db, 'usernames', name);
      if ((await transaction.get(nameRef)).exists()) {
        throw registrationError('app/username-taken');
      }
      transaction.set(nameRef, { uid: user.uid });
      transaction.set(doc(db, 'users', user.uid), {
        username: name, description: '', profileImageUrl: '', profileImagePublicId: '',
      });
      transaction.set(doc(db, 'privateUsers', user.uid), { email: user.email });
    });
    return user;
  } catch (error) {
    // Auth y Firestore no comparten transacción: deshacer solo la cuenta recién creada.
    try {
      await deleteUser(user);
    } catch {
      try { await signOut(auth); } catch { /* Se informa que la limpieza falló. */ }
      throw registrationError('app/registration-cleanup-failed');
    }
    if (error.code === 'app/username-taken') throw error;
    throw registrationError('app/registration-failed');
  }
}
