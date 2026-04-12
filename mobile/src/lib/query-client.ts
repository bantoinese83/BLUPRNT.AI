import NetInfo from "@react-native-community/netinfo";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { isNetworkReachable } from "@/lib/network-status";

/** Pause retries while offline; resume + refetch when NetInfo reports reachability. */
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(isNetworkReachable(state));
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnReconnect: true,
    },
  },
});

export const dashboardQueryKey = ["dashboard", "snapshot", "mobile"] as const;
