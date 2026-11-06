import { useState } from 'react';
import { Image, Text, View } from 'react-native';

export default function PostPhoto({ uri, label, square = false, maxPixels = 1600 }) {
  return <Photo key={uri} uri={uri} label={label} square={square} maxPixels={maxPixels} />;
}
function Photo({ uri, label, square, maxPixels }) {
  const [ratio, setRatio] = useState(1);
  const [failed, setFailed] = useState(false);
  const [original, setOriginal] = useState(false);
  const style = { width: '100%', aspectRatio: square ? 1 : ratio, backgroundColor: '#E9DED7' };
  if (failed || !uri?.startsWith('https://')) return <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}><Text>Foto no disponible</Text></View>;
  const prefix = 'https://res.cloudinary.com/iufz7yvd/image/upload/';
  const optimized = uri.startsWith(prefix) ? uri.replace(prefix, prefix + 'f_auto,q_auto,c_limit,w_' + (square ? 480 : maxPixels) + '/') : uri;
  return <Image source={{ uri: original ? uri : optimized }} style={style} resizeMode={square ? 'cover' : 'contain'}
    accessibilityLabel={label || 'Publicación'} onError={() => {
      if (!original && optimized !== uri) setOriginal(true);
      else setFailed(true);
    }}
    onLoad={(event) => {
      const source = event.nativeEvent.source;
      if (source?.width > 0 && source?.height > 0) setRatio(source.width / source.height);
    }} />;
}
