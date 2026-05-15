import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Users, Phone, Mail, Lock, FileText } from "lucide-react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { deriveHomeTeam } from "@shared/lib/home-team";
import type { LedgerEntryRow } from "@shared/types/database";
import { money } from "@shared/lib/formatters";
import { DocumentThumbnail } from "@/components/DocumentThumbnail";

export function HomeTeamSection({
  ledgerEntries,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
}: {
  ledgerEntries: LedgerEntryRow[];
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
}) {
  const team = deriveHomeTeam(ledgerEntries as LedgerEntryRow[]);
  const isUnlocked = isArchitect || hasProjectPass;

  if (team.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Users size={24} color={Theme.colors.text.disabled} />
        </View>
        <Text style={styles.emptyTitle}>Building your Team</Text>
        <Text style={styles.emptyText}>
          As you add ledger entries, we’ll automatically build a directory of
          your contractors.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>THE HOME TEAM</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{team.length} Pros</Text>
        </View>
      </View>

      <View style={styles.list}>
        {team.slice(0, 10).map((pro) => (
          <GlassCard key={pro.name} style={styles.proCard} intensity={4}>
            <View style={styles.proMain}>
              <View style={styles.avatarWrap}>
                {pro.preview_ledger_entry_id ? (
                  <DocumentThumbnail
                    ledgerEntryId={pro.preview_ledger_entry_id}
                    size={44}
                    style={styles.docThumb}
                    fileType={null}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>
                      {pro.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.proInfo}>
                <Text style={styles.proName} numberOfLines={2}>
                  {pro.name}
                </Text>
                <Text style={styles.proMeta} numberOfLines={1}>
                  Billed {money(pro.total_billed)} •{" "}
                  {new Date(pro.last_activity).getFullYear()}
                </Text>
                {pro.documents_count > 0 ? (
                  <View style={styles.docHint}>
                    <FileText
                      size={12}
                      color="rgba(13, 148, 136, 0.75)"
                      strokeWidth={2.2}
                    />
                    <Text style={styles.docHintText} numberOfLines={1}>
                      {pro.documents_count} ledger file
                      {pro.documents_count === 1 ? "" : "s"}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.actions}>
                {isUnlocked ? (
                  <>
                    {pro.contact_info.phone && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={async () => {
                          try {
                            await Linking.openURL(
                              `tel:${pro.contact_info.phone}`,
                            );
                          } catch {
                            // gracefully ignore unhandled scheme errors on simulators/iPads
                          }
                        }}
                      >
                        <Phone size={16} color={Theme.colors.brand.primary} />
                      </TouchableOpacity>
                    )}
                    {pro.contact_info.email && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={async () => {
                          try {
                            await Linking.openURL(
                              `mailto:${pro.contact_info.email}`,
                            );
                          } catch {
                            // gracefully ignore
                          }
                        }}
                      >
                        <Mail size={16} color={Theme.colors.brand.primary} />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.lockBtn}
                    onPress={onUpgradeClick}
                  >
                    <Lock size={12} color={Theme.colors.brand.primary} />
                    <Text style={styles.lockBtnText}>Unlock</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </GlassCard>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingTop: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 2,
  },
  badge: {
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
  },
  list: {
    gap: 10,
    paddingTop: 2,
  },
  proCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Theme.radius.xl,
  },
  proMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    borderRadius: 14,
    overflow: "hidden",
  },
  docThumb: {
    borderRadius: 14,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(13, 148, 136, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.12)",
  },
  avatarText: {
    fontSize: 13,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
  },
  proInfo: {
    flex: 1,
    minWidth: 0,
  },
  proName: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  proMeta: {
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    marginTop: 2,
  },
  docHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  docHintText: {
    flex: 1,
    fontSize: 10,
    fontFamily: Theme.typography.family.semibold,
    color: "rgba(13, 148, 136, 0.8)",
  },
  actions: {
    flexDirection: "row",
    gap: 4,
    alignSelf: "flex-start",
    paddingTop: 2,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(13, 148, 136, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(13, 148, 136, 0.05)",
  },
  lockBtnText: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    textTransform: "uppercase",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Theme.colors.border,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.01)",
    marginTop: 24,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    textAlign: "center",
    lineHeight: 16,
  },
});
