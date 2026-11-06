import { useCallback, useEffect } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useCreatePost } from '../hooks/useCreatePost';
import { useConnection } from '../context/ConnectionContext';
import PostLocation from '../components/PostLocation';
import { ActionButton, Header, ui } from '../components/ProfileUi';

export default function CreatePostScreen({ onBack, onPublished, onBusy, onEditing }) {
  const { user } = useAuth();
  const { online } = useConnection();
  const form = useCreatePost(user.uid, onPublished);
  const locked = form.busy || form.submitted;
  const close = useCallback(() => {
    if (form.busy) return;
    if (!form.dirty) { onBack(); return; }
    Alert.alert('Salir de la publicación', form.submitted
      ? 'El envío se intentó guardar. Si salís, revisá tu perfil antes de volver a publicar para evitar repetirlo.'
      : 'Se perderá el borrador sin publicar.', [
      { text: 'Seguir acá', style: 'cancel' }, { text: 'Salir', style: 'destructive', onPress: onBack },
    ]);
  }, [form.busy, form.dirty, form.submitted, onBack]);
  useEffect(() => { onBusy(form.busy); return () => onBusy(false); }, [form.busy, onBusy]);
  useEffect(() => { onEditing(close); return () => onEditing(null); }, [close, onEditing]);
  return <SafeAreaView style={ui.safe}><View style={ui.page}>
    <Header title="Crear publicación" onBack={close} disabled={form.busy} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={ui.muted}>Compartí un descubrimiento de tu ciudad.</Text>
        <View style={styles.preview}>
          {form.image ? <Image source={{ uri: form.image.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" accessibilityLabel="Vista previa de la publicación" />
            : <><Ionicons name="images-outline" size={46} color="#655B55" /><Text style={ui.text}>Elegí una foto para empezar</Text></>}
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><ActionButton title="Cámara" outline disabled={locked} onPress={() => form.select(true)} /></View>
          <View style={{ flex: 1 }}><ActionButton title="Galería" outline disabled={locked} onPress={() => form.select(false)} /></View>
        </View>
        {!!form.image && <ActionButton title="Quitar foto" outline disabled={locked} onPress={form.removeImage} />}
        <Text style={ui.text}>Descripción</Text>
        <TextInput value={form.description} onChangeText={form.changeDescription} editable={!locked} multiline maxLength={1000}
          accessibilityLabel="Descripción de la publicación" placeholder="¿Qué descubriste?" placeholderTextColor="#777" textAlignVertical="top" style={styles.input} />
        <Text style={[ui.muted, { textAlign: 'right' }]}>{form.description.length}/1000</Text>
        <Text style={ui.muted}>La ubicación es opcional y será visible en la publicación. Se usa tu ubicación actual, no la ubicación original de una foto de galería.</Text>
        <ActionButton title="Agregar ubicación actual" outline disabled={locked} onPress={form.locate} />
        {!!form.location && <>
          <PostLocation location={form.location} initiallyVisible={false} />
          <ActionButton title="Quitar ubicación" outline disabled={locked} onPress={form.removeLocation} />
        </>}
        {!!form.error && <Text style={ui.error} accessibilityRole="alert">{form.error}</Text>}
        {!online && <Text style={ui.muted}>Podés conservar este borrador en pantalla, pero necesitás Internet para publicarlo.</Text>}
        {form.submitted && !form.busy && <Text style={ui.muted}>Reintentar conserva la misma foto y el mismo envío, sin duplicarlo.</Text>}
        <ActionButton title={form.busy ? form.phase : form.submitted ? 'Reintentar publicación' : 'Publicar'}
          busy={form.busy} disabled={!online || !form.image || !form.description.trim()} onPress={form.publish} />
      </ScrollView>
    </KeyboardAvoidingView>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  preview: { height: 260, backgroundColor: '#EEE5DF', borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 12 },
  input: { minHeight: 120, borderWidth: 1, borderColor: '#B8AAA1', borderRadius: 14, padding: 14, color: '#28211E', backgroundColor: '#fff', fontSize: 16 },
});
