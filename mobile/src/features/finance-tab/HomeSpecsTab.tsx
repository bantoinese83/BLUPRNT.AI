import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import {
  Paintbrush,
  Grid,
  Lightbulb,
  MoreHorizontal,
  Trash2,
  MapPin,
  Camera,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Theme } from "@/constants/Theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { captureEvent } from "@/lib/posthog";
import type { PhysicalAssetRow } from "@shared/types/database";

type HomeSpecsTabProps = {
  projectId: string;
};

const CATEGORIES = [
  { id: "all", label: "All", icon: Grid },
  { id: "Paint", label: "Paint", icon: Paintbrush },
  { id: "Tile", label: "Tile", icon: Grid },
  { id: "Fixture", label: "Fixtures", icon: Lightbulb },
  { id: "Other", label: "Other", icon: MoreHorizontal },
];

export function HomeSpecsTab({ projectId }: HomeSpecsTabProps) {
  const [assets, setAssets] = useState<PhysicalAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const fetchAssets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("physical_assets")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const pathsToFetch = assets
        .map((a) => a.storage_path)
        .filter((path): path is string => !!path && !signedUrls[path]);

      if (pathsToFetch.length === 0) return;

      const { data, error } = await supabase.storage
        .from("project-photos")
        .createSignedUrls(pathsToFetch, 3600);

      if (error) return;

      if (data) {
        const newUrls: Record<string, string> = { ...signedUrls };
        data.forEach((item) => {
          if (item.signedUrl && item.path) {
            newUrls[item.path] = item.signedUrl;
          }
        });
        setSignedUrls(newUrls);
      }
    };

    fetchSignedUrls();
  }, [assets, signedUrls]);

  const filteredAssets = assets.filter(
    (a) => activeCategory === "all" || a.category === activeCategory,
  );

  const handleDelete = (id: string) => {
    Alert.alert("Remove spec?", "This will permanently delete this record.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("physical_assets")
            .delete()
            .eq("id", id);
          if (!error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            captureEvent("asset_deleted", {
              category: assets.find((a) => a.id === id)?.category,
            });
            fetchAssets();
          }
        },
      },
    ]);
  };

  const renderAsset = ({ item }: { item: PhysicalAssetRow }) => (
    <GlassCard style={styles.assetCard}>
      <View style={styles.assetImageContainer}>
        {item.storage_path && signedUrls[item.storage_path] ? (
          <Image
            source={{ uri: signedUrls[item.storage_path] }}
            style={styles.assetImage}
          />
        ) : (
          <View style={styles.assetImagePlaceholder}>
            <Camera
              size={24}
              color={Theme.colors.text.tertiary}
              opacity={0.3}
            />
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {item.category.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
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
            <MapPin size={10} color={Theme.colors.text.tertiary} />
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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <SnurraLoader size={SnurraSize.medium} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item: cat }) => {
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
          }}
        />
      </View>

      <FlatList
        data={filteredAssets}
        keyExtractor={(item) => item.id}
        renderItem={renderAsset}
        contentContainerStyle={styles.listContent}
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
    backgroundColor: Theme.colors.text.primary,
    borderColor: Theme.colors.text.primary,
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
    aspectRatio: 16 / 9,
    backgroundColor: "rgba(148,163,184,0.05)",
  },
  assetImage: {
    width: "100%",
    height: "100%",
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
    color: Theme.colors.text.tertiary,
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
    color: Theme.colors.text.tertiary,
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
    color: Theme.colors.text.tertiary,
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
    color: Theme.colors.text.tertiary,
    textAlign: "center",
    lineHeight: 20,
  },
});
