import React from "react";
import { View, Text } from "react-native";
import { Layers } from "lucide-react-native";
import { money } from "../../../../../shared/lib/formatters";
import { Theme } from "../../../constants/Theme";
import type { ScopeItem } from "../../../lib/onboarding-helpers";
import { onboardingStyles as styles } from "../onboarding-screen.styles";

/** Line-item costs from AI scope — shown when the user opens “Breakdown”. */
export function ScopeEstimateBreakdown({ items }: { items: ScopeItem[] }) {
  if (!items?.length) return null;

  return (
    <View style={styles.scopeBreakdownContainer}>
      <View style={styles.materialHeader}>
        <Layers size={12} color={Theme.colors.brand.primary} />
        <Text style={styles.materialHeaderText}>Cost breakdown</Text>
      </View>
      <View style={styles.scopeLineList}>
        {items.map((item, idx) => (
          <View
            key={`${item.category}-${idx}`}
            style={[
              styles.scopeLineCard,
              idx < items.length - 1 && styles.scopeLineCardBorder,
            ]}
          >
            <View style={styles.scopeLineTextCol}>
              <Text style={styles.scopeLineCategory}>{item.category}</Text>
              {item.description ? (
                <Text style={styles.scopeLineDesc}>{item.description}</Text>
              ) : null}
              <Text style={styles.scopeLineMeta}>
                {item.quantity} {item.unit}
              </Text>
            </View>
            <Text style={styles.scopeLineCost}>
              {money(item.total_cost_min, item.total_cost_max)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
