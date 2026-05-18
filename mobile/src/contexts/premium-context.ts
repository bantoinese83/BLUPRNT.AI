import { createContext, useContext } from "react";
import type {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

export type PremiumContextValue = {
  isPro: boolean;
  loading: boolean;
  offering: PurchasesOffering | null;
  offeringsError: boolean;
  noProductsConfigured: boolean;
  packages: PurchasesPackage[];
  retryOfferings: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<"ok" | "not_found" | "error">;
};

export const PremiumContext = createContext<PremiumContextValue | null>(null);

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error("usePremium must be used within PremiumProvider");
  }
  return ctx;
}
