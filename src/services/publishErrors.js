export function publishErrorMessage(error) {
  switch (error?.code) {
    case 'permission-denied':
      return 'Firestore rechazó el guardado. Hay que revisar las reglas publicadas y los datos del perfil; no es un error de conexión.';
    case 'unauthenticated':
    case 'auth/user-token-expired':
      return 'Tu sesión venció. Volvé a iniciar sesión.';
    case 'unavailable':
      return 'Firebase no está disponible. Revisá tu conexión y reintentá.';
    case 'deadline-exceeded':
      return 'Firebase tardó demasiado en responder. Reintentá el mismo envío.';
    case 'invalid-argument':
      return 'Firebase recibió un dato de publicación inválido. Hay que revisar el formato enviado.';
    case 'failed-precondition':
      return 'Firebase no pudo completar el guardado por su configuración actual.';
    case 'resource-exhausted':
      return 'Firebase alcanzó un límite de uso. Intentá más tarde.';
    default:
      return error?.message || 'No se pudo completar la publicación.';
  }
}
