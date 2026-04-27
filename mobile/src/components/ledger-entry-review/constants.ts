import { Dimensions } from "react-native";
import { Receipt, type LucideIcon } from "lucide-react-native";

export const DEFAULT_DOC_ICON: LucideIcon = Receipt;

export const STATUS_COLORS: Record<string, string> = {
  paid: "#10b981",
  pending: "#f59e0b",
  overdue: "#f43f5e",
};

export const sheetMaxH = Math.round(Dimensions.get("window").height * 0.9);
