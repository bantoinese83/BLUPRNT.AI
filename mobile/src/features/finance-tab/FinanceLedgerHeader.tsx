import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import {
  BookOpen,
  ChevronLeft,
  Wrench,
  ShieldCheck,
  FileDown,
  Plus,
} from "lucide-react-native";
import { MotiView } from "moti";
import { router } from "expo-router";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { money } from "@shared/lib/formatters";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { Theme } from "@/constants/Theme";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DashboardLoadErrorBanner } from "@/components/DashboardLoadErrorBanner";
import type { InvoiceRow, ProjectRow } from "@shared/types/database";
import type { InvoiceLedgerFilter } from "@/features/finance-tab/ledger-helpers";
import { financeTabStyles as styles } from "@/features/finance-tab/finance-tab.styles";

type FinanceLedgerHeaderProps = {
  loadError: string | null;
  onRetryLoad: () => void;
  onDismissLoadError: () => void;
  projects: ProjectRow[];
  project: ProjectRow;
  onProjectSelect: (id: string) => void;
  onPressAddDocument: () => void;
  isUploading: boolean;
  stats: { capital: number; maintenance: number; total: number };
  includeAppendix: boolean;
  onIncludeAppendixChange: (value: boolean) => void;
  exporting: boolean;
  onExport: () => void;
  invoices: InvoiceRow[];
  filter: InvoiceLedgerFilter;
  onFilterChange: (next: InvoiceLedgerFilter) => void;
};

export function FinanceLedgerHeader({
  loadError,
  onRetryLoad,
  onDismissLoadError,
  projects,
  project,
  onProjectSelect,
  onPressAddDocument,
  isUploading,
  stats,
  includeAppendix,
  onIncludeAppendixChange,
  exporting,
  onExport,
  invoices,
  filter,
  onFilterChange,
}: FinanceLedgerHeaderProps) {
  return (
    <>
      {loadError ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <DashboardLoadErrorBanner
            message={loadError}
            onRetry={onRetryLoad}
            onDismiss={onDismissLoadError}
          />
        </View>
      ) : null}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft
              size={24}
              color={Theme.colors.text.primary}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
          <Text style={styles.pageTitleCenter} numberOfLines={1}>
            Property Ledger
          </Text>
          <TouchableOpacity
            style={styles.headerCaptureBtn}
            onPress={onPressAddDocument}
            disabled={isUploading}
            accessibilityLabel="Add to ledger"
            accessibilityHint="Upload an invoice, quote, or receipt"
          >
            {isUploading ? (
              <SnurraLoader size={SnurraSize.inline} tone="onPrimary" />
            ) : (
              <Plus size={22} color="white" />
            )}
          </TouchableOpacity>
        </View>
        <ProjectSwitcher
          projects={projects}
          currentId={project.id}
          onSelect={onProjectSelect}
          onAdd={() => router.push("/onboarding?newProject=1")}
        />
      </View>

      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 600 }}
        >
          <GlassCard style={styles.mainCard}>
            <View style={styles.ledgerHeader}>
              <View style={styles.iconBox}>
                <BookOpen size={24} color={Theme.colors.brand.primary} />
              </View>
              <View>
                <Text style={styles.ledgerTitle}>Property record</Text>
                <Text style={styles.ledgerSubtitle}>
                  Property equity tracking
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statRow}>
                <View style={styles.statLabelContainer}>
                  <Wrench size={14} color={Theme.colors.brand.light} />
                  <Text style={styles.statLabel}>Capital</Text>
                </View>
                <Text style={styles.statValue}>{money(stats.capital)}</Text>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statLabelContainer}>
                  <ShieldCheck size={14} color={Theme.colors.status.success} />
                  <Text style={styles.statLabel}>Maintenance</Text>
                </View>
                <Text style={styles.statValue}>{money(stats.maintenance)}</Text>
              </View>
            </View>

            <View style={styles.appendixRow}>
              <View style={styles.appendixTextCol}>
                <Text style={styles.appendixLabel}>Append image originals</Text>
                <Text style={styles.appendixHint}>
                  Larger PDF. PDF uploads appear as notes only, not full pages.
                </Text>
              </View>
              <Switch
                value={includeAppendix}
                onValueChange={onIncludeAppendixChange}
                disabled={
                  exporting || !invoices.some((i) => Boolean(i.document_id))
                }
                trackColor={{
                  false: "rgba(148,163,184,0.35)",
                  true: Theme.colors.brand.primary,
                }}
                thumbColor={Theme.colors.inputBg}
              />
            </View>

            <Button
              title={exporting ? "Generating..." : "Export Seller Packet"}
              onPress={onExport}
              disabled={exporting}
              style={styles.exportButton}
              icon={
                exporting ? (
                  <SnurraLoader size={SnurraSize.inline} tone="onPrimary" />
                ) : (
                  <FileDown size={18} color="white" />
                )
              }
            />
          </GlassCard>
        </MotiView>

        <SegmentedControl
          options={[
            { label: "All", value: "all" },
            { label: "Capital", value: "capital" },
            { label: "Maintenance", value: "maintenance" },
          ]}
          value={filter}
          onChange={(val: string) => {
            onFilterChange(val as InvoiceLedgerFilter);
          }}
          containerStyle={{ marginTop: 32, marginBottom: 16 }}
        />
      </View>
    </>
  );
}
