import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLiveData } from '../hooks/useLiveData';
import { FlatList, Pressable, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import UserAvatar from '../components/UserAvatar';
import { ActionButton, Feedback, Header, ui } from '../components/ProfileUi';
import { notificationText, observeNotifications } from '../services/notificationService';

export default function NotificationsScreen({ state: allState, unreadState, local, onBack, onOpen, action }) {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const { user } = useAuth();
  const filtered = useLiveData(useCallback((next, fail) => {
    if (onlyUnread) return observeNotifications(user.uid, next, fail, true);
    next({ items: [] });
  }, [user.uid, onlyUnread]));
  const state = onlyUnread ? filtered : allState;
  const items = state.data?.items || [];
  return <SafeAreaView style={ui.safe} edges={['top', 'left', 'right']}><View style={ui.page}>
    <Header title="Notificaciones" onBack={onBack} disabled={action.busy} />
    <FlatList data={items} keyExtractor={(item) => item.id} refreshing={state.status === 'loading'} onRefresh={state.retry}
      ListHeaderComponent={<View style={{ padding: 16, gap: 8 }}>
        {local.supported && <>
          <Text style={ui.muted}>{local.enabled ? 'Avisos del celular activados.' : 'Activá los avisos del celular para la actividad nueva que recibe Spotly.'} No son push: con la app cerrada no se garantiza su entrega.</Text>
          {!local.enabled && <ActionButton title={local.denied ? 'Abrir ajustes de notificaciones' : 'Activar avisos del celular'} onPress={local.enable} busy={local.busy} outline />}
        </>}
        {!!local.error && <Text style={ui.error}>{local.error}</Text>}
        {!!action.error && <Text style={ui.error}>{action.error}</Text>}
        {unreadState.status === 'error' && <><Text style={ui.error}>No se pudo consultar el indicador de no leídas.</Text><ActionButton title="Reintentar indicador" onPress={unreadState.retry} outline /></>}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={ui.text}>Solo sin leer</Text>
          <Switch value={onlyUnread} onValueChange={setOnlyUnread} accessibilityLabel="Mostrar solo notificaciones sin leer" trackColor={{ true: '#B63B17' }} /></View>
        <Text style={ui.muted}>Últimas 50 notificaciones{onlyUnread ? ' sin leer' : ''}.</Text>
      </View>}
      ListEmptyComponent={<Feedback state={state} emptyText={state.status === 'ready' ? (onlyUnread ? 'No hay avisos sin leer en esta lista.' : 'Todavía no tenés notificaciones.') : undefined} />}
      renderItem={({ item }) => <Pressable disabled={action.busy} accessibilityRole="button" accessibilityLabel={(item.read ? '' : 'Sin leer. ') + notificationText(item)}
        onPress={() => onOpen(item)} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: item.read ? 'transparent' : '#FCE6DA', borderBottomWidth: 1, borderBottomColor: '#E9DED7' }}>
        <UserAvatar username={item.actor?.username} imageUrl={item.actor?.profileImageUrl} size={46} />
        <View style={{ flex: 1, gap: 4 }}><Text style={[ui.text, { fontWeight: item.read ? '400' : '600' }]}>{notificationText(item)}</Text>
          <Text style={ui.muted}>{item.createdAt?.toDate?.().toLocaleString('es-AR') || ''}</Text></View>
        <Ionicons name={item.type === 'like' ? 'heart' : 'person-add'} color="#B63B17" size={21} />
      </Pressable>} />
  </View></SafeAreaView>;
}
