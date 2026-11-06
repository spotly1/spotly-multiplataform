import { useEffect, useState } from 'react';
import { resolveAddress } from '../services/locationService';
import { Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ui } from './ProfileUi';

export default function PostLocation({ location, initiallyVisible = true }) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [failed, setFailed] = useState(false);
  const [address, setAddress] = useState(null);
  const lat = location?.latitude;
  const lon = location?.longitude;
  useEffect(() => {
    let active = true;
    setAddress(null);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      resolveAddress({ latitude: lat, longitude: lon }).then((value) => { if (active) setAddress(value); });
    }
    return () => { active = false; };
  }, [lat, lon]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const bbox = [Math.max(-180, lon - .008), Math.max(-90, lat - .006), Math.min(180, lon + .008), Math.min(90, lat + .006)].join(',');
  const uri = 'https://www.openstreetmap.org/export/embed.html?bbox=' + encodeURIComponent(bbox) + '&layer=mapnik&marker=' + encodeURIComponent(lat + ',' + lon);
  return <View style={{ gap: 8 }}>
    <Pressable accessibilityRole="button" onPress={() => { setVisible((v) => !v); setFailed(false); }} style={ui.touch}>
      <Text style={{ color: '#1565C0', fontWeight: '600' }}>{address || 'Ubicación seleccionada'} · {visible ? 'Ocultar mapa' : 'Ver mapa'}</Text>
    </Pressable>
    {visible && (failed ? <Pressable onPress={() => setFailed(false)} style={ui.touch}><Text style={ui.error}>No se pudo cargar el mapa. Tocar para reintentar.</Text></Pressable>
      : <WebView source={{ uri }} style={{ height: 220, flex: 0 }} originWhitelist={['https://www.openstreetmap.org']}
        allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
        geolocationEnabled={false} mixedContentMode="never" javaScriptCanOpenWindowsAutomatically={false}
        onShouldStartLoadWithRequest={(request) => request.url.startsWith('https://www.openstreetmap.org/export/embed.html?')}
        onError={() => setFailed(true)} onHttpError={() => setFailed(true)} />)}
  </View>;
}
