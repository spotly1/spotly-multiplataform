import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getFirebaseAuth } from '../config/firebase';
import { notificationTarget, notificationText } from '../services/notificationService';

if (Platform.OS !== 'web') Notifications.setNotificationHandler({ handleNotification: async () => ({
  shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
}) });
const allowed = (permission) => permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
let lastResponseId = null;

export function useLocalNotifications(uid, data, onOpen) {
  const [permission, setPermission] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const baseline = useRef(null);
  const watermark = useRef(0);
  const open = useRef(onOpen);
  open.current = onOpen;
  const queue = useRef(Promise.resolve());
  const pending = useRef(false);
  useEffect(() => {
    active.current = true;
    if (Platform.OS === 'web') return () => { active.current = false; };
    const refresh = () => Notifications.getPermissionsAsync().then((value) => {
      if (active.current) setPermission(value);
    }).catch(() => { if (active.current) setError('No se pudo consultar el permiso de notificaciones.'); });
    refresh();
    if (Platform.OS === 'android') Notifications.setNotificationChannelAsync('spotly-social', {
      name: 'Actividad de Spotly', importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => { if (active.current) setError('No se pudo preparar el canal de avisos del celular.'); });
    const appState = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    function respond(response) {
      if (!active.current || !response) return;
      const request = response.notification.request;
      const payload = request.content.data;
      if (payload?.spotly !== true || payload.recipientId !== uid || request.identifier === lastResponseId) return;
      const target = notificationTarget(payload);
      if (!target) return;
      lastResponseId = request.identifier;
      Notifications.clearLastNotificationResponse();
      open.current({ ...target, noticeId: payload.noticeId });
    }
    const listener = Notifications.addNotificationResponseReceivedListener(respond);
    try { respond(Notifications.getLastNotificationResponse()); } catch { /* No impide consultar la campanita. */ }
    return () => {
      active.current = false; appState.remove(); listener.remove();
      // Se retiran solo los avisos de esta cuenta, no los de otras apps/proyectos de Expo Go.
      Notifications.getPresentedNotificationsAsync().then((items) => Promise.all(items.filter((item) =>
        item.request.content.data?.spotly === true && item.request.content.data?.recipientId === uid)
        .map((item) => Notifications.dismissNotificationAsync(item.request.identifier)))).catch(() => {});
    };
  }, [uid]);
  useEffect(() => {
    if (!data?.confirmed || Platform.OS === 'web') return;
    const signatures = new Set(data.items.map((item) => item.id + ':' + item.createdAt?.toMillis?.()));
    const previous = baseline.current;
    const previousTime = watermark.current;
    watermark.current = Math.max(previousTime, ...data.items.map((item) => item.createdAt?.toMillis?.() || 0));
    baseline.current = signatures;
    // La primera respuesta del servidor establece una base: no dispara todos los avisos viejos.
    if (!previous) return;
    const fresh = data.items.filter((item) => !item.read && (item.createdAt?.toMillis?.() || 0) >= previousTime
      && !previous.has(item.id + ':' + item.createdAt?.toMillis?.()) && notificationTarget(item));
    if (!permission || !allowed(permission)) return;
    for (const notice of fresh) {
      queue.current = queue.current.catch(() => {}).then(async () => {
        if (!active.current || getFirebaseAuth().currentUser?.uid !== uid) return;
        const identifier = await Notifications.scheduleNotificationAsync({
          content: { title: 'Spotly', body: notificationText(notice), data: {
            spotly: true, recipientId: uid, noticeId: notice.id, type: notice.type, actorId: notice.actorId, postId: notice.postId || '',
          } },
          trigger: Platform.OS === 'android' ? { channelId: 'spotly-social' } : null,
        });
        if (!active.current || getFirebaseAuth().currentUser?.uid !== uid) await Notifications.dismissNotificationAsync(identifier);
      }).catch(() => { if (active.current) setError('No se pudo mostrar un aviso del celular. La campanita sigue disponible.'); });
    }
  }, [data, permission, uid]);
  async function enable() {
    if (pending.current || Platform.OS === 'web') return;
    pending.current = true; setBusy(true); setError(null);
    try {
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('spotly-social', {
        name: 'Actividad de Spotly', importance: Notifications.AndroidImportance.DEFAULT,
      });
      const current = await Notifications.getPermissionsAsync();
      if (!allowed(current) && !current.canAskAgain) { await Linking.openSettings(); return; }
      const result = allowed(current) ? current : await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: false, allowBadge: false } });
      if (active.current) setPermission(result);
    } catch { if (active.current) setError('No se pudieron activar los avisos del celular.'); }
    finally { pending.current = false; if (active.current) setBusy(false); }
  }
  return { enable, busy, error, supported: Platform.OS !== 'web', enabled: !!permission && allowed(permission),
    denied: !!permission && !allowed(permission) && !permission.canAskAgain };
}
