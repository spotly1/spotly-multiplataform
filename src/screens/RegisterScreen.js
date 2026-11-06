import { useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegister } from '../hooks/useRegister';
import { useAuth } from '../context/AuthContext';
import { styles } from './LoginScreen';

const fields = [
  { key: 'username', label: 'Nombre de usuario', placeholder: 'Tu nombre en Spotly', autoComplete: 'username', textContentType: 'username', maxLength: 30 },
  { key: 'email', label: 'Correo electrónico', placeholder: 'tu@email.com', keyboardType: 'email-address', autoComplete: 'email', textContentType: 'emailAddress' },
  { key: 'password', label: 'Contraseña', placeholder: 'Al menos 6 caracteres', autoComplete: 'new-password', textContentType: 'newPassword', secret: true },
  { key: 'confirmPassword', label: 'Confirmar contraseña', placeholder: 'Repetí tu contraseña', autoComplete: 'new-password', textContentType: 'newPassword', secret: true },
];

export default function RegisterScreen({ onLogin }) {
  const form = useRegister();
  const session = useAuth();
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
            <Text style={styles.title} accessibilityRole="header">Creá tu cuenta</Text>
            <Text style={styles.subtitle}>Compartí esos lugares que merecen ser descubiertos.</Text>
            <View style={styles.card}>
              {fields.map(({ key, label, placeholder, secret, ...inputProps }) => (
                <View key={key}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput {...inputProps} style={styles.input} accessibilityLabel={label}
                    placeholder={placeholder} placeholderTextColor="#777" autoCapitalize="none" autoCorrect={false}
                    value={form.values[key]} onChangeText={(value) => form.change(key, value)}
                    secureTextEntry={!!secret && !visible} editable={!disabled}
                    returnKeyType={key === 'confirmPassword' ? 'go' : 'default'}
                    onSubmitEditing={key === 'confirmPassword' ? submit : undefined} />
                </View>
              ))}
              <Pressable onPress={() => setVisible((value) => !value)} accessibilityRole="button" style={styles.visibility}>
                <Text style={styles.link}>{visible ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}</Text>
              </Pressable>
              {!!(form.error || session.error) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{session.error || form.error}</Text>}
              <Pressable onPress={submit} disabled={disabled} accessibilityRole="button"
                accessibilityState={{ disabled, busy: form.busy }} style={({ pressed }) => [styles.button, (disabled || pressed) && styles.dim]}>
                {form.busy && <ActivityIndicator color="#fff" />}
                <Text style={styles.buttonText}>{form.busy ? 'Creando cuenta…' : 'Crear cuenta'}</Text>
              </Pressable>
              {!!session.error && <Pressable onPress={session.retry} accessibilityRole="button" style={styles.visibility}><Text style={styles.link}>Reintentar conexión</Text></Pressable>}
            </View>
            <Pressable onPress={onLogin} disabled={form.busy} accessibilityRole="button" style={styles.visibility}>
              <Text style={styles.link}>¿Ya tenés cuenta? Iniciar sesión</Text>
            </Pressable>
            <Text style={styles.footer}>Tu cuenta también sirve en Spotly nativa.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
