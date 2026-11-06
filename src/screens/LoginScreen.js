import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLogin } from '../hooks/useLogin';

export default function LoginScreen({ onRegister }) {
  const form = useLogin();
  const session = useAuth();
  const passwordInput = useRef(null);
  const [visible, setVisible] = useState(false);
  const disabled = form.busy || !!session.error;
  function submit() {
    if (disabled) return;
    Keyboard.dismiss();
    form.submit();
  }
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <View style={styles.brand}>
              <Image source={require('../../assets/spotly-logo.png')} style={styles.logo} accessibilityLabel="Logo de Spotly" />
              <View><Text style={styles.name}>Spotly</Text><Text style={styles.subtitle}>Descubrí tu ciudad</Text></View>
            </View>
            <Text style={styles.title} accessibilityRole="header">Qué bueno verte</Text>
            <Text style={styles.subtitle}>Iniciá sesión para compartir tus descubrimientos.</Text>
            <View style={styles.card}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input} value={form.email} onChangeText={form.changeEmail}
                accessibilityLabel="Correo electrónico" placeholder="tu@email.com" placeholderTextColor="#777"
                autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
                autoComplete="email" textContentType="emailAddress" returnKeyType="next"
                editable={!disabled} onSubmitEditing={() => passwordInput.current?.focus()}
              />
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                ref={passwordInput} style={styles.input} value={form.password} onChangeText={form.changePassword}
                accessibilityLabel="Contraseña" placeholder="Tu contraseña" placeholderTextColor="#777"
                secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false}
                autoComplete="current-password" textContentType="password" returnKeyType="go"
                editable={!disabled} onSubmitEditing={submit}
              />
              <Pressable onPress={() => setVisible((value) => !value)} accessibilityRole="button" style={styles.visibility}>
                <Text style={styles.link}>{visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}</Text>
              </Pressable>
              {!!(form.error || session.error) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{session.error || form.error}</Text>}
              <Pressable onPress={submit} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled, busy: form.busy }} style={({ pressed }) => [styles.button, (disabled || pressed) && styles.dim]}>
                {form.busy && <ActivityIndicator color="#fff" />}
                <Text style={styles.buttonText}>{form.busy ? 'Ingresando…' : 'Iniciar sesión'}</Text>
              </Pressable>
              {!!session.error && <Pressable onPress={session.retry} accessibilityRole="button" style={styles.visibility}><Text style={styles.link}>Reintentar conexión</Text></Pressable>}
            </View>
            <Pressable onPress={onRegister} disabled={form.busy} accessibilityRole="button" style={styles.visibility}>
              <Text style={styles.link}>¿No tenés cuenta? Crear cuenta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F4' },
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  column: { width: '100%', maxWidth: 440 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 32 },
  logo: { width: 60, height: 60, borderRadius: 30 },
  name: { fontSize: 28, fontWeight: '700', color: '#28211E' },
  title: { fontSize: 30, fontWeight: '700', color: '#28211E', marginBottom: 10 },
  subtitle: { color: '#655B55', fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginTop: 24, borderWidth: 1, borderColor: '#E9DED7' },
  label: { color: '#28211E', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#FAF8F6', color: '#28211E', borderWidth: 1, borderColor: '#B8AAA1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, minHeight: 52, marginBottom: 16 },
  visibility: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  link: { color: '#A23718', fontWeight: '600', fontSize: 14 },
  error: { color: '#AE2020', fontSize: 14, lineHeight: 21, marginBottom: 16 },
  button: { minHeight: 54, padding: 14, backgroundColor: '#B63B17', borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dim: { opacity: 0.6 },
  footer: { color: '#655B55', fontSize: 13, lineHeight: 20, marginTop: 24 },
});
