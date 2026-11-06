# Spotly multiplataforma

MVP de Spotly migrado a **React Native, Expo y JavaScript**, para Android e iOS. Comparte Firebase y Cloudinary con la aplicación Android original; no crea otra base de datos.

**Integrantes:** Agustin Cabeda y Bruno Said.

## Funcionalidades

- Registro, login y sesión persistente con Firebase Authentication.
- Inicio con publicaciones propias y de seguidos; Explorar excluye esas cuentas y carga más al bajar.
- Publicaciones con cámara o galería, descripción y ubicación opcional; dirección pulsable y mapa OpenStreetMap.
- Perfil editable, cuadrícula y detalle; edición y eliminación de publicaciones propias.
- Seguidores, seguidos, likes y listas de personas.
- Búsqueda por inicio del username, sin distinguir mayúsculas en los nombres normalizados: hasta 20 resultados. Guarda las últimas 10 búsquedas enviadas o usadas para abrir un perfil, separadas por cuenta en este dispositivo; permite quitarlas.
- Campanita con indicador de no leídas, últimas 50 notificaciones y filtro sin leer. Tocar un aviso lo marca como leído y abre el perfil o post correspondiente.
- Avisos locales del celular, con permiso opcional desde la campanita. No son push: aparecen al recibir actividad nueva mientras Spotly sigue ejecutándose; no se garantiza recepción con la app cerrada o suspendida. No se reenvían los avisos antiguos al abrir sesión.

Incluye caché offline de solo lectura con AsyncStorage: hasta 50 publicaciones de Inicio y 50 de Explorar, separadas por cuenta. Muestra un banner sin Internet y bloquea publicar, dar/quitar likes y seguir/dejar de seguir; no encola acciones para sincronizarlas después. Al recuperar conexión vuelve a consultar Firebase. El tema oscuro queda fuera de este MVP.

La caché conserva datos y URLs, no descarga las fotos para uso offline: su disponibilidad depende de la caché del dispositivo. Perfiles, detalles, búsqueda y mapas requieren conexión; sin datos guardados se muestra un mensaje. La copia local puede estar desactualizada y no está cifrada; se elimina al borrar los datos de la app.

## Ejecutar

1. Instalar Node.js compatible con Expo SDK 58 y ejecutar `npm install`.
2. Copiar `.env.example` a `.env` y completar la configuración de una **app web** del proyecto Firebase de Spotly (Firebase Console → Configuración del proyecto → Tus apps → `</>`).
3. Ejecutar `npm start` y abrir el QR con Expo Go compatible con el SDK. PC y celular deben poder comunicarse en la red.

No se necesita `google-services.json` para este flujo con el SDK JavaScript. La cuenta de Expo no reemplaza la cuenta de Spotly. `.env` no se versiona; sus valores `EXPO_PUBLIC_*` son configuración de cliente, nunca secretos administrativos.

En Android también puede abrirse un emulador y presionar `a`. Para iOS hace falta un iPhone o un simulador en macOS: Windows no ejecuta el simulador de iOS. Los avisos locales no requieren tokens push ni configurar FCM/APNs.

## Servicios e índices

Firebase Authentication administra las contraseñas. Firestore guarda perfiles públicos (`users`), emails privados (`privateUsers`), reservas de username (`usernames`), publicaciones, follows, likes y notificaciones. Cloudinary guarda las fotos; la app usa el cloud `iufz7yvd` y el preset unsigned `spotly_unsigned`, sin API secret.

Al usar **el mismo proyecto Firebase**, las reglas e índices ya publicados se comparten: cada integrante no debe volver a crearlos. Si se configura otro backend, un administrador debe adaptar y publicar las reglas del proyecto nativo y habilitar Authentication por correo/contraseña. Índices compuestos usados (ámbito colección):

| Colección | Campos, en orden |
|---|---|
| `posts` | `authorId` ascendente, `createdAt` descendente |
| `notifications` | `recipientId` ascendente, `createdAt` descendente |
| `notifications` | `recipientId` ascendente, `read` ascendente, `createdAt` descendente |

La búsqueda usa el índice de campo único `username`. Este proyecto no despliega reglas ni índices automáticamente. Los likes y follows crean sus avisos en la misma transacción, respetando el formato del nativo.

Las fotos se preparan como JPEG al 80 % (máximo 1600 px en posts y 1024 px en perfil). Se conserva la imagen subida al reintentar un guardado dentro del mismo borrador. Borrar o reemplazar una foto no elimina el archivo remoto de Cloudinary. La ubicación se solicita solo al agregarla; no hay seguimiento en segundo plano. Si no se resuelve la dirección, el mapa sigue disponible con las coordenadas guardadas.

## Organización

`Pantallas → hooks → servicios → Firebase / Cloudinary / APIs del dispositivo`.

- `App.js` y `src/context/AuthContext.js`: sesión y entrada a la app.
- `src/screens/MainScreen.js`: pestañas y navegación a detalles.
- `src/screens`: interfaz de cada pantalla.
- `src/hooks`: estado, validaciones, suscripciones y avisos locales.
- `src/services`: consultas, transacciones, recientes, imágenes y ubicación.
- `src/components`: elementos compartidos; `src/config`: Firebase.

Los datos de Firestore actualizan los hooks mediante listeners, y React vuelve a dibujar las pantallas. AsyncStorage conserva la sesión, búsquedas recientes y copias del feed como JSON; no guarda contraseñas. `ConnectionContext` observa la conexión con NetInfo y `useCachedFeed` alterna entre el servidor y la copia local. No se configura una base SQLite ni se usa Room.

## Revisión en dispositivos

El empaquetado no reemplaza la revisión manual. Antes de entregar, comprobar en Android e iOS: registro/login, cámara y galería, publicación y mapa, búsqueda y recientes al cambiar de cuenta, follow/like entre dos cuentas, campanita y lectura, permisos aceptados/rechazados y apertura desde un aviso local. Verificar también volver atrás y los mensajes cuando un post ya no existe.

Para revisar el modo offline, cargar Inicio y Explorar con Internet y luego desactivar Wi-Fi y datos móviles sin cerrar Expo Go. Deben aparecer el banner y las publicaciones guardadas, bloquearse las acciones de escritura indicadas y actualizarse las listas al reconectar. Reiniciar Expo Go sin red puede impedir cargar el proyecto desde la PC: esa limitación del entorno de desarrollo no comprueba el arranque offline de una app instalada.
