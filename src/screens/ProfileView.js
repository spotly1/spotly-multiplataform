import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useConnection } from '../context/ConnectionContext';
import { useProfile } from '../hooks/useProfile';
import { useAction, useLiveData } from '../hooks/useLiveData';
import { observePosts, observeRelations, setFollowing } from '../services/profileSocialService';
import { logout } from '../services/authService';
import UserAvatar from '../components/UserAvatar';
import EditProfileModal from '../components/EditProfileModal';
import PostPhoto from '../components/PostPhoto';
import { Header, Feedback, ActionButton, ui } from '../components/ProfileUi';

function Stat({ value, label, onPress }) {
  const content = <><Text style={styles.number}>{value}</Text><Text style={styles.statLabel}>{label}</Text></>;
  return onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label + ': ' + value} style={styles.stat}>{content}</Pressable>
    : <View style={styles.stat}>{content}</View>;
}
export default function ProfileView({ uid, onBack, onPost, onPeople, onBusy }) {
  const { user } = useAuth();
  const { online } = useConnection();
  const own = user.uid === uid;
  const state = useProfile(uid);
  const posts = useLiveData(useCallback((next, fail) => observePosts(uid, own, next, fail), [uid, own]));
  const followers = useLiveData(useCallback((next, fail) => observeRelations(uid, 'followers', next, fail), [uid]));
  const following = useLiveData(useCallback((next, fail) => observeRelations(uid, 'following', next, fail), [uid]));
  const action = useAction();
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { onBusy(action.busy); return () => onBusy(false); }, [action.busy, onBusy]);
  const isFollowing = followers.data?.includes(user.uid);
  return <SafeAreaView style={ui.safe}><View style={ui.page}>
    <Header title={own ? 'Mi perfil' : 'Perfil'} onBack={onBack} disabled={action.busy} />
    <FlatList data={state.status === 'ready' ? posts.data || [] : []} numColumns={3}
      keyExtractor={(item) => item.id} contentContainerStyle={{ paddingBottom: 24 }}
      columnWrapperStyle={{ gap: 3, marginBottom: 3 }}
      ListHeaderComponent={<View style={styles.content}>
        {state.status === 'ready' ? <>
          <View style={styles.identity}>
            <UserAvatar username={state.profile.username} imageUrl={state.profile.profileImageUrl} size={100} />
            <Text style={styles.username}>@{state.profile.username}</Text>
            {!!state.profile.description.trim() && <Text style={[ui.text, styles.description]}>{state.profile.description}</Text>}
          </View>
          <View style={styles.stats}>
            <Stat value={posts.data?.length ?? '—'} label="Publicaciones" />
            <Stat value={followers.data?.length ?? '—'} label="Seguidores" onPress={() => onPeople(uid, 'followers')} />
            <Stat value={following.data?.length ?? '—'} label="Seguidos" onPress={() => onPeople(uid, 'following')} />
          </View>
          {own ? <>
            <ActionButton title="Editar perfil" outline disabled={action.busy} onPress={() => { setSaved(false); setEditing(state.profile); }} />
            <ActionButton title="Cerrar sesión" busy={action.busy} onPress={() => action.run(logout)} />
          </> : <ActionButton title={isFollowing ? 'Dejar de seguir' : 'Seguir'} busy={action.busy} disabled={!online || followers.status !== 'ready'}
            onPress={() => action.run(() => setFollowing(uid, !isFollowing))} />}
          {saved && <Text accessibilityLiveRegion="polite" style={ui.muted}>Perfil actualizado.</Text>}
          {!!action.error && <Text accessibilityRole="alert" style={ui.error}>{action.error}</Text>}
          {followers.status === 'error' && <Feedback state={followers} />}
          {following.status === 'error' && <Feedback state={following} />}
          {posts.status !== 'ready' && <Feedback state={posts} />}
          {posts.status === 'ready' && posts.data.length === 0 && <Text style={ui.empty}>Todavía no hay publicaciones.</Text>}
        </> : <Feedback state={state} emptyText={state.status === 'missing' ? 'Este perfil no está disponible.' : null} />}
      </View>}
      renderItem={({ item }) => <Pressable onPress={() => onPost(item.id)} accessibilityRole="button"
        accessibilityLabel={'Abrir publicación: ' + item.description} style={styles.tile}>
        <PostPhoto uri={item.imageUrl} label={item.description} square />
      </Pressable>} />
    {!!editing && <EditProfileModal uid={uid} profile={editing} onClose={() => setEditing(null)}
      onSaved={() => { setEditing(null); setSaved(true); }} />}
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingBottom: 12 },
  identity: { alignItems: 'center', paddingTop: 24, gap: 12 },
  username: { color: '#28211E', fontSize: 23, fontWeight: '700', textAlign: 'center' },
  description: { textAlign: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 20 },
  stat: { flex: 1, minHeight: 48, padding: 4, alignItems: 'center', justifyContent: 'center' },
  number: { fontWeight: '700', fontSize: 18, color: '#28211E' },
  statLabel: { fontSize: 13, color: '#655B55', textAlign: 'center' },
  tile: { flexBasis: '32.9%', flexGrow: 0, flexShrink: 1 },
});
