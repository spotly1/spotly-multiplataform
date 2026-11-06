import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useConnection } from '../context/ConnectionContext';
import { useProfile } from '../hooks/useProfile';
import { useAction, useLiveData } from '../hooks/useLiveData';
import { changePost, observeLikes, observePost, setLiked } from '../services/profileSocialService';
import { Header, Feedback, ActionButton, ui } from '../components/ProfileUi';
import UserAvatar from '../components/UserAvatar';
import PostPhoto from '../components/PostPhoto';
import PostLocation from '../components/PostLocation';

export default function PostDetailScreen(props) {
  const state = useLiveData(useCallback((next, fail) => observePost(props.id, next, fail), [props.id]));
  const previouslyLoaded = useRef(false);
  useEffect(() => {
    if (state.status !== 'ready') return;
    if (state.data) previouslyLoaded.current = true;
    else if (previouslyLoaded.current) props.onBack();
  }, [state.status, state.data, props.onBack]);
  if (state.status !== 'ready' || !state.data) return <SafeAreaView style={ui.safe}><View style={ui.page}>
    <Header title="Publicación" onBack={props.onBack} /><Feedback state={state} emptyText={state.status === 'ready' ? 'Esta publicación ya no está disponible.' : null} />
  </View></SafeAreaView>;
  return <PostContent {...props} post={state.data} />;
}
function PostContent({ post, id, onBack, onUser, onPeople, onBusy, onEditing }) {
  const { user } = useAuth();
  const { online } = useConnection();
  const author = useProfile(post.authorId);
  const likes = useLiveData(useCallback((next, fail) => observeLikes(id, next, fail), [id]));
  const action = useAction();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const own = post.authorId === user.uid;
  const liked = likes.data?.includes(user.uid);
  useEffect(() => { onBusy(action.busy); return () => onBusy(false); }, [action.busy, onBusy]);
  useEffect(() => { onEditing(editing ? () => setEditing(false) : null); return () => onEditing(null); }, [editing, onEditing]);
  function options() {
    Alert.alert('Publicación', '¿Qué querés hacer?', [
      { text: 'Editar descripción', onPress: () => { setDescription(post.description); setEditing(true); setSaved(false); } },
      { text: 'Eliminar publicación', style: 'destructive', onPress: () => {
        Alert.alert('Eliminar publicación', 'Esta acción no se puede deshacer.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: async () => { if (await action.run(() => changePost(id, '', true))) onBack(); } },
        ]);
      } },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }
  const date = post.createdAt?.toDate?.();
  return <SafeAreaView style={ui.safe}><View style={ui.page}>
    <Header title={editing ? 'Editar publicación' : 'Publicación'} onBack={() => editing ? setEditing(false) : onBack()} disabled={action.busy} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={styles.author}>
          <Pressable disabled={action.busy} onPress={() => onUser(post.authorId)} accessibilityRole="button" style={styles.authorLink}>
            <UserAvatar username={author.profile?.username} imageUrl={author.profile?.profileImageUrl} size={44} />
            <View style={{ flex: 1 }}><Text style={[ui.text, { fontWeight: '600' }]} numberOfLines={1}>@{author.profile?.username || 'usuario'}</Text>
              {date && <Text style={ui.muted}>{date.toLocaleDateString('es-AR')}</Text>}</View>
          </Pressable>
          {own && !editing && <Pressable disabled={action.busy} onPress={options} accessibilityRole="button" accessibilityLabel="Opciones de publicación" style={ui.touch}><Text style={{ fontSize: 27 }}>⋮</Text></Pressable>}
        </View>
        <PostPhoto uri={post.imageUrl} label={post.description} />
        <View style={{ padding: 12, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable disabled={!online || action.busy || likes.status !== 'ready'} accessibilityRole="button" accessibilityLabel={liked ? 'Quitar me gusta' : 'Me gusta'}
              accessibilityState={{ selected: !!liked, disabled: !online || action.busy || likes.status !== 'ready' }} onPress={() => action.run(() => setLiked(id, !liked))}
              style={ui.touch}><Text style={{ fontSize: 28, color: liked ? '#C52C3A' : '#28211E' }}>{liked ? '♥' : '♡'}</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Ver personas que dieron me gusta" onPress={() => onPeople(id, 'likes')} disabled={action.busy} style={ui.touch}>
              <Text style={ui.text}>{likes.data?.length ?? '—'}</Text>
            </Pressable>
          </View>
          {likes.status === 'error' && <Feedback state={likes} />}
          {editing ? <>
            <Text style={ui.muted}>Solo podés modificar la descripción.</Text>
            <TextInput multiline maxLength={1000} editable={!action.busy} accessibilityLabel="Descripción de la publicación"
              value={description} onChangeText={setDescription} style={styles.input} textAlignVertical="top" />
            <Text style={ui.muted}>{description.length}/1000</Text>
          </> : <Text style={ui.text}>{post.description}</Text>}
          <PostLocation location={post.location} />
          {!!action.error && <Text style={ui.error} accessibilityRole="alert">{action.error}</Text>}
          {saved && <Text style={ui.link} accessibilityLiveRegion="polite">Cambios guardados.</Text>}
          {editing && <>
            <ActionButton title="Guardar cambios" busy={action.busy} disabled={!description.trim()} onPress={async () => {
              if (await action.run(() => changePost(id, description))) { setEditing(false); setSaved(true); }
            }} />
            <ActionButton title="Cancelar" outline disabled={action.busy} onPress={() => setEditing(false)} />
          </>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({
  author: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  authorLink: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#B8AAA1', borderRadius: 16, backgroundColor: '#fff', padding: 14, minHeight: 120, fontSize: 16, color: '#28211E' },
});
