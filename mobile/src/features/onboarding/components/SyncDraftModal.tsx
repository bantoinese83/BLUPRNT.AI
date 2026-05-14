import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Monitor, X, Copy, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { supabase } from "@/lib/supabase";
import { Theme } from "@/constants/Theme";
import { reportClientError } from "@/lib/sentry";
import { shareLinkBaseUrl } from "@/lib/share-project";
import type { Json } from "@shared/types/supabase.gen";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  payload: Record<string, unknown>;
}

export function SyncDraftModal({ isOpen, onClose, payload }: Props) {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from("onboarding_sync").insert({
        token: newToken,
        payload: payload as Json,
      });

      if (error) throw error;
      setToken(newToken);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      void reportClientError("onboarding_sync_handoff", err);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Couldn't create link",
        "Please try again. Check your connection and try once more.",
      );
    } finally {
      setLoading(false);
    }
  };

  const syncUrl = `${shareLinkBaseUrl()}/onboarding?sync=${token}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(syncUrl);
    setCopied(true);
    void Haptics.selectionAsync();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Finish your renovation BLUPRNT on your computer: ${syncUrl}`,
      url: syncUrl,
    });
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.centered}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <X size={20} color={Theme.colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Monitor size={32} color={Theme.colors.brand.primary} />
          </View>

          <Text style={styles.title}>Continue on Computer</Text>
          <Text style={styles.body}>
            Taking photos is easier on mobile, but finishing your signup and
            managing your ledger is often better on a big screen.
          </Text>

          {!token ? (
            <TouchableOpacity
              style={styles.mainBtn}
              onPress={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.mainBtnText}>Generate Handoff Link</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.result}>
              <View style={styles.tokenBox}>
                <Text style={styles.tokenLabel}>Your Secure Link</Text>
                <TouchableOpacity
                  style={styles.urlDisplay}
                  onPress={handleCopy}
                >
                  <Text style={styles.urlText} numberOfLines={1}>
                    {syncUrl}
                  </Text>
                  {copied ? (
                    <Check size={16} color={Theme.colors.status.success} />
                  ) : (
                    <Copy size={16} color={Theme.colors.text.muted} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Text style={styles.shareBtnText}>Share link to yourself</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.footer}>
            Link expires in 2 hours. Your photos will be synced automatically
            when you sign up.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  close: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "Outfit_700Bold",
    color: Theme.colors.text.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  mainBtn: {
    width: "100%",
    height: 56,
    backgroundColor: Theme.colors.brand.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  mainBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
  },
  result: {
    width: "100%",
    gap: 16,
  },
  tokenBox: {
    width: "100%",
    backgroundColor: Theme.colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  tokenLabel: {
    fontSize: 11,
    fontFamily: "Outfit_700Bold",
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  urlDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
    color: Theme.colors.brand.primary,
  },
  shareBtn: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: Theme.colors.brand.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  shareBtnText: {
    color: Theme.colors.brand.primary,
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
  },
  footer: {
    marginTop: 20,
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: Theme.colors.text.disabled,
    textAlign: "center",
  },
});
