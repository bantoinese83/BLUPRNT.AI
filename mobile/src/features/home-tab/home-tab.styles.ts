import { StyleSheet } from "react-native";
import { Theme } from "@/constants/Theme";

export const homeTabStyles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 24,
  },
  sectionHeader: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 16,
    marginLeft: 4,
    marginTop: 8,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  captureBtn: {
    backgroundColor: Theme.colors.brand.primary,
    borderColor: "transparent",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  userFirstName: {
    fontSize: 28,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  insightsDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Theme.colors.header,
  },
});
