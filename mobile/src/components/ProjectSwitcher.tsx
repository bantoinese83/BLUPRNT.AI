import React, { useState, useCallback, memo, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { PlusCircle, FileText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import type { ProjectRow } from "@shared/types/database";
import type { ProjectSwitcherHints } from "@shared/types/dashboard-snapshot";
import { ProjectIcon } from "@/lib/project-icons";
import {
  useConfirmation,
  type ConfirmOptions,
} from "@/contexts/useConfirmation";

import { showAppToast } from "@/lib/app-toast";
import { STORAGE_CONFIG } from "@shared/constants/storage";

type ProjectSwitcherProps = {
  projects: ProjectRow[];
  currentId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  projectSwitcherHints?: ProjectSwitcherHints;
};

function useProjectCoverSignedUrls(hints: ProjectSwitcherHints) {
  const [urlsByPath, setUrlsByPath] = useState<Record<string, string>>({});
  const pathsKey = useMemo(() => {
    const paths = new Set<string>();
    for (const id of Object.keys(hints)) {
      const p = hints[id]?.coverStoragePath;
      if (p) paths.add(p);
    }
    return [...paths].sort().join("|");
  }, [hints]);

  useEffect(() => {
    if (!pathsKey) return;
    const paths = pathsKey.split("|").filter(Boolean);
    if (paths.length === 0) return;

    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.storage
        .from("project-photos")
        .createSignedUrls(paths, STORAGE_CONFIG.SIGNED_URL_EXPIRY);
      if (cancelled || error || !data) return;
      setUrlsByPath((prev) => {
        const next = { ...prev };
        for (const item of data) {
          if (item.signedUrl && item.path) next[item.path] = item.signedUrl;
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [pathsKey]);

  return urlsByPath;
}

export const ProjectSwitcher = memo(function ProjectSwitcher({
  projects,
  currentId,
  onSelect,
  onAdd,
  projectSwitcherHints = {},
}: ProjectSwitcherProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { confirm } = useConfirmation();
  const coverUrls = useProjectCoverSignedUrls(projectSwitcherHints);

  const renderItem = useCallback(
    ({ item: p }: { item: ProjectRow }) => {
      const path = projectSwitcherHints[p.id]?.coverStoragePath ?? null;
      const coverUrl = path ? (coverUrls[path] ?? null) : null;
      return (
        <ProjectCard
          project={p}
          hint={projectSwitcherHints[p.id]}
          coverUrl={coverUrl}
          isActive={p.id === currentId}
          isDeleting={deletingId === p.id}
          onSelect={onSelect}
          setDeletingId={setDeletingId}
          isAnyDeleting={!!deletingId}
          confirm={confirm}
        />
      );
    },
    [currentId, deletingId, onSelect, confirm, projectSwitcherHints, coverUrls],
  );

  const keyExtractor = useCallback((p: ProjectRow) => p.id, []);

  const ListFooter = useCallback(
    () => (
      <TouchableOpacity
        style={styles.addCardWrapper}
        accessibilityLabel="Add new project"
        accessibilityRole="button"
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onAdd();
        }}
      >
        <GlassCard intensity={12} style={[styles.card, styles.addCard]}>
          <View style={[styles.iconContainer, styles.addIconContainer]}>
            <PlusCircle size={18} color="white" />
          </View>
        </GlassCard>
      </TouchableOpacity>
    ),
    [onAdd],
  );

  if (projects.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Switch Project</Text>
      <FlatList
        horizontal
        accessibilityLabel="Your projects"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: 24, paddingRight: 112 },
        ]}
        data={projects}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListFooterComponent={ListFooter}
      />
    </View>
  );
});

const ProjectCard = memo(
  ({
    project: p,
    hint,
    coverUrl,
    isActive,
    isDeleting,
    onSelect,
    setDeletingId,
    isAnyDeleting,
    confirm,
  }: {
    project: ProjectRow;
    hint?: { coverStoragePath: string | null; documentCount: number };
    coverUrl: string | null;
    isActive: boolean;
    isDeleting: boolean;
    onSelect: (id: string) => void;
    setDeletingId: (id: string | null) => void;
    isAnyDeleting: boolean;
    confirm: (options: ConfirmOptions) => void;
  }) => {
    const docCount = hint?.documentCount ?? 0;

    return (
      <TouchableOpacity
        testID={`project-card-${p.name}`}
        accessibilityLabel={`${p.name} project ${isActive ? "(Current)" : ""}`}
        accessibilityRole="button"
        style={styles.cardWrapper}
        disabled={isDeleting}
        onPress={() => {
          if (isDeleting) return;
          Haptics.selectionAsync();
          onSelect(p.id);
        }}
        onLongPress={() => {
          if (isAnyDeleting) return;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          confirm({
            title: "Delete Project",
            message: `Are you sure you want to delete "${p.name}"? This will remove all associated ledger entries and scope items.`,
            confirmLabel: "Delete",
            variant: "destructive",
            onConfirm: async () => {
              setDeletingId(p.id);
              const { error } = await supabase
                .from("projects")
                .delete()
                .eq("id", p.id);
              setDeletingId(null);
              if (error) {
                showAppToast("Couldn't delete project. Please try again.");
              } else {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                showAppToast("Project permanently removed.");
              }
            },
          });
        }}
      >
        <GlassCard
          intensity={isActive ? 0 : 8}
          style={[styles.card, isActive && styles.activeCard]}
        >
          <View style={styles.cardRow}>
            <View
              style={[styles.thumbWrap, isActive && styles.thumbWrapActive]}
            >
              {coverUrl ? (
                <Image
                  source={{ uri: coverUrl }}
                  style={styles.thumbImage}
                  contentFit="cover"
                  transition={180}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <ProjectIcon name={p.name} size={20} />
                </View>
              )}
            </View>
            <View style={styles.textColumn}>
              <Text
                style={[styles.name, isActive && styles.activeName]}
                numberOfLines={2}
              >
                {p.name}
              </Text>
              <Text
                style={[styles.metaText, isActive && styles.activeMetaText]}
                numberOfLines={1}
              >
                {p.created_at
                  ? new Date(p.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
                {p.estimated_min_total
                  ? ` • $${Math.round(p.estimated_min_total / 1000)}k`
                  : " • Planning"}
              </Text>
              {docCount > 0 ? (
                <View style={styles.docRow}>
                  <FileText
                    size={11}
                    color={
                      isActive
                        ? "rgba(13, 148, 136, 0.85)"
                        : Theme.colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.docRowText,
                      isActive && styles.docRowTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {docCount} ledger doc{docCount === 1 ? "" : "s"}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 12,
  },
  label: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  scrollContent: {
    paddingRight: 24,
    gap: 12,
  },
  cardWrapper: {
    width: 208,
  },
  addCardWrapper: {
    width: 80,
  },
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  activeCard: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    borderColor: "rgba(13, 148, 136, 0.2)",
  },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 86,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderStyle: "dashed",
    borderColor: Theme.colors.divider,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  thumbWrapActive: {
    borderColor: "rgba(13, 148, 136, 0.35)",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  activeName: {
    color: Theme.colors.brand.primary,
  },
  metaText: {
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
  },
  activeMetaText: {
    color: "rgba(13, 148, 136, 0.6)",
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  docRowText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
    flex: 1,
  },
  docRowTextActive: {
    color: "rgba(13, 148, 136, 0.85)",
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  addIconContainer: {
    backgroundColor: Theme.colors.brand.primary,
  },
});
