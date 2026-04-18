import React from "react";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import ProfileScreenFeature from "@/features/profile-tab/ProfileScreen";

export default function ProfileScreen() {
  return (
    <ComponentErrorBoundary name="Profile">
      <ProfileScreenFeature />
    </ComponentErrorBoundary>
  );
}
