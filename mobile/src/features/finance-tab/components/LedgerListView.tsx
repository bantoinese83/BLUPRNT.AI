import React from "react";
import { View, SectionList, Text } from "react-native";
import { Receipt } from "lucide-react-native";
import { FinanceLedgerEntryRow } from "@/features/finance-tab/FinanceLedgerEntryRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { Theme } from "@/constants/Theme";
import { financeTabStyles as styles } from "@/features/finance-tab/finance-tab.styles";
import { FINANCE_TAB_BAR_OFFSET } from "@/features/finance-tab/constants";
import type { LedgerEntryRow } from "@shared/types/database";

interface LedgerListViewProps {
  sections: { title: string; data: LedgerEntryRow[] }[];
  refreshing: boolean;
  onRefresh: () => void;
  renderHeader: () => React.ReactElement | null;
  hasProjectPass: boolean;
  deletingId: string | null;
  onEntryPress: (entry: LedgerEntryRow) => void;
  onViewOriginal: (id: string) => void;
  onDelete: (id: string) => void;
  onUpgradeClick: () => void;
  onOpenCapture: () => void;
  onResetFilter: () => void;
  ledgerEntriesCount: number;
}

export function LedgerListView({
  sections,
  refreshing,
  onRefresh,
  renderHeader,
  hasProjectPass,
  deletingId,
  onEntryPress,
  onViewOriginal,
  onDelete,
  onUpgradeClick,
  onOpenCapture,
  onResetFilter,
  ledgerEntriesCount,
}: LedgerListViewProps) {
  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <View
      style={[
        styles.monthGroup,
        {
          paddingHorizontal: 24,
          paddingTop: 6,
          paddingBottom: 4,
          backgroundColor: Theme.colors.background,
        },
      ]}
    >
      <View style={styles.monthHeader}>
        <Text style={styles.monthHeaderText}>{title}</Text>
        <View style={styles.monthHeaderLine} />
      </View>
    </View>
  );

  const renderItem = ({
    item: inv,
    index,
  }: {
    item: LedgerEntryRow;
    index: number;
  }) => (
    <FinanceLedgerEntryRow
      inv={inv}
      index={index}
      hasProjectPass={hasProjectPass}
      isDeleting={deletingId === inv.id}
      onUpgradeClick={onUpgradeClick}
      onPress={() => onEntryPress(inv)}
      onViewOriginal={() => onViewOriginal(inv.id)}
      onDelete={onDelete}
    />
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={renderHeader}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      contentContainerStyle={{ paddingBottom: FINANCE_TAB_BAR_OFFSET + 20 }}
      stickySectionHeadersEnabled
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          {ledgerEntriesCount === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No documents yet"
              description="Add invoices, quotes, or other records—they all show up here as your permanent project record."
              actionTitle="Add to ledger"
              onAction={onOpenCapture}
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No documents match this filter"
              description="Switch to “All” to see every record, or add a document in this category."
              actionTitle="Show all"
              onAction={onResetFilter}
            />
          )}
        </View>
      }
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
    />
  );
}
