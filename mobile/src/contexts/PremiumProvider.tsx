import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { ARCHITECT_ENTITLEMENT_ID } from "@shared/lib/architect-entitlement";
import { Sentry } from "@/lib/sentry";
import { PremiumContext, type PremiumContextValue } from "./premium-context";

async function isPurchasesConfigured(): Promise<boolean> {
  try {
    return await Purchases.isConfigured();
  } catch {
    return false;
  }
}

/** RevenueCat is configured in RootLayout; allow one frame for native init. */
async function waitForPurchasesConfigured(maxMs = 4000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (await isPurchasesConfigured()) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringsError, setOfferingsError] = useState(false);
  const [noProductsConfigured, setNoProductsConfigured] = useState(false);

  const mounted = useRef(true);
  const loadGeneration = useRef(0);

  const updateCustomerInfo = useCallback((info: CustomerInfo) => {
    const proActive =
      typeof info.entitlements.active[ARCHITECT_ENTITLEMENT_ID] !== "undefined";
    setIsPro(proActive);
  }, []);

  const loadRevenueCat = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setLoading(true);
    setOfferingsError(false);
    setNoProductsConfigured(false);

    if (!(await waitForPurchasesConfigured())) {
      if (mounted.current && generation === loadGeneration.current) {
        setOfferingsError(true);
        setOffering(null);
        setLoading(false);
      }
      return;
    }

    try {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (mounted.current && generation === loadGeneration.current) {
          updateCustomerInfo(customerInfo);
        }
      } catch (e) {
        // Sandbox / network glitches on customer info must not block the paywall.
        console.warn("[revenuecat] getCustomerInfo failed:", e);
        Sentry.captureException(e, {
          tags: { revenuecat: "getCustomerInfo" },
          level: "warning",
        });
      }

      const offerings = await Purchases.getOfferings();
      if (!mounted.current || generation !== loadGeneration.current) return;

      if (offerings.current !== null) {
        setOffering(offerings.current);
        setNoProductsConfigured(false);
        setOfferingsError(false);
      } else {
        setOffering(null);
        setNoProductsConfigured(true);
        setOfferingsError(false);
      }
    } catch (e) {
      console.error("[revenuecat] getOfferings failed:", e);
      Sentry.captureException(e, { tags: { revenuecat: "getOfferings" } });
      if (mounted.current && generation === loadGeneration.current) {
        setOfferingsError(true);
        setOffering(null);
        setNoProductsConfigured(false);
      }
    } finally {
      if (mounted.current && generation === loadGeneration.current) {
        setLoading(false);
      }
    }
  }, [updateCustomerInfo]);

  useEffect(() => {
    mounted.current = true;
    void loadRevenueCat();

    const listener = (info: CustomerInfo) => {
      updateCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      mounted.current = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [loadRevenueCat, updateCustomerInfo]);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        updateCustomerInfo(customerInfo);
        return true;
      } catch (e: unknown) {
        if (
          e &&
          typeof e === "object" &&
          "userCancelled" in e &&
          !e.userCancelled
        ) {
          console.error("Purchase error:", e);
          throw e;
        }
        return false;
      }
    },
    [updateCustomerInfo],
  );

  const restore = useCallback(async (): Promise<
    "ok" | "not_found" | "error"
  > => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      updateCustomerInfo(customerInfo);
      const hasPro =
        typeof customerInfo.entitlements.active[ARCHITECT_ENTITLEMENT_ID] !==
        "undefined";
      return hasPro ? "ok" : "not_found";
    } catch (e) {
      console.error("Restore error:", e);
      return "error";
    }
  }, [updateCustomerInfo]);

  const value = useMemo<PremiumContextValue>(
    () => ({
      isPro,
      loading,
      offering,
      offeringsError,
      noProductsConfigured,
      packages: offering?.availablePackages ?? [],
      retryOfferings: loadRevenueCat,
      purchase,
      restore,
    }),
    [
      isPro,
      loading,
      offering,
      offeringsError,
      noProductsConfigured,
      loadRevenueCat,
      purchase,
      restore,
    ],
  );

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
}
