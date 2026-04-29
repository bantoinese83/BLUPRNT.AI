import { StyleSheet } from "react-native";
import { Theme } from "@/constants/Theme";

export const finalStyles = StyleSheet.create({
  badgeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  successText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: "#10b981",
    textTransform: "uppercase",
  },
  reviewCard: {
    padding: 24,
    borderRadius: 24,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  accountChoice: {
    gap: 16,
    marginTop: 20,
  },
  accountBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: Theme.colors.brand.primary,
    gap: 16,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  accountBtnText: {
    fontSize: 18,
    fontFamily: Theme.typography.family.bold,
    color: "white",
  },
  skipContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: Theme.colors.text.secondary,
    fontSize: 14,
    fontFamily: Theme.typography.family.medium,
    textDecorationLine: "underline",
  },
});
