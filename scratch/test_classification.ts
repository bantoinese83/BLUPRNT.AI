import { inferDocumentTypeFromFilename } from "../shared/lib/infer-document-type";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleDocsDir = path.join(__dirname, "../sample-docs");
const files = fs.readdirSync(sampleDocsDir);

console.log("Testing Classification Logic:\n");
console.log("| Filename | Inferred Type | Status |");
console.log("| :--- | :--- | :--- |");

let successCount = 0;
let totalCount = 0;

files.forEach(file => {
  if (file.startsWith(".")) return;
  totalCount++;
  const inferred = inferDocumentTypeFromFilename(file);
  
  // Basic validation: the filename usually contains the type
  let expected = "other";
  if (file.includes("invoice")) expected = "invoice";
  if (file.includes("quote")) expected = "quote";
  if (file.includes("receipt")) expected = "receipt";
  if (file.includes("permit")) expected = "permit";
  if (file.includes("hoa")) expected = "hoa";
  if (file.includes("warranty")) expected = "warranty";
  if (file.includes("maintenance")) expected = "maintenance";
  if (file.includes("manual")) expected = "manual";
  if (file.includes("insurance")) expected = "insurance";
  if (file.includes("disclosure")) expected = "disclosure";
  if (file.includes("inspection")) expected = "inspection";
  if (file.includes("appraisal")) expected = "appraisal";
  if (file.includes("energy")) expected = "energy";
  if (file.includes("contract")) expected = "contract";
  if (file.includes("lien_waiver")) expected = "lien_waiver";

  const status = inferred === expected ? "✅" : "❌ (Expected: " + expected + ")";
  if (inferred === expected) successCount++;
  
  console.log(`| ${file} | ${inferred || "null"} | ${status} |`);
});

console.log(`\nSummary: ${successCount}/${totalCount} matches.`);
