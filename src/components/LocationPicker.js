import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function LocationPicker({
  visible,
  initialLocation,
  onConfirm,
  onClose,
}) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const lat = initialLocation?.latitude ?? -34.6037;
  const lon = initialLocation?.longitude ?? -58.3816;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport"
              content="width=device-width, initial-scale=1.0">

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <style>
          html, body, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <script>
          const map = L.map('map').setView(
            [${lat}, ${lon}],
            13
          );

          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap'
            }
          ).addTo(map);

          let marker = null;

          ${
            initialLocation
              ? `
            marker = L.marker([${lat}, ${lon}]).addTo(map);
          `
              : ''
          }

          map.on('click', function(event) {
            const latitude = event.latlng.lat;
            const longitude = event.latlng.lng;

            if (marker) {
              marker.setLatLng(event.latlng);
            } else {
              marker = L.marker(event.latlng).addTo(map);
            }

            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                latitude,
                longitude
              })
            );
          });
        </script>
      </body>
    </html>
  `;

  const close = () => {
    setSelected(null);
    setLoading(true);
    onClose();
  };

  const confirm = () => {
    if (!selected) return;
    onConfirm(selected);
    close();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#FFF8F4',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            gap: 12,
          }}
        >
          <Pressable onPress={close}>
            <Ionicons name="arrow-back" size={26} color="#B63B17" />
          </Pressable>

          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#28211E',
            }}
          >
            Elegir ubicación
          </Text>
        </View>

        <Text
          style={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            color: '#655B55',
          }}
        >
          Tocá un punto del mapa para seleccionarlo.
        </Text>

        <View style={{ flex: 1 }}>
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://localhost' }}
            style={{ flex: 1 }}
            javaScriptEnabled
            onLoadEnd={() => setLoading(false)}
            onMessage={(event) => {
              try {
                const point = JSON.parse(event.nativeEvent.data);

                if (
                  Number.isFinite(point.latitude) &&
                  Number.isFinite(point.longitude) &&
                  Math.abs(point.latitude) <= 90 &&
                  Math.abs(point.longitude) <= 180
                ) {
                  setSelected(point);
                }
              } catch (error) {
                console.warn('Ubicación inválida', error);
              }
            }}
          />

          {loading && (
            <ActivityIndicator
              size="large"
              color="#B63B17"
              style={{
                position: 'absolute',
                alignSelf: 'center',
                top: '45%',
              }}
            />
          )}
        </View>

        <View style={{ padding: 16, gap: 8 }}>
          <Text
            style={{
              textAlign: 'center',
              color: '#655B55',
            }}
          >
            {selected
              ? 'Ubicación seleccionada'
              : 'Seleccioná un punto del mapa'}
          </Text>

          <Pressable
            onPress={confirm}
            disabled={!selected}
            style={{
              backgroundColor: selected ? '#FF5A36' : '#CCC',
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#FFF',
                fontWeight: '700',
                fontSize: 16,
              }}
            >
              Confirmar ubicación
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
