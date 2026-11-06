import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function UserAvatar({ username, imageUrl, size = 104 }) {
  // El key reinicia el estado de error cuando cambia la foto.
  return <AvatarImage key={imageUrl} username={username} imageUrl={imageUrl} size={size} />;
}

function AvatarImage({ username, imageUrl, size }) {
  const dimensions = { width: size, height: size, borderRadius: size / 2 };
  const [failed, setFailed] = useState(false);
  const validUrl = imageUrl?.startsWith('https://');
  if (validUrl && !failed) {
    return <Image source={{ uri: imageUrl }} style={[styles.avatar, dimensions]}
      accessibilityLabel={'Foto de ' + (username || 'perfil')} onError={() => setFailed(true)} />;
  }
  return (
    <View style={[styles.avatar, styles.placeholder, dimensions]} accessible accessibilityLabel="Perfil sin foto">
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{Array.from(username || 'S')[0].toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#FCE6DA' },
  placeholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF8F4' },
  initial: { fontSize: 42, fontWeight: '700', color: '#A23718' },
});
