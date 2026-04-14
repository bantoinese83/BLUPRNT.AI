import { useEffect, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Linking,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { Image } from "expo-image";
import { X, ExternalLink } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchInvoiceOriginalSignedUrl } from "@/lib/open-original-document";
import { Theme } from "@/constants/Theme";

function isImageFilename(name?: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name ?? "");
}

type Phase = "loading" | "ready" | "error";

/**
 * Full-screen preview over the current screen. Mount only while open; use
 * `key={invoiceId}` on the parent so each open starts fresh.
 */
export function OriginalUploadPreviewModal({
  invoiceId,
  onClose,
}: {
  invoiceId: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const viewerMinH = Math.max(280, Math.round(windowH * 0.55));

  const [phase, setPhase] = useState<Phase>("loading");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageBroken, setImageBroken] = useState(false);
  const [webBroken, setWebBroken] = useState(false);

  const openExternally = useCallback(async () => {
    if (!signedUrl) return;
    try {
      const can = await Linking.canOpenURL(signedUrl);
      if (can) await Linking.openURL(signedUrl);
    } catch {
      /* user still has preview chrome */
    }
  }, [signedUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchInvoiceOriginalSignedUrl(invoiceId);
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.message);
        setPhase("error");
        return;
      }
      setSignedUrl(result.signedUrl);
      setFilename(result.filename);
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const title = filename?.trim() || "Original upload";

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.root,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.toolbar}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.toolbarActions}>
            {phase === "ready" && signedUrl ? (
              <TouchableOpacity
                onPress={() => void openExternally()}
                style={styles.textBtn}
                accessibilityRole="button"
                accessibilityLabel="Open in browser"
              >
                <ExternalLink size={18} color={Theme.colors.brand.primary} />
                <Text style={styles.textBtnLabel}>Browser</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={onClose}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <X size={22} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          {phase === "loading" ? (
            <View style={styles.centered}>
              <ActivityIndicator
                size="large"
                color={Theme.colors.brand.primary}
              />
              <Text style={styles.hint}>Loading file…</Text>
            </View>
          ) : null}

          {phase === "error" && errorMessage ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.primaryOutline} onPress={onClose}>
                <Text style={styles.primaryOutlineText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {phase === "ready" && signedUrl ? (
            <View style={[styles.viewer, { minHeight: viewerMinH }]}>
              {isImageFilename(filename) && !imageBroken ? (
                <Image
                  source={{ uri: signedUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                  transition={200}
                  onError={() => setImageBroken(true)}
                />
              ) : null}

              {isImageFilename(filename) && imageBroken ? (
                <View style={styles.fallback}>
                  <Text style={styles.fallbackText}>
                    This file may not preview here. Open it in your browser
                    instead.
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryOutline}
                    onPress={() => void openExternally()}
                  >
                    <Text style={styles.primaryOutlineText}>
                      Open in browser
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {!isImageFilename(filename) && !webBroken ? (
                <WebView
                  source={{ uri: signedUrl }}
                  style={styles.web}
                  startInLoadingState
                  renderLoading={() => (
                    <View style={styles.webLoading}>
                      <ActivityIndicator
                        size="large"
                        color={Theme.colors.brand.primary}
                      />
                    </View>
                  )}
                  onError={() => setWebBroken(true)}
                  onHttpError={() => setWebBroken(true)}
                  allowsInlineMediaPlayback
                />
              ) : null}

              {!isImageFilename(filename) && webBroken ? (
                <View style={styles.fallback}>
                  <Text style={styles.fallbackText}>
                    Preview isn’t available on this device. You can still open
                    the file in your browser.
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryOutline}
                    onPress={() => void openExternally()}
                  >
                    <Text style={styles.primaryOutlineText}>
                      Open in browser
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.margin,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.divider,
    backgroundColor: Theme.colors.card,
  },
  title: {
    flex: 1,
    marginRight: 12,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 16,
    color: Theme.colors.text.primary,
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  textBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  textBtnLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    color: Theme.colors.brand.primary,
  },
  iconBtn: {
    padding: 8,
  },
  body: {
    flex: 1,
    paddingHorizontal: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.md,
    padding: Theme.spacing.margin,
  },
  hint: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: Theme.colors.text.secondary,
  },
  errorText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: Theme.colors.text.primary,
    textAlign: "center",
    lineHeight: 22,
  },
  primaryOutline: {
    marginTop: Theme.spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.card,
  },
  primaryOutlineText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    color: Theme.colors.text.primary,
  },
  viewer: {
    flex: 1,
    borderRadius: Theme.radius.lg,
    overflow: "hidden",
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  web: {
    flex: 1,
    backgroundColor: Theme.colors.card,
  },
  webLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.inputBg,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.margin,
    gap: Theme.spacing.sm,
  },
  fallbackText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
