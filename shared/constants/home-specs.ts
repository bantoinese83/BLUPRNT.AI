export const PHYSICAL_ASSET_CATEGORIES = [
  { id: "Paint", label: "Paint" },
  { id: "Tile", label: "Tile & Stone" },
  { id: "Fixture", label: "Fixtures" },
  { id: "Hardware", label: "Hardware" },
  { id: "Other", label: "Other" },
] as const;

export type PhysicalAssetCategory =
  (typeof PHYSICAL_ASSET_CATEGORIES)[number]["id"];
