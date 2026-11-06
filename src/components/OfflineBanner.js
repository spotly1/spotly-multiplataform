import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConnection } from '../context/ConnectionContext';

export default function OfflineBanner() {
  const { online, ready } = useConnection();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16, backgroundColor: '#FCE6DA' }}>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ textAlign: 'center', color: '#7B2D15', fontWeight: '600' }}>
      {ready ? 'Sin conexión' : 'Comprobando conexión…'}
    </Text>
  </View>;
}
