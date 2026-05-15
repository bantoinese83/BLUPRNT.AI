import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
} from "react-native";
import {
  Paintbrush,
  Grid,
  Lightbulb,
  MoreHorizontal,
  Trash2,
  MapPin,
  Camera,
  Wrench,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Theme } from "@/constants/Theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { captureEvent } from "@/lib/posthog";
import { useConfirmation } from "@/contexts/useConfirmation";
import { showAppToast } from "@/lib/app-toast";
import { usePhysicalAssets } from "@shared/hooks/use-physical-assets";
import { PHYSICAL_ASSET_CATEGORIES } from "@shared/constants/home-specs";
import type { PhysicalAssetRow } from "@shared/types/database";

import type { LucideIcon } from "lucide-react-native";

type HomeSpecsTabProps = {
  projectId: string;
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Paint: Paintbrush,
  Tile: Grid,
  Fixture: Lightbulb,
  Hardware: Wrench,
  Other: MoreHorizontal,
};

const CATEGORIES = [
  { id: "all", label: "All", icon: Grid },
  ...PHYSICAL_ASSET_CATEGORIES.map((c) => ({
    ...c,
    icon: CATEGORY_ICONS[c.id] || MoreHorizontal,
  })),
];

export function HomeSpecsTab({ projectId }: HomeSpecsTabProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const { confirm } = useConfirmation();

  const {
    assets,
    loading,
    refreshing,
    error: fetchError,
    signedUrls,
    refresh,
    deleteAsset,
  } = usePhysicalAssets({
    projectId,
    supabase,
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : "Couldn't load home specs.";
      showAppToast(msg);
      console.error(err);
    },
  });

  const onRefresh = useCallback(async () => {
    await refresh({ silent: true });
  }, [refresh]);

  const filteredAssets = React.useMemo(() => {
    return assets.filter(
      (a) => activeCategory === "all" || a.category === activeCategory,
    );
  }, [assets, activeCategory]);

  const handleDelete = useCallback(
    (id: string) => {
      confirm({
        title: "Remove spec?",
        message: "This will permanently delete this record.",
        confirmLabel: "Remove",
        variant: "destructive",
        onConfirm: async () => {
          const { error } = await deleteAsset(id);
          if (!error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            captureEvent("asset_deleted", {
              category: assets.find((a) => a.id === id)?.category,
            });
            showAppToast("Spec removed.");
          } else {
            showAppToast("Failed to remove spec.");
          }
        },
      });
    },
    [confirm, deleteAsset, assets],
  );

  const renderAsset = useCallback(
    ({ item }: { item: PhysicalAssetRow }) => (
      <AssetCard
        item={item}
        signedUrl={
          item.storage_path ? signedUrls[item.storage_path] : undefined
        }
        onDelete={handleDelete}
      />
    ),
    [signedUrls, handleDelete],
  );

  const keyExtractor = useCallback((item: PhysicalAssetRow) => item.id, []);

  const renderCategory = useCallback(
    ({ item: cat }: { item: (typeof CATEGORIES)[0] }) => {
      const Icon = cat.icon;
      const active = activeCategory === cat.id;
      return (
        <TouchableOpacity
          onPress={() => {
            setActiveCategory(cat.id);
            Haptics.selectionAsync();
          }}
          style={[styles.filterChip, active && styles.filterChipActive]}
        >
          <Icon
            size={14}
            color={active ? "white" : Theme.colors.text.secondary}
          />
          <Text
            style={[
              styles.filterChipText,
              active && styles.filterChipTextActive,
            ]}
          >
            {cat.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeCategory],
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <SnurraLoader size={SnurraSize.sheet} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {fetchError ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity
            onPress={() => void refresh({ silent: false })}
            style={styles.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Retry loading home specs"
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.filterContent}
          renderItem={renderCategory}
        />
      </View>

      <FlatList
        data={filteredAssets}
        keyExtractor={keyExtractor}
        renderItem={renderAsset}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No specs recorded</Text>
            <Text style={styles.emptySubtitle}>
              Store paint codes and hardware details here for easy reference
              later.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const AssetCard = React.memo(
  ({
    item,
    signedUrl,
    onDelete,
  }: {
    item: PhysicalAssetRow;
    signedUrl?: string;
    onDelete: (id: string) => void;
  }) => {
    return (
      <GlassCard style={styles.assetCard}>
        <View style={styles.assetImageContainer}>
          {signedUrl ? (
            <Image source={{ uri: signedUrl }} style={styles.assetImage} />
          ) : (
            <View style={styles.assetImagePlaceholder}>
              <Camera size={24} color={Theme.colors.text.muted} opacity={0.3} />
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {item.category.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(item.id)}
            testID="delete-spec-btn"
          >
            <Trash2 size={16} color={Theme.colors.status.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.assetInfo}>
          <Text style={styles.assetName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.location_in_home && (
            <View style={styles.locationRow}>
              <MapPin size={10} color={Theme.colors.text.muted} />
              <Text style={styles.locationText}>{item.location_in_home}</Text>
            </View>
          )}

          <View style={styles.specsGrid}>
            {item.brand && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>BRAND</Text>
                <Text style={styles.specValue}>{item.brand}</Text>
              </View>
            )}
            {item.color_name && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>COLOR</Text>
                <Text style={styles.specValue}>{item.color_name}</Text>
              </View>
            )}
            {item.color_code && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>CODE</Text>
                <Text style={styles.specValue} numberOfLines={1}>
                  {item.color_code}
                </Text>
              </View>
            )}
            {item.finish && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>FINISH</Text>
                <Text style={styles.specValue}>{item.finish}</Text>
              </View>
            )}
          </View>

          {item.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesText} numberOfLines={2}>
                "{item.notes}"
              </Text>
            </View>
          )}
        </View>
      </GlassCard>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    padding: 100,
    alignItems: "center",
  },
  filterBar: {
    marginTop: 12,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.1)",
  },
  filterChipActive: {
    backgroundColor: Theme.colors.brand.primary,
    borderColor: Theme.colors.brand.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: "white",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  assetCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 24,
  },
  assetImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "rgba(148,163,184,0.05)",
  },
  assetImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  assetImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  deleteBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  assetInfo: {
    padding: 16,
  },
  assetName: {
    fontSize: 15,
    fontWeight: "800",
    color: Theme.colors.text.primary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    fontWeight: "600",
    color: Theme.colors.text.muted,
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  specItem: {
    minWidth: "40%",
  },
  specLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: Theme.colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  specValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.text.secondary,
  },
  notesBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.05)",
  },
  notesText: {
    fontSize: 12,
    fontWeight: "500",
    fontStyle: "italic",
    color: Theme.colors.text.muted,
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Theme.colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  errorBanner: {
    marginHorizontal: 24,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.status.error,
    textAlign: "center",
  },
  retryBtn: {
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Theme.colors.brand.primary,
  },
  retryBtnText: {
    color: Theme.colors.card,
    fontSize: 13,
    fontWeight: "800",
  },
});
