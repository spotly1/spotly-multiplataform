import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEditProfile } from '../hooks/useEditProfile';
import UserAvatar from './UserAvatar';

export default function EditProfileModal({ uid, profile, onClose, onSaved }) {
  const form = useEditProfile(uid, profile, onSaved);
  function close() {
    if (form.busy) return;
    if (!form.dirty) { onClose(); return; }
    Alert.alert('Descartar cambios', 'Los cambios todavía no se guardaron.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: onClose },
    ]);
  }
  return (
    <Modal visible animationType="slide" onRequestClose={close} presentationStyle="fullScreen">
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Pressable disabled={form.busy} onPress={close} accessibilityRole="button" style={styles.touch}><Text style={styles.link}>Cancelar</Text></Pressable>
              <Text style={styles.title} accessibilityRole="header">Editar perfil</Text>
            </View>
            <View style={styles.center}>
              {form.image
                ? <Image source={{ uri: form.image.uri }} style={styles.avatar} accessibilityLabel="Vista previa de la foto" />
                : <UserAvatar username={profile.username} imageUrl={form.removeImage ? '' : profile.profileImageUrl} />}
            </View>
            <View style={styles.options}>
              <Pressable disabled={form.busy} onPress={() => form.selectImage(true)} accessibilityRole="button" style={styles.touch}><Text style={styles.link}>Tomar foto</Text></Pressable>
              <Pressable disabled={form.busy} onPress={() => form.selectImage(false)} accessibilityRole="button" style={styles.touch}><Text style={styles.link}>Elegir de la galería</Text></Pressable>
              {(!!form.image || (!!profile.profileImageUrl && !form.removeImage)) &&
                <Pressable disabled={form.busy} onPress={form.clearImage} accessibilityRole="button" style={styles.touch}><Text style={styles.error}>Quitar foto</Text></Pressable>}
            </View>
            <Text style={styles.label}>Nombre de usuario</Text>
            <TextInput style={[styles.input, styles.readonly]} value={profile.username} editable={false} accessibilityLabel="Nombre de usuario, no editable" />
            <Text style={styles.note}>El nombre de usuario no se puede cambiar.</Text>
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.description]} multiline maxLength={300}
              value={form.description} onChangeText={form.changeDescription} editable={!form.busy}
              accessibilityLabel="Descripción" placeholder="Contá un poco sobre vos" placeholderTextColor="#777" textAlignVertical="top" />
            <Text style={styles.counter}>{form.description.length}/300</Text>
            {!!form.error && <Text style={styles.error} accessibilityRole="alert">{form.error}</Text>}
            <Pressable onPress={form.save} disabled={form.busy} accessibilityRole="button"
              accessibilityState={{ disabled: form.busy, busy: form.busy }}
              style={[styles.button, form.busy && { opacity: 0.65 }]}>
              {form.busy && <ActivityIndicator color="#fff" />}
              <Text style={styles.buttonText}>{form.busy ? form.phase : 'Guardar cambios'}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F4' },
  content: { padding: 20, gap: 12, width: '100%', maxWidth: 540, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  title: { fontSize: 23, color: '#28211E', fontWeight: '700' },
  center: { alignItems: 'center', marginTop: 12 },
  avatar: { width: 104, height: 104, borderRadius: 52 },
  options: { alignItems: 'center' },
  touch: { minHeight: 44, padding: 10, justifyContent: 'center' },
  link: { color: '#A23718', fontWeight: '600', fontSize: 15 },
  label: { color: '#28211E', fontWeight: '600', fontSize: 15 },
  input: { borderWidth: 1, borderColor: '#B8AAA1', borderRadius: 12, padding: 14, color: '#28211E', backgroundColor: '#fff', fontSize: 16 },
  readonly: { backgroundColor: '#EEE8E3', color: '#655B55' },
  note: { color: '#655B55', fontSize: 12 },
  description: { minHeight: 120 },
  counter: { color: '#655B55', textAlign: 'right', fontSize: 12 },
  error: { color: '#AE2020', lineHeight: 21 },
  button: { minHeight: 52, padding: 14, borderRadius: 28, backgroundColor: '#B63B17', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
