import NetInfo from '@react-native-community/netinfo';

export const connectionAvailable = (state) => state.isConnected === true && state.isInternetReachable !== false;
export async function requireConnection() {
  const state = await NetInfo.fetch();
  if (!connectionAvailable(state)) throw new Error('Sin conexión. Volvé a intentarlo cuando tengas Internet.');
}
