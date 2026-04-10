import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

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

/**
 * Registers the device for push notifications and syncs the token to Supabase.
 */
export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    console.log("Push notifications are not supported on virtual devices.");
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
      console.log("Failed to get push token for push notification!");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      // Replace with your EAS Project ID from app.json if needed
      projectId: "86c5f2a0-cd1c-448b-a6dc-ec12adb91d8f",
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

    // Sync token to user_preferences table
    // Migration 20260402130000_user_preferences.sql should have a push_token column
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
    }

    return token;
  } catch (err) {
    console.error("[Push] Registration error:", err);
    return null;
  }
}
