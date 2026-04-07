import { useEffect, useState, useCallback } from "react";
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

const ENTITLEMENT_ID = "Bluprntai Pro";

export function usePremium() {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  const updateCustomerInfo = useCallback((info: CustomerInfo) => {
    const proActive =
      typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    setIsPro(proActive);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        // Fetch current customer info
        const customerInfo = await Purchases.getCustomerInfo();
        updateCustomerInfo(customerInfo);

        // Fetch offerings
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null) {
          setOffering(offerings.current);
        }
      } catch (e) {
        console.error("Error initializing RevenueCat:", e);
        setLoading(false);
      }
    }

    init();

    // Listen for customer info updates
    const listener = (info: CustomerInfo) => updateCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      // Cleanup listener
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [updateCustomerInfo]);

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

  const restore = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      updateCustomerInfo(customerInfo);
      return true;
    } catch (e) {
      console.error("Restore error:", e);
      return false;
    }
  };

  return {
    isPro,
    loading,
    offering,
    purchase,
    restore,
    packages: offering?.availablePackages || [],
  };
}
