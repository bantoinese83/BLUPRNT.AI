import { Dimensions } from "react-native";
import {
  Receipt,
  Wrench,
  ShieldCheck,
  CreditCard,
  Tag,
  LucideIcon,
} from "lucide-react-native";

export const DOC_ICONS: Record<string, LucideIcon> = {
  invoice: Wrench,
  quote: Tag,
  warranty: ShieldCheck,
  permit: CreditCard,
};

export const DEFAULT_DOC_ICON = Receipt;

export const STATUS_COLORS: Record<string, string> = {
  paid: "#10b981",
  pending: "#f59e0b",
  overdue: "#f43f5e",
};

export const sheetMaxH = Math.round(Dimensions.get("window").height * 0.9);
