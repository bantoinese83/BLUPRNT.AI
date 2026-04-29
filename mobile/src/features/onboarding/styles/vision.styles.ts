import { StyleSheet } from "react-native";
import { Theme } from "@/constants/Theme";

export const visionStyles = StyleSheet.create({
  visionContainer: {
    flex: 1,
  },
  visionActions: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  visionButton: {
    flex: 1,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  visionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  visionLabel: {
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  visionHint: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.secondary,
    marginTop: 4,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  photoRemoveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scopeInputCard: {
    padding: 16,
    borderRadius: 20,
  },
  scopeInput: {
    minHeight: 120,
    color: Theme.colors.text.primary,
    fontSize: 16,
    fontFamily: Theme.typography.family.regular,
    textAlignVertical: "top",
  },
  visionAsset: {
    width: "100%",
    height: "100%",
  },
});
