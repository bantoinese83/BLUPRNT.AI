import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Wrench, ShieldCheck, Trash2, Clock, Lock } from "lucide-react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { money, getWarrantyStatus } from "@shared/lib/formatters";
import type { InvoiceRow } from "@shared/types/database";
import { financeTabStyles as styles } from "@/features/finance-tab/finance-tab.styles";

type FinanceInvoiceRowProps = {
  inv: InvoiceRow;
  index: number;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
  onPress: () => void;
  onViewOriginal: () => void;
  onDelete?: (id: string) => void;
};

export function FinanceInvoiceRow({
  inv,
  index,
  hasProjectPass,
  onUpgradeClick,
  onPress,
  onViewOriginal,
  onDelete,
}: FinanceInvoiceRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const warranty = getWarrantyStatus(inv.warranty_expiry_date);
  const isWarrantyUnlocked = hasProjectPass;

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    });

    return (
      <View style={{ width: 80, marginBottom: 12 }}>
        <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
          <RectButton
            style={{
              flex: 1,
              backgroundColor: Theme.colors.status.error,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: Theme.radius.lg,
              marginLeft: 8,
            }}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
              swipeableRef.current?.close();
              onDelete?.(inv.id);
            }}
          >
            <Trash2 size={20} color="white" />
          </RectButton>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={{ paddingHorizontal: 24 }}>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: Math.min(index * 50, 400) }}
        style={{ paddingBottom: 12 }}
      >
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          friction={2}
          rightThreshold={40}
        >
          <GlassCard intensity={8} style={styles.invoiceCard}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
              <View style={styles.invoiceMain}>
                <View style={styles.invoiceIcon}>
                  {(inv.document_type || "invoice").toLowerCase() ===
                  "invoice" ? (
                    <Wrench size={18} color={Theme.colors.text.muted} />
                  ) : (
                    <ShieldCheck size={18} color={Theme.colors.text.muted} />
                  )}
                </View>
                <View style={styles.invoiceText}>
                  <Text
                    style={styles.vendorName}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {inv.vendor_name || "Uncategorized"}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={styles.invoiceDate}>
                      {new Date(inv.created_at).toLocaleDateString()} •{" "}
                      {inv.document_type || "Invoice"}
                    </Text>

                    {warranty &&
                      (isWarrantyUnlocked ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 2,
                            backgroundColor: warranty.isExpired
                              ? "rgba(244, 63, 94, 0.1)"
                              : "rgba(16, 185, 129, 0.1)",
                            paddingHorizontal: 4,
                            paddingVertical: 1,
                            borderRadius: 4,
                          }}
                        >
                          <Clock
                            size={10}
                            color={
                              warranty.isExpired
                                ? Theme.colors.status.error
                                : Theme.colors.status.success
                            }
                          />
                          <Text
                            style={{
                              fontSize: 9,
                              fontFamily: Theme.typography.family.bold,
                              color: warranty.isExpired
                                ? Theme.colors.status.error
                                : Theme.colors.status.success,
                              textTransform: "uppercase",
                            }}
                          >
                            {warranty.label}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={onUpgradeClick}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 2,
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            paddingHorizontal: 5,
                            paddingVertical: 1,
                            borderRadius: 4,
                          }}
                        >
                          <Lock size={8} color="#d97706" />
                          <Text
                            style={{
                              fontSize: 8,
                              fontFamily: Theme.typography.family.black,
                              color: "#d97706",
                              textTransform: "uppercase",
                            }}
                          >
                            Track Warranty
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
                <Text style={styles.invoiceAmount}>{money(inv.total)}</Text>
              </View>
            </TouchableOpacity>
            {inv.document_id ? (
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  onViewOriginal();
                }}
                style={styles.viewOriginalBtn}
              >
                <Text style={styles.viewOriginalText}>View original</Text>
              </TouchableOpacity>
            ) : null}
          </GlassCard>
        </Swipeable>
      </MotiView>
    </View>
  );
}
