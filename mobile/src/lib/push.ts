import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";

/**
 * Configures how notifications are handled when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_PUSH_SYNC_KEY = "bluprnt_last_push_sync";
const LAST_PUSH_TOKEN_KEY = "bluprnt_last_push_token";

/**
 * Registers the device for push notifications and syncs the token to Supabase.
 */
export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    return null;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId as
        | string
        | undefined,
    });

    const token = tokenData.data;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // Local check to reduce backend noise: only sync if token changed or > 24h since last sync
    const now = Date.now();
    const [lastSyncStr, lastToken] = await Promise.all([
      AsyncStorage.getItem(LAST_PUSH_SYNC_KEY),
      AsyncStorage.getItem(LAST_PUSH_TOKEN_KEY),
    ]);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
    const isExpired = now - lastSync > 24 * 60 * 60 * 1000;

    if (token === lastToken && !isExpired) {
      return token;
    }

    // Sync token to user_preferences table
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        push_token: token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.warn("[Push] Failed to sync token to Supabase:", error);
    } else {
      await Promise.all([
        AsyncStorage.setItem(LAST_PUSH_SYNC_KEY, now.toString()),
        AsyncStorage.setItem(LAST_PUSH_TOKEN_KEY, token),
      ]);
    }

    return token;
  } catch (err) {
    console.error("[Push] Registration error:", err);
    return null;
  }
}
