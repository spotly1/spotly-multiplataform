import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useConnection } from '../context/ConnectionContext';
import { useLiveData } from '../hooks/useLiveData';
import { useExplore } from '../hooks/useExplore';
import { useCachedFeed } from '../hooks/useCachedFeed';
import { useSearch } from '../hooks/useSearch';
import { observeHome } from '../services/feedService';
import FeedCard from '../components/FeedCard';
import CachedFeedCard from '../components/CachedFeedCard';
import PostPhoto from '../components/PostPhoto';
import UserAvatar from '../components/UserAvatar';
import { ActionButton, Feedback, ui } from '../components/ProfileUi';

const EMPTY_POSTS = [];

export default function FeedScreen(props) {
  return props.explore ? <ExploreFeed {...props} /> : <HomeFeed {...props} />;
}

function HomeFeed(props) {
  const { user } = useAuth();
  const { online } = useConnection();

  const live = useLiveData(
    useCallback(
      (next, fail) => {
        if (online) return observeHome(user.uid, next, fail);
        next(null);
      },
      [user.uid, online]
    )
  );

  const current = {
    ...live,
    status: live.data?.loading || !live.data ? 'loading' : live.status,
    posts: live.data?.posts || EMPTY_POSTS,
    hasFollowing: live.data?.hasFollowing,
    hasMore: false,
    loadingMore: false,
  };

  if (live.status === 'error') {
    current.status = 'error';
  }

  const state = useCachedFeed(user.uid, 'home', current);

  return <FeedContent {...props} state={state} />;
}

function ExploreFeed(props) {
  const { user } = useAuth();
  const { online } = useConnection();

  const live = useExplore(user.uid, online);
  const state = useCachedFeed(user.uid, 'explore', live);
  const search = useSearch(user.uid);

  return <ExploreContent {...props} state={state} search={search} />;
}

function ExploreContent({
  state,
  search,
  onCreate,
  onPost,
  onUser,
  onNotifications,
  hasUnread,
  unreadError,
}) {
  const searching = !!search.prefix;

  return (
    <SafeAreaView style={ui.safe} edges={['top', 'left', 'right']}>
      <View style={ui.page}>
        {/* Encabezado */}
        <View style={ui.header}>
          <Text style={[ui.title, { flex: 1 }]} accessibilityRole="header">
            Explorar
          </Text>

          <Pressable
            style={ui.touch}
            onPress={onNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
          >
            <Ionicons name="notifications-outline" size={24} color="#B63B17" />

            {(hasUnread || unreadError) && (
              <View
                style={{
                  position: 'absolute',
                  right: 6,
                  top: 6,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: hasUnread ? '#B63B17' : '#655B55',
                }}
              />
            )}
          </Pressable>

          <Pressable
            disabled={!state.online}
            style={[ui.touch, !state.online && { opacity: 0.4 }]}
            onPress={state.retry}
            accessibilityRole="button"
            accessibilityLabel="Actualizar publicaciones"
          >
            <Ionicons name="refresh-outline" size={23} color="#B63B17" />
          </Pressable>

          <Pressable
            disabled={!state.online}
            style={[ui.touch, !state.online && { opacity: 0.4 }]}
            onPress={onCreate}
            accessibilityRole="button"
            accessibilityLabel="Crear publicación"
          >
            <Ionicons name="add" size={29} color="#B63B17" />
          </Pressable>
        </View>

        <View
          style={{
            marginHorizontal: 12,
            marginTop: 8,
            marginBottom: 12,
            paddingHorizontal: 12,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#DAC9BE',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="search-outline" size={22} color="#655B55" />

          <TextInput
            value={search.text}
            onChangeText={search.setText}
            placeholder="Buscar usuarios..."
            placeholderTextColor="#655B55"
            accessibilityLabel="Buscar usuarios"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            returnKeyType="search"
            onSubmitEditing={() => {
              search.remember();
              Keyboard.dismiss();
            }}
            style={{
              flex: 1,
              padding: 12,
              minHeight: 48,
              color: '#28211E',
            }}
          />

          {!!search.text && (
            <Pressable
              style={ui.touch}
              onPress={() => search.setText('')}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <Ionicons name="close" size={20} color="#655B55" />
            </Pressable>
          )}
        </View>

        {searching ? (
          <FlatList
            key="users"
            data={search.data}
            keyExtractor={(item) => item.uid}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: 24,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <Feedback
                state={search}
                emptyText={
                  search.status === 'ready'
                    ? 'No se encontraron usuarios con ese nombre.'
                    : undefined
                }
              />
            }
            ListFooterComponent={
              search.data.length === 20 ? (
                <Text style={ui.empty}>
                  Se muestran hasta 20 resultados. Escribí más letras para
                  precisar la búsqueda.
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  search.remember();
                  Keyboard.dismiss();
                  onUser(item.uid);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                }}
              >
                <UserAvatar
                  username={item.username}
                  imageUrl={item.profileImageUrl}
                  size={48}
                />

                <View style={{ flex: 1 }}>
                  <Text style={[ui.text, { fontWeight: '700' }]}>
                    {item.username}
                  </Text>

                  {!!item.description && (
                    <Text numberOfLines={2} style={ui.muted}>
                      {item.description}
                    </Text>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={18} color="#655B55" />
              </Pressable>
            )}
          />
        ) : (
          <FlatList
            key="posts"
            data={state.posts}
            numColumns={3}
            keyExtractor={(post) => post.id}
            initialNumToRender={12}
            windowSize={5}
            columnWrapperStyle={{
              gap: 3,
              marginBottom: 3,
            }}
            contentContainerStyle={{
              paddingBottom: 24,
              flexGrow: 1,
            }}
            refreshing={
              state.online && state.status === 'loading' && !state.loadingMore
            }
            onRefresh={state.online ? state.retry : undefined}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (
                state.hasMore &&
                !state.loadingMore &&
                !state.error &&
                state.status === 'ready'
              ) {
                state.loadMore();
              }
            }}
            ListHeaderComponent={
              <>
                {!!state.cacheError && (
                  <Text style={[ui.error, { padding: 16 }]}>
                    {state.cacheError}
                  </Text>
                )}

                {!state.online && !!state.savedAt && (
                  <Text style={[ui.muted, { padding: 16 }]}>
                    Última copia:{' '}
                    {new Date(state.savedAt).toLocaleString('es-AR')}. Las fotos
                    pueden no estar disponibles.
                  </Text>
                )}
              </>
            }
            ListEmptyComponent={
              state.status !== 'ready' ? (
                <Feedback state={state} />
              ) : (
                <Text style={ui.empty}>
                  {!state.online
                    ? 'No hay publicaciones guardadas.'
                    : 'No hay publicaciones para explorar.'}
                </Text>
              )
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onPost(item.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  'Abrir publicación: ' + (item.description || '')
                }
                style={{
                  flexBasis: '32.9%',
                  flexGrow: 0,
                  flexShrink: 1,
                }}
              >
                <PostPhoto
                  uri={item.imageUrl}
                  label={item.description}
                  square
                />
              </Pressable>
            )}
            ListFooterComponent={
              state.hasMore ? (
                <View style={ui.space}>
                  {!!state.error && state.status !== 'error' && (
                    <Text style={ui.error}>{state.error}</Text>
                  )}

                  {state.loadingMore ? (
                    <ActivityIndicator color="#B63B17" />
                  ) : (
                    <ActionButton
                      title={state.error ? 'Reintentar carga' : 'Cargar más'}
                      outline
                      onPress={state.loadMore}
                    />
                  )}
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function FeedContent({
  explore,
  state,
  onCreate,
  onPost,
  onUser,
  onPeople,
  onExplore,
  onNotifications,
  hasUnread,
  unreadError,
}) {
  return (
    <SafeAreaView style={ui.safe} edges={['top', 'left', 'right']}>
      <View style={ui.page}>
        <View style={ui.header}>
          <Text style={[ui.title, { flex: 1 }]} accessibilityRole="header">
            {explore ? 'Explorar' : 'Inicio'}
          </Text>

          <Pressable
            style={ui.touch}
            onPress={onNotifications}
            accessibilityRole="button"
            accessibilityLabel={
              hasUnread
                ? 'Notificaciones sin leer'
                : unreadError
                  ? 'Notificaciones: no se pudo consultar el indicador'
                  : 'Notificaciones'
            }
          >
            <Ionicons name="notifications-outline" size={24} color="#B63B17" />

            {(hasUnread || unreadError) && (
              <View
                style={{
                  position: 'absolute',
                  right: 6,
                  top: 6,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: hasUnread ? '#B63B17' : '#655B55',
                }}
              />
            )}
          </Pressable>

          <Pressable
            disabled={!state.online}
            style={[ui.touch, !state.online && { opacity: 0.4 }]}
            onPress={state.retry}
            accessibilityRole="button"
            accessibilityLabel="Actualizar publicaciones"
          >
            <Ionicons name="refresh-outline" size={23} color="#B63B17" />
          </Pressable>

          <Pressable
            disabled={!state.online}
            style={[ui.touch, !state.online && { opacity: 0.4 }]}
            onPress={onCreate}
            accessibilityRole="button"
            accessibilityLabel="Crear publicación"
          >
            <Ionicons name="add" size={29} color="#B63B17" />
          </Pressable>
        </View>

        <FlatList
          data={state.posts}
          keyExtractor={(post) => post.id}
          initialNumToRender={4}
          windowSize={5}
          refreshing={
            state.online && state.status === 'loading' && !state.loadingMore
          }
          onRefresh={state.online ? state.retry : undefined}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (
              explore &&
              state.hasMore &&
              !state.loadingMore &&
              !state.error &&
              state.status === 'ready'
            ) {
              state.loadMore();
            }
          }}
          ListHeaderComponent={
            <>
              {!!state.cacheError && (
                <Text style={[ui.error, { padding: 16 }]}>
                  {state.cacheError}
                </Text>
              )}

              {!state.online && !!state.savedAt && (
                <Text style={[ui.muted, { padding: 16 }]}>
                  Última copia:{' '}
                  {new Date(state.savedAt).toLocaleString('es-AR')}. Las fotos
                  pueden no estar disponibles.
                </Text>
              )}

              {state.online &&
                !explore &&
                state.status === 'ready' &&
                state.hasFollowing === false &&
                state.posts.length > 0 && (
                  <Text style={[ui.muted, { padding: 16 }]}>
                    Acá ves tus publicaciones. Seguí personas desde Explorar
                    para ver también sus descubrimientos.
                  </Text>
                )}
            </>
          }
          ListEmptyComponent={
            state.status !== 'ready' ? (
              <Feedback state={state} />
            ) : !state.hasMore ? (
              <View style={ui.space}>
                <Text style={ui.empty}>
                  {!state.online
                    ? 'No hay publicaciones guardadas en esta sección. Cargalas con Internet para verlas después.'
                    : explore
                      ? 'No hay nuevas publicaciones para explorar. Volvé más tarde.'
                      : state.hasFollowing
                        ? 'Todavía no hay publicaciones de las personas que seguís.'
                        : 'Seguí personas para descubrir sus publicaciones. También aparecerán las tuyas.'}
                </Text>

                {!explore && (
                  <ActionButton
                    title="Ir a Explorar"
                    onPress={onExplore}
                    outline
                  />
                )}
              </View>
            ) : null
          }
          renderItem={({ item }) =>
            state.online ? (
              <FeedCard
                post={item}
                onPost={onPost}
                onUser={onUser}
                onPeople={onPeople}
                onAuthor={state.rememberAuthor}
              />
            ) : (
              <CachedFeedCard post={item} />
            )
          }
          ListFooterComponent={
            explore && state.hasMore ? (
              <View style={ui.space}>
                {!!state.error && state.status !== 'error' && (
                  <Text style={ui.error}>{state.error}</Text>
                )}

                {state.loadingMore ? (
                  <ActivityIndicator color="#B63B17" />
                ) : (
                  <ActionButton
                    title={state.error ? 'Reintentar carga' : 'Cargar más'}
                    outline
                    onPress={state.loadMore}
                  />
                )}
              </View>
            ) : null
          }
          contentContainerStyle={{
            paddingBottom: 16,
            flexGrow: 1,
          }}
        />
      </View>
    </SafeAreaView>
  );
}
