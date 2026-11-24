import { useEffect, useState } from 'react';
import { resolveAddress } from '../services/locationService';
import { Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ui } from './ProfileUi';

export default function PostLocation({ location, showMap = true, onPress }) {
  const [failed, setFailed] = useState(false);
  const [address, setAddress] = useState(null);

  const lat = location?.latitude;
  const lon = location?.longitude;

  useEffect(() => {
    let active = true;
    setAddress(null);
    setFailed(false);

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180
    ) {
      resolveAddress({ latitude: lat, longitude: lon }).then((value) => {
        if (active) setAddress(value);
      });
    }

    return () => {
      active = false;
    };
  }, [lat, lon]);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  )
    return null;

  const bbox = [
    Math.max(-180, lon - 0.008),
    Math.max(-90, lat - 0.006),
    Math.min(180, lon + 0.008),
    Math.min(90, lat + 0.006),
  ].join(',');

  const uri =
    'https://www.openstreetmap.org/export/embed.html?bbox=' +
    encodeURIComponent(bbox) +
    '&layer=mapnik&marker=' +
    encodeURIComponent(lat + ',' + lon);

  return (
    <View style={{ gap: 8 }}>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="link" style={ui.touch}>
          <Text style={{ color: '#1565C0', fontWeight: '600' }}>
            {address || 'Ubicación seleccionada'}
          </Text>
        </Pressable>
      ) : (
        <Text style={{ color: '#1565C0', fontWeight: '600' }}>
          {address || 'Ubicación seleccionada'}
        </Text>
      )}

      {showMap &&
        (failed ? (
          <Pressable onPress={() => setFailed(false)} style={ui.touch}>
            <Text style={ui.error}>
              No se pudo cargar el mapa. Tocar para reintentar.
            </Text>
          </Pressable>
        ) : (
          <WebView
            source={{ uri }}
            style={{ height: 220, flex: 0 }}
            originWhitelist={['https://www.openstreetmap.org']}
            allowFileAccess={false}
            allowFileAccessFromFileURLs={false}
            allowUniversalAccessFromFileURLs={false}
            geolocationEnabled={false}
            mixedContentMode="never"
            javaScriptCanOpenWindowsAutomatically={false}
            onShouldStartLoadWithRequest={(request) =>
              request.url.startsWith(
                'https://www.openstreetmap.org/export/embed.html?'
              )
            }
            onError={() => setFailed(true)}
            onHttpError={() => setFailed(true)}
          />
        ))}
    </View>
  );
}
