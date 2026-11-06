import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import RegisterScreen from './src/screens/RegisterScreen';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import { ConnectionProvider } from './src/context/ConnectionContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ConnectionProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <SessionRouter />
      </AuthProvider>
      </ConnectionProvider>
    </SafeAreaProvider>
  );
}

function SessionRouter() {
  const { loading, user } = useAuth();
  if (loading) return <View style={styles.container}><ActivityIndicator color="#B63B17" /><Text>Recuperando sesión…</Text></View>;
  return user ? <MainScreen key={user.uid} /> : <AuthScreens />;
}

function AuthScreens() {
  const [registering, setRegistering] = useState(false);
  return registering
    ? <RegisterScreen onLogin={() => setRegistering(false)} />
    : <LoginScreen onRegister={() => setRegistering(true)} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
