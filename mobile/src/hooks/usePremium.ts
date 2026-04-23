import { useEffect, useState, useCallback, useRef } from "react";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { ARCHITECT_ENTITLEMENT_ID } from "@shared/lib/architect-entitlement";

export function usePremium() {
  const [isPro, setIsPro] = useState<boolean>(false);
  /** True until the first offerings + customer info load finishes. */
  const [loading, setLoading] = useState<boolean>(true);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  /** Network / SDK failure while fetching offerings. */
  const [offeringsError, setOfferingsError] = useState<boolean>(false);
  /** Offerings loaded but no `current` offering (App Store / RevenueCat not ready). */
  const [noProductsConfigured, setNoProductsConfigured] =
    useState<boolean>(false);

  const mounted = useRef(true);

  const updateCustomerInfo = useCallback((info: CustomerInfo) => {
    const proActive =
      typeof info.entitlements.active[ARCHITECT_ENTITLEMENT_ID] !== "undefined";
    setIsPro(proActive);
  }, []);

  const loadRevenueCat = useCallback(async () => {
    setLoading(true);
    setOfferingsError(false);
    setNoProductsConfigured(false);
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      updateCustomerInfo(customerInfo);

      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        setOffering(offerings.current);
        setNoProductsConfigured(false);
      } else {
        setOffering(null);
        setNoProductsConfigured(true);
      }
    } catch (e) {
      console.error("Error loading RevenueCat offerings:", e);
      setOfferingsError(true);
      setOffering(null);
      setNoProductsConfigured(false);
    } finally {
      if (mounted.current) {
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

  const purchase = async (pkg: PurchasesPackage) => {
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
  };

  /** @returns `ok` if Architect is active; `not_found` if the call succeeded but no sub; `error` on failure. */
  const restore = async (): Promise<"ok" | "not_found" | "error"> => {
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
  };

  return {
    isPro,
    loading,
    offering,
    offeringsError,
    noProductsConfigured,
    retryOfferings: loadRevenueCat,
    purchase,
    restore,
    packages: offering?.availablePackages || [],
  };
}
