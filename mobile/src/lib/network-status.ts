import type { NetInfoState } from "@react-native-community/netinfo";

/**
 * Best-effort reachability for UI + React Query online state.
 * Avoids treating `isConnected: null` (unknown) as offline.
 */
export function isNetworkReachable(state: NetInfoState): boolean {
  if (state.isConnected === false) return false;
  if (state.isConnected === true && state.isInternetReachable === false) {
    return false;
  }
  return true;
}
