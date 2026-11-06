import { Text, View } from 'react-native';
import UserAvatar from './UserAvatar';
import PostPhoto from './PostPhoto';
import { ui } from './ProfileUi';

// Solo lectura: no consulta perfiles, likes ni mapas que requieren Internet.
export default function CachedFeedCard({ post }) {
  return <View style={{ paddingBottom: 20 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
      <UserAvatar size={40} username={post.cachedAuthor?.username} imageUrl={post.cachedAuthor?.profileImageUrl} />
      <Text style={[ui.text, { fontWeight: '600' }]}>{post.cachedAuthor?.username ? '@' + post.cachedAuthor.username : 'Publicación guardada'}</Text>
    </View>
    <PostPhoto uri={post.imageUrl} label={post.description} maxPixels={1080} />
    <View style={{ padding: 12, gap: 8 }}>
      <Text style={ui.text}>{post.description}</Text>
      {!!post.location && <Text style={ui.muted}>Ubicación guardada · El mapa requiere Internet.</Text>}
      <Text style={ui.muted}>Conectate para ver el detalle, dar me gusta o visitar el perfil.</Text>
    </View>
  </View>;
}
