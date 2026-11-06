import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLiveData } from '../hooks/useLiveData';
import { observePeople } from '../services/profileSocialService';
import UserAvatar from '../components/UserAvatar';
import { Header, Feedback, ui } from '../components/ProfileUi';

const titles = { followers: 'Seguidores', following: 'Seguidos', likes: 'Me gusta' };
export default function PeopleScreen({ id, type, onBack, onUser }) {
  const state = useLiveData(useCallback((next, fail) => observePeople(id, type, next, fail), [id, type]));
  return <SafeAreaView style={ui.safe}><View style={ui.page}>
    <Header title={titles[type]} onBack={onBack} />
    <FlatList data={state.data || []} keyExtractor={(item) => item.uid}
      ListEmptyComponent={<Feedback state={state} emptyText="Todavía no hay personas en esta lista." />}
      renderItem={({ item }) => <Pressable onPress={() => onUser(item.uid)} accessibilityRole="button"
        style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <UserAvatar username={item.username} imageUrl={item.profileImageUrl} size={48} />
        <View style={{ flex: 1 }}><Text numberOfLines={1} style={[ui.text, { fontWeight: '600' }]}>@{item.username}</Text>
          {!!item.description && <Text style={ui.muted} numberOfLines={2}>{item.description}</Text>}</View>
      </Pressable>} />
  </View></SafeAreaView>;
}
