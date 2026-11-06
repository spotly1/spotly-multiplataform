import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { requireConnection } from './connectionService';

export const pickProfileImage = (camera) => pickImage(camera, true);
export const pickPostImage = (camera) => pickImage(camera, false);

async function pickImage(camera, profile) {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permití usar la cámara desde los ajustes del dispositivo para tomar una foto.');
    }
  }
  const options = { mediaTypes: ['images'], allowsEditing: profile, ...(profile ? { aspect: [1, 1] } : {}), quality: 0.9 };
  const result = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  const maxSize = profile ? 1024 : 1600;
  if (asset.width > maxSize || asset.height > maxSize) {
    context.resize(asset.width >= asset.height ? { width: maxSize } : { height: maxSize });
  }
  const image = await context.renderAsync();
  try {
    return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  } finally {
    image.release();
    context.release();
  }
}

export const uploadProfileImage = (uid, image) => uploadImage(uid, image, 'profiles');
export const uploadPostImage = (uid, image) => uploadImage(uid, image, 'posts');

async function uploadImage(uid, image, folder) {
  await requireConnection();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const body = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(image.uri, { signal: controller.signal })).blob();
      body.append('file', blob, 'profile.jpg');
    } else {
      // Expo 58 serializa File/Blob; el objeto antiguo { uri, name, type } no es compatible.
      const file = new File(image.uri);
      if (!file.exists || file.size <= 0) {
        throw Object.assign(new Error('La foto temporal ya no está disponible. Volvé a elegirla.'), { code: 'image/file-unavailable' });
      }
      body.append('file', file);
    }
    // Mismo cloud y preset unsigned que Spotly nativa; no contiene una clave secreta.
    body.append('upload_preset', 'spotly_unsigned');
    body.append('folder', 'spotly/' + folder + '/' + uid);
    const response = await fetch('https://api.cloudinary.com/v1_1/iufz7yvd/image/upload', {
      method: 'POST', body, signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = data?.error?.message || '';
      const message = /preset|unsigned/i.test(detail)
        ? 'Cloudinary rechazó la configuración de subida (preset). Hay que revisar spotly_unsigned.'
        : response.status === 413 || /too large|file size/i.test(detail)
          ? 'Cloudinary rechazó la foto por su tamaño. Probá con otra imagen.'
          : response.status === 401 || response.status === 403
            ? 'Cloudinary no autorizó la subida. Hay que revisar la configuración del servicio.'
            : 'Cloudinary rechazó la imagen (HTTP ' + response.status + '). Probá con otra foto.';
      throw Object.assign(new Error(message), { code: 'image/http-' + response.status });
    }
    const prefix = 'spotly/' + folder + '/' + uid + '/';
    if (!data || typeof data.secure_url !== 'string' ||
        !data.secure_url.startsWith('https://res.cloudinary.com/iufz7yvd/image/upload/') ||
        typeof data.public_id !== 'string' || !data.public_id.startsWith(prefix) ||
        !data.public_id.slice(prefix.length) || data.public_id.slice(prefix.length).includes('/')) {
      throw Object.assign(new Error('La imagen se subió, pero Cloudinary devolvió una carpeta o URL incompatible con Spotly.'), { code: 'image/invalid-response' });
    }
    return { url: data.secure_url, publicId: data.public_id };
  } catch (error) {
    if (String(error.code || '').startsWith('image/')) throw error;
    if (error.name === 'AbortError') throw Object.assign(new Error('La subida de la foto tardó más de un minuto. Reintentá.'), { code: 'image/timeout' });
    throw Object.assign(new Error('No se pudo conectar con Cloudinary para subir la foto. Revisá tu conexión y reintentá.'), { code: 'image/network' });
  } finally { clearTimeout(timeout); }
}
