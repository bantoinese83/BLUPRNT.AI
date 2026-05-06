import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Users, Phone, Mail, Lock } from "lucide-react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { deriveHomeTeam } from "@shared/lib/home-team";
import type { LedgerEntryRow } from "@shared/types/database";
import { money } from "@shared/lib/formatters";

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
        {team.slice(0, 3).map((pro) => (
          <GlassCard key={pro.name} style={styles.proCard} intensity={4}>
            <View style={styles.proMain}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {pro.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.proInfo}>
                <Text style={styles.proName} numberOfLines={1}>
                  {pro.name}
                </Text>
                <Text style={styles.proMeta}>
                  Billed {money(pro.total_billed)} •{" "}
                  {new Date(pro.last_activity).getFullYear()}
                </Text>
              </View>

              <View style={styles.actions}>
                {isUnlocked ? (
                  <>
                    {pro.contact_info.phone && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() =>
                          Linking.openURL(`tel:${pro.contact_info.phone}`)
                        }
                      >
                        <Phone size={16} color={Theme.colors.brand.primary} />
                      </TouchableOpacity>
                    )}
                    {pro.contact_info.email && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() =>
                          Linking.openURL(`mailto:${pro.contact_info.email}`)
                        }
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    letterSpacing: 2,
  },
  badge: {
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
  },
  list: {
    gap: 10,
  },
  proCard: {
    padding: 12,
    borderRadius: Theme.radius.xl,
  },
  proMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(13, 148, 136, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
  },
  proInfo: {
    flex: 1,
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
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 4,
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
