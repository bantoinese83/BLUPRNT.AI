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
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
  },
  successText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.status.success,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accountChoice: {
    marginTop: 20,
    width: "100%",
  },
  accountBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.brand.primary,
    padding: 20,
    borderRadius: 24,
    gap: 16,
    shadowColor: Theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountBtnText: {
    flex: 1,
    fontSize: 18,
    fontFamily: Theme.typography.family.black,
    color: "white",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },
  dividerText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
  },
  handoffBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
  },
  handoffBtnText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
  },
  skipContainer: {
    marginTop: "auto",
    alignItems: "center",
    paddingBottom: 20,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    textDecorationLine: "underline",
  },
});
