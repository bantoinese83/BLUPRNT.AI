#!/usr/bin/env node
/**
 * Assert Lighthouse category scores against CI budgets.
 * Usage: node scripts/lighthouse-ci-budget.mjs [path-to-report.json]
 */
import fs from "node:fs";

const reportPath =
  process.argv[2] ?? "web/lighthouse-report.report.json";

const budgets = {
  performance: parseInt(process.env.LH_BUDGET_PERFORMANCE ?? "85", 10),
  accessibility: parseInt(process.env.LH_BUDGET_ACCESSIBILITY ?? "100", 10),
  "best-practices": parseInt(
    process.env.LH_BUDGET_BEST_PRACTICES ?? "100",
    10,
  ),
  seo: parseInt(process.env.LH_BUDGET_SEO ?? "100", 10),
};

if (!fs.existsSync(reportPath)) {
  console.error(`Lighthouse report not found: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const failures = [];

for (const [id, minScore] of Object.entries(budgets)) {
  const category = report.categories?.[id];
  const score =
    category && typeof category.score === "number"
      ? Math.round(category.score * 100)
      : null;
  if (score === null) {
    failures.push(`${id}: missing score`);
    continue;
  }
  console.log(`${id.padEnd(18)} ${score} (min ${minScore})`);
  if (score < minScore) {
    failures.push(`${id}: ${score} < ${minScore}`);
  }
}

if (failures.length > 0) {
  console.error("\nLighthouse budget failed:\n", failures.join("\n "));
  process.exit(1);
}

console.log("\nLighthouse budgets passed.");
