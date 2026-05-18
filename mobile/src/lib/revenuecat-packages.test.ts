import { describe, it, expect } from "vitest";
import {
  findUpgradePackage,
  RC_PACKAGE_LIFETIME,
  RC_PACKAGE_MONTHLY,
} from "./revenuecat-packages";
import type { PurchasesPackage } from "react-native-purchases";

function mockPackage(
  identifier: string,
  productId: string,
  packageType?: string,
): PurchasesPackage {
  return {
    identifier,
    packageType,
    product: { identifier: productId },
  } as unknown as PurchasesPackage;
}

describe("findUpgradePackage", () => {
  const packages = [
    mockPackage(RC_PACKAGE_MONTHLY, "monthly", "MONTHLY"),
    mockPackage(RC_PACKAGE_LIFETIME, "lifetime", "LIFETIME"),
  ];

  it("resolves monthly and lifetime by RC package id", () => {
    expect(findUpgradePackage(packages, "monthly")?.identifier).toBe(
      RC_PACKAGE_MONTHLY,
    );
    expect(findUpgradePackage(packages, "projectPass")?.identifier).toBe(
      RC_PACKAGE_LIFETIME,
    );
  });

  it("falls back to store product id when package ids differ", () => {
    const alt = [mockPackage("custom_monthly", "monthly", "MONTHLY")];
    expect(findUpgradePackage(alt, "monthly")?.product.identifier).toBe(
      "monthly",
    );
  });
});
