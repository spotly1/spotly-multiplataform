import * as Location from 'expo-location';
import { Platform } from 'react-native';

async function withTimeout(promise, milliseconds) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('La ubicación tardó demasiado. Volvé a intentar.')), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}
export async function getCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Permití usar tu ubicación desde los ajustes o publicá sin ubicación.');
  if (!(await Location.hasServicesEnabledAsync())) throw new Error('Activá la ubicación del dispositivo para continuar.');
  const result = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 20000);
  return { latitude: result.coords.latitude, longitude: result.coords.longitude };
}
const cache = new Map();
const pending = new Map();
let queue = Promise.resolve();
export async function resolveAddress(point) {
  if (!point) return null;
  const key = point.latitude.toFixed(5) + ',' + point.longitude.toFixed(5);
  if (cache.has(key)) return cache.get(key);
  if (pending.has(key)) return pending.get(key);
  const task = queue.then(async () => {
    try {
      // Nunca solicitar permisos solo por mirar una publicación.
      if (Platform.OS === 'android' && !(await Location.getForegroundPermissionsAsync()).granted) return null;
      const results = await withTimeout(Location.reverseGeocodeAsync(point), 8000);
      const address = results[0];
      if (!address) return null;
      const street = [address.street, address.streetNumber].filter(Boolean).join(' ');
      const text = [...new Set([street || address.name, address.city || address.district, address.region].filter(Boolean))].join(', ');
      if (!text) return null;
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(key, text);
      return text;
    } catch { return null; }
  });
  queue = task.catch(() => null);
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
