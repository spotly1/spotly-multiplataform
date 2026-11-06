import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function Header({ title, onBack, disabled }) {
  return <View style={ui.header}>
    {onBack && <Pressable disabled={disabled} onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver" style={ui.touch}><Text style={ui.link}>‹ Volver</Text></Pressable>}
    <Text style={ui.title} accessibilityRole="header">{title}</Text>
  </View>;
}
export function Feedback({ state, emptyText }) {
  if (state.status === 'loading') return <ActivityIndicator style={ui.space} color="#B63B17" />;
  if (state.status === 'error') return <View style={ui.space}><Text style={ui.error} accessibilityRole="alert">{state.error}</Text><ActionButton title="Reintentar" onPress={state.retry} outline /></View>;
  return emptyText ? <Text style={[ui.text, ui.empty]}>{emptyText}</Text> : null;
}
export function ActionButton({ title, onPress, disabled, busy, outline = false }) {
  return <Pressable disabled={disabled || busy} onPress={onPress} accessibilityRole="button"
    accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
    style={({ pressed }) => [ui.button, outline && ui.outline, (pressed || disabled || busy) && { opacity: 0.55 }]}>
    {busy && <ActivityIndicator color={outline ? '#B63B17' : '#fff'} />}
    <Text style={[ui.buttonText, outline && ui.link]}>{title}</Text>
  </Pressable>;
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F4' },
  page: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12, flexWrap: 'wrap' },
  title: { fontSize: 22, fontWeight: '700', color: '#28211E', flexShrink: 1 },
  touch: { minHeight: 44, minWidth: 44, justifyContent: 'center', padding: 8 },
  text: { color: '#28211E', fontSize: 16, lineHeight: 24 },
  muted: { color: '#655B55', fontSize: 13 },
  link: { color: '#A23718', fontWeight: '600' },
  button: { minHeight: 48, borderRadius: 26, padding: 12, marginVertical: 5, backgroundColor: '#B63B17', flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#B63B17' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  space: { padding: 20, gap: 12 },
  empty: { padding: 28, textAlign: 'center', color: '#655B55' },
  error: { color: '#AE2020', paddingVertical: 8, lineHeight: 21 },
});
