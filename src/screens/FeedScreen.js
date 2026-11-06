import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useLiveData } from '../hooks/useLiveData';
import { useExplore } from '../hooks/useExplore';
import { observeHome } from '../services/feedService';
import FeedCard from '../components/FeedCard';
import CachedFeedCard from '../components/CachedFeedCard';
import { useConnection } from '../context/ConnectionContext';
import { useCachedFeed } from '../hooks/useCachedFeed';
const EMPTY_POSTS = [];
import { ActionButton, Feedback, ui } from '../components/ProfileUi';

export default function FeedScreen(props) {
  return props.explore ? <ExploreFeed {...props} /> : <HomeFeed {...props} />;
}
function HomeFeed(props) {
  const { user } = useAuth();
  const { online } = useConnection();
  const live = useLiveData(useCallback((next, fail) => {
    if (online) return observeHome(user.uid, next, fail);
    next(null);
  }, [user.uid, online]));
  const current = { ...live, status: live.data?.loading || !live.data ? 'loading' : live.status, posts: live.data?.posts || EMPTY_POSTS,
    hasFollowing: live.data?.hasFollowing, hasMore: false, loadingMore: false };
  if (live.status === 'error') current.status = 'error';
  const state = useCachedFeed(user.uid, 'home', current);
  return <FeedContent {...props} state={state} />;
}
function ExploreFeed(props) {
  const { user } = useAuth();
  const { online } = useConnection();
  const live = useExplore(user.uid, online);
  const state = useCachedFeed(user.uid, 'explore', live);
  return <FeedContent {...props} state={state} />;
}
function FeedContent({ explore, state, onCreate, onPost, onUser, onPeople, onExplore, onNotifications, hasUnread, unreadError }) {
  return <SafeAreaView style={ui.safe} edges={['top', 'left', 'right']}><View style={ui.page}>
    <View style={ui.header}>
      <Text style={[ui.title, { flex: 1 }]} accessibilityRole="header">{explore ? 'Explorar' : 'Inicio'}</Text>
      <Pressable style={ui.touch} onPress={onNotifications} accessibilityRole="button" accessibilityLabel={hasUnread ? 'Notificaciones sin leer' : unreadError ? 'Notificaciones: no se pudo consultar el indicador' : 'Notificaciones'}>
        <Ionicons name="notifications-outline" size={24} color="#B63B17" />
        {(hasUnread || unreadError) && <View style={{ position: 'absolute', right: 6, top: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: hasUnread ? '#B63B17' : '#655B55' }} />}
      </Pressable>
      <Pressable disabled={!state.online} style={[ui.touch, !state.online && { opacity: 0.4 }]} onPress={state.retry} accessibilityRole="button" accessibilityLabel="Actualizar publicaciones"><Ionicons name="refresh-outline" size={23} color="#B63B17" /></Pressable>
      <Pressable disabled={!state.online} style={[ui.touch, !state.online && { opacity: 0.4 }]} onPress={onCreate} accessibilityRole="button" accessibilityLabel="Crear publicación"><Ionicons name="add" size={29} color="#B63B17" /></Pressable>
    </View>
    <FlatList data={state.posts} keyExtractor={(post) => post.id} initialNumToRender={4} windowSize={5}
      refreshing={state.online && state.status === 'loading' && !state.loadingMore} onRefresh={state.online ? state.retry : undefined}
      onEndReachedThreshold={0.5} onEndReached={() => {
        if (explore && state.hasMore && !state.loadingMore && !state.error && state.status === 'ready') state.loadMore();
      }}
      ListHeaderComponent={<>
        {!!state.cacheError && <Text style={[ui.error, { padding: 16 }]}>{state.cacheError}</Text>}
        {!state.online && !!state.savedAt && <Text style={[ui.muted, { padding: 16 }]}>Última copia: {new Date(state.savedAt).toLocaleString('es-AR')}. Las fotos pueden no estar disponibles.</Text>}
        {state.online && !explore && state.status === 'ready' && state.hasFollowing === false && state.posts.length > 0
          && <Text style={[ui.muted, { padding: 16 }]}>Acá ves tus publicaciones. Seguí personas desde Explorar para ver también sus descubrimientos.</Text>}
      </>}
      ListEmptyComponent={state.status !== 'ready' ? <Feedback state={state} /> :
        !state.hasMore ? <View style={ui.space}>
          <Text style={ui.empty}>{!state.online ? 'No hay publicaciones guardadas en esta sección. Cargalas con Internet para verlas después.' : explore ? 'No hay nuevas publicaciones para explorar. Volvé más tarde.'
            : state.hasFollowing ? 'Todavía no hay publicaciones de las personas que seguís.'
            : 'Seguí personas para descubrir sus publicaciones. También aparecerán las tuyas.'}</Text>
          {!explore && <ActionButton title="Ir a Explorar" onPress={onExplore} outline />}
        </View> : null}
      renderItem={({ item }) => state.online
        ? <FeedCard post={item} onPost={onPost} onUser={onUser} onPeople={onPeople} onAuthor={state.rememberAuthor} />
        : <CachedFeedCard post={item} />}
      ListFooterComponent={explore && state.hasMore ? <View style={ui.space}>
        {!!state.error && state.status !== 'error' && <Text style={ui.error}>{state.error}</Text>}
        {state.loadingMore ? <ActivityIndicator color="#B63B17" /> :
          <ActionButton title={state.error ? 'Reintentar carga' : 'Cargar más'} outline onPress={state.loadMore} />}
      </View> : null}
      contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }} />
  </View></SafeAreaView>;
}
