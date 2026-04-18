import React from "react";

import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ConfigurationRequired } from "@/components/ConfigurationRequired";

import { ProfileScreenContent } from "./ProfileScreenContent";
import { useProfileScreen } from "./useProfileScreen";

export default function ProfileScreen() {
  const { configurationMissing, onRetryConfiguration, ...contentProps } =
    useProfileScreen();

  if (configurationMissing) {
    return (
      <ScreenWrapper withLogo withScroll edges={["top", "left", "right"]}>
        <ConfigurationRequired onRetry={() => void onRetryConfiguration()} />
      </ScreenWrapper>
    );
  }

  return <ProfileScreenContent {...contentProps} />;
}
