import type { PurchasesPackage } from "react-native-purchases";

export const RC_PACKAGE_MONTHLY = "$rc_monthly";
export const RC_PACKAGE_LIFETIME = "$rc_lifetime";

/** App Store product IDs for BLUPRNT iOS (must match RevenueCat + ASC). */
const IOS_STORE_PRODUCT_MONTHLY = "monthly";
const IOS_STORE_PRODUCT_PROJECT_PASS = "lifetime";

export function findUpgradePackage(
  packages: PurchasesPackage[],
  plan: "monthly" | "projectPass",
): PurchasesPackage | undefined {
  if (plan === "monthly") {
    return (
      packages.find((p) => p.identifier === RC_PACKAGE_MONTHLY) ??
      packages.find(
        (p) => p.product.identifier === IOS_STORE_PRODUCT_MONTHLY,
      ) ??
      packages.find((p) => p.packageType === "MONTHLY")
    );
  }

  return (
    packages.find((p) => p.identifier === RC_PACKAGE_LIFETIME) ??
    packages.find(
      (p) => p.product.identifier === IOS_STORE_PRODUCT_PROJECT_PASS,
    ) ??
    packages.find((p) => p.product.identifier === "project_pass") ??
    packages.find((p) => p.packageType === "LIFETIME")
  );
}

export function formatPackagePrice(pkg: PurchasesPackage): string | null {
  const price = pkg.product.priceString?.trim();
  return price || null;
}
