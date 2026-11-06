import { FlatList, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../hooks/useSearch';
import UserAvatar from '../components/UserAvatar';
import { Feedback, Header, ui } from '../components/ProfileUi';

export default function SearchScreen({ onUser }) {
  const { user } = useAuth();
  const state = useSearch(user.uid);
  return <SafeAreaView style={ui.safe} edges={['top', 'left', 'right']}><View style={ui.page}>
    <Header title="Buscar personas" />
    <View style={{ margin: 16, paddingHorizontal: 12, borderRadius: 24, borderWidth: 1, borderColor: '#DAC9BE', flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="search-outline" size={22} color="#655B55" />
      <TextInput value={state.text} onChangeText={state.setText} placeholder="Buscar por nombre de usuario" placeholderTextColor="#655B55"
        accessibilityLabel="Nombre de usuario" autoCapitalize="none" autoCorrect={false} maxLength={30} returnKeyType="search"
        onSubmitEditing={() => { state.remember(); Keyboard.dismiss(); }} style={{ flex: 1, padding: 12, minHeight: 48, color: '#28211E' }} />
      {!!state.text && <Pressable style={ui.touch} onPress={() => state.setText('')} accessibilityLabel="Limpiar búsqueda" accessibilityRole="button"><Ionicons name="close" size={20} /></Pressable>}
    </View>
    {!!state.historyError && <Text style={[ui.error, { paddingHorizontal: 16 }]}>{state.historyError}</Text>}
    {state.prefix ? <FlatList data={state.data} keyExtractor={(item) => item.uid} keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<Feedback state={state} emptyText={state.status === 'ready' ? 'No se encontraron usuarios con ese nombre.' : undefined} />}
      ListFooterComponent={state.data.length === 20 ? <Text style={ui.empty}>Se muestran hasta 20 resultados. Escribí más letras para precisar la búsqueda.</Text> : null}
      renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => { state.remember(); Keyboard.dismiss(); onUser(item.uid); }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <UserAvatar username={item.username} imageUrl={item.profileImageUrl} size={48} />
        <View style={{ flex: 1 }}><Text style={[ui.text, { fontWeight: '700' }]}>{item.username}</Text><Text numberOfLines={2} style={ui.muted}>{item.description}</Text></View>
        <Ionicons name="chevron-forward" size={18} color="#655B55" />
      </Pressable>} /> : <FlatList data={state.recent} keyExtractor={(item) => item} keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<View style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[ui.text, { fontWeight: '600' }]}>Búsquedas recientes</Text>
          {!!state.recent.length && <Pressable style={ui.touch} onPress={state.clearRecent} accessibilityRole="button"><Text style={ui.link}>Borrar todas</Text></Pressable>}
        </View>}
        ListEmptyComponent={<Text style={ui.empty}>Buscá personas para seguir sus descubrimientos.</Text>}
        renderItem={({ item }) => <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <Pressable style={[ui.touch, { flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 12 }]}
            accessibilityRole="button" onPress={() => { state.setText(item); state.remember(item); }}><Ionicons name="time-outline" size={20} color="#655B55" /><Text style={ui.text}>{item}</Text></Pressable>
          <Pressable style={ui.touch} accessibilityRole="button" accessibilityLabel={'Quitar búsqueda ' + item} onPress={() => state.removeRecent(item)}><Ionicons name="close" size={20} color="#655B55" /></Pressable>
        </View>} />}
  </View></SafeAreaView>;
}
