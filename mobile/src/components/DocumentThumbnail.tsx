import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { FileText, Image as ImageIcon } from "lucide-react-native";
import { useDocumentSignedUrl } from "@shared/hooks/use-document-signed-url";
import {
  isImageFilename,
  isPdfFilename,
} from "@shared/lib/infer-document-type";
import { supabase } from "@/lib/supabase";
import { Theme } from "@/constants/Theme";

interface DocumentThumbnailProps {
  ledgerEntryId: string;
  size?: number;
  style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
}

export function DocumentThumbnail({
  ledgerEntryId,
  size = 44,
  style,
}: DocumentThumbnailProps) {
  const { data, isLoading, isError } = useDocumentSignedUrl(
    supabase,
    ledgerEntryId,
    {
      width: size * 2, // 2x for retina
      height: size * 2,
      resize: "contain",
    },
  );

  const url = data?.signedUrl;
  const filename = data?.filename;
  const isImg = isImageFilename(filename);
  const isPdf = isPdfFilename(filename);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size * 0.3 },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={Theme.colors.brand.primary} />
      ) : isImg && url && !isError ? (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            isPdf && { backgroundColor: "rgba(225, 29, 72, 0.05)" },
          ]}
        >
          {isPdf ? (
            <>
              <FileText size={size * 0.45} color="rgba(225, 29, 72, 0.8)" />
              {size >= 44 && <Text style={styles.pdfLabel}>PDF</Text>}
            </>
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
    width: "100%",
    height: "100%",
  },
  pdfLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    color: "rgba(190, 18, 60, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
