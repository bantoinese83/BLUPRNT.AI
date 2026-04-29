import { StyleSheet } from "react-native";
import { Theme } from "@/constants/Theme";

export const selectorStyles = StyleSheet.create({
  // ProjectTypeSelector
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
  },
  iconCard: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "white",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCardActive: {
    borderColor: Theme.colors.brand.primary,
    borderWidth: 2,
    backgroundColor: Theme.colors.brand.primary + "05",
  },
  iconCircleBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconCircleBigActive: {
    backgroundColor: Theme.colors.brand.primary + "15",
  },
  iconLabel: {
    fontSize: 14,
    fontFamily: Theme.typography.family.black,
    color: "#64748b",
  },
  iconLabelActive: {
    color: Theme.colors.brand.primary,
  },
  checkSeal: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // LocationSelector
  zipInputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  zipTextInput: {
    flex: 1,
    minHeight: 72,
    paddingLeft: 20,
    paddingRight: 8,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 28,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: 2,
    textAlignVertical: "center",
  },
  zipLocateButton: {
    width: 52,
    height: 52,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  zipLocateButtonDisabled: {
    opacity: 0.65,
  },
  zipLocateHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
  },

  // StageSelector
  options: {
    gap: 12,
  },
  stageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 16,
  },
  stageButtonActive: {
    borderColor: Theme.colors.brand.primary,
    backgroundColor: Theme.colors.brand.primary + "05",
  },
  stageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  stageIconContainerActive: {
    backgroundColor: Theme.colors.brand.primary + "15",
  },
  stageText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Theme.typography.family.semibold,
    color: "#334155",
  },
  stageTextActive: {
    color: Theme.colors.brand.primary,
  },
  stageDescription: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
});
