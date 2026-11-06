import { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { connectionAvailable } from '../services/connectionService';

const ConnectionContext = createContext({ online: false, ready: false });
export function ConnectionProvider({ children }) {
  const [state, setState] = useState({ online: false, ready: false });
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((value) => setState({ online: connectionAvailable(value), ready: value.isConnected !== null }));
    const appState = AppState.addEventListener('change', (value) => {
      if (value === 'active') NetInfo.refresh().catch(() => {});
    });
    return () => { unsubscribe(); appState.remove(); };
  }, []);
  return <ConnectionContext.Provider value={state}>{children}</ConnectionContext.Provider>;
}
export const useConnection = () => useContext(ConnectionContext);
