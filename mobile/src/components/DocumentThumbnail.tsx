import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { FileText, Image as ImageIcon } from "lucide-react-native";
import { invokeFunction } from "@/lib/supabase";
import { Theme } from "@/constants/Theme";

interface DocumentThumbnailProps {
  invoiceId: string;
  size?: number;
  style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
}

function isImageFilename(name?: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name ?? "");
}

export function DocumentThumbnail({
  invoiceId,
  size = 44,
  style,
}: DocumentThumbnailProps) {
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | undefined>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadThumbnail = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data, error: fnErr } = await invokeFunction<{
          signedUrl: string;
          filename?: string;
        }>("get-document-signed-url", {
          body: {
            invoice_id: invoiceId,
            width: size * 2, // 2x for retina
            height: size * 2,
            resize: "contain",
          },
        });

        if (cancelled) return;

        if (!fnErr && data?.signedUrl) {
          setUrl(data.signedUrl);
          setFilename(data.filename);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadThumbnail();
    return () => {
      cancelled = true;
    };
  }, [invoiceId, size]);

  const isImg = isImageFilename(filename);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size * 0.3 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Theme.colors.brand.primary} />
      ) : isImg && url && !error ? (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          onError={() => setError(true)}
        />
      ) : (
        <View style={styles.fallback}>
          {filename?.toLowerCase().endsWith(".pdf") ? (
            <FileText size={size * 0.45} color={Theme.colors.text.muted} />
          ) : (
            <ImageIcon size={size * 0.45} color={Theme.colors.text.muted} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.inputBg,
  },
});
