import { cityFromZip } from "../supabase/functions/photo-to-scope/_shared/estimate.ts";

const testZips = [
  "10001", // NYC
  "60601", // Chicago
  "90210", // LA
  "02108", // Boston (021)
  "33101", // Miami (prefix 331 -> Florida East Coast)
  "12345", // General prefix 123 -> Mid-Atlantic US
  "99999", // Unknown -> Pacific Northwest US
];

console.log("Testing cityFromZip enrichment:");
testZips.forEach((zip) => {
  console.log(`${zip} -> ${cityFromZip(zip)}`);
});
