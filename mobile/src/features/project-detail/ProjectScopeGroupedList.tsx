import React from "react";
import { Text } from "react-native";
import { MotiView } from "moti";
import { projectDetailStyles as styles } from "./project-detail.styles";
import { ProjectScopeLineCard } from "./ProjectScopeLineCard";
import type { ScopeRow } from "@shared/types/database";

type Props = {
  groupedScope: Record<string, ScopeRow[]>;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
};

export function ProjectScopeGroupedList({
  groupedScope,
  expandedId,
  setExpandedId,
}: Props) {
  const toggle = (itemId: string) => {
    setExpandedId(expandedId === itemId ? null : itemId);
  };

  return (
    <>
      {Object.entries(groupedScope).map(([category, items], catIndex) => (
        <MotiView
          key={category}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 600,
            delay: 200 + catIndex * 150,
          }}
          style={styles.categorySection}
        >
          <Text style={styles.categoryTitle}>{category}</Text>
          {items.map((item, index) => (
            <ProjectScopeLineCard
              key={item.id}
              item={item}
              catIndex={catIndex}
              index={index}
              expandedId={expandedId}
              onToggleExpand={toggle}
            />
          ))}
        </MotiView>
      ))}
    </>
  );
}
