import { useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useAction, useLiveData } from '../hooks/useLiveData';
import { observeLikes, setLiked } from '../services/profileSocialService';
import UserAvatar from './UserAvatar';
import PostPhoto from './PostPhoto';
import PostLocation from './PostLocation';
import { Feedback, ui } from './ProfileUi';
import { useConnection } from '../context/ConnectionContext';

export default function FeedCard({ post, onPost, onUser, onPeople, onAuthor }) {
  const { online } = useConnection();
  const { user } = useAuth();
  const author = useProfile(post.authorId);
  useEffect(() => {
    if (online && author.profile) onAuthor?.(post.authorId, author.profile);
  }, [online, author.profile, post.authorId, onAuthor]);
  const likes = useLiveData(useCallback((next, fail) => observeLikes(post.id, next, fail), [post.id]));
  const action = useAction();
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const liked = likes.data?.includes(user.uid);
  function photoPress() {
    if (timer.current) {
      clearTimeout(timer.current); timer.current = null;
      if (online && likes.status === 'ready') action.run(() => setLiked(post.id, true));
    } else {
      timer.current = setTimeout(() => { timer.current = null; onPost(post.id); }, 260);
    }
  }
  return <View style={{ backgroundColor: '#FFF8F4', paddingBottom: 16 }}>
    <Pressable accessibilityRole="button" onPress={() => onUser(post.authorId)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
      <UserAvatar size={40} username={author.profile?.username} imageUrl={author.profile?.profileImageUrl} />
      <Text style={[ui.text, { fontWeight: '600', flex: 1 }]} numberOfLines={1}>@{author.profile?.username || 'usuario'}</Text>
    </Pressable>
    {!!post.location && <PostLocation location={post.location} initiallyVisible={false} />}
    <Pressable accessibilityRole="button" accessibilityLabel={'Ver publicación: ' + post.description} onPress={photoPress}>
      <PostPhoto uri={post.imageUrl} label={post.description} maxPixels={1080} />
    </Pressable>
    <View style={{ paddingHorizontal: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable style={ui.touch} disabled={!online || action.busy || likes.status !== 'ready'} accessibilityRole="button"
          accessibilityLabel={liked ? 'Quitar me gusta' : 'Me gusta'} accessibilityState={{ selected: !!liked, disabled: !online || action.busy || likes.status !== 'ready' }}
          onPress={() => action.run(() => setLiked(post.id, !liked))}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={27} color={liked ? '#C52C3A' : '#28211E'} />
        </Pressable>
        <Pressable style={ui.touch} accessibilityRole="button" accessibilityLabel="Ver quiénes dieron me gusta" onPress={() => onPeople(post.id, 'likes')}>
          <Text style={ui.text}>{likes.data?.length ?? '—'}</Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => onPost(post.id)}><Text style={ui.text}>{post.description}</Text></Pressable>
      {likes.status === 'error' && <Feedback state={likes} />}
      {!!action.error && <Text style={ui.error} accessibilityRole="alert">{action.error}</Text>}
    </View>
  </View>;
}
