#!/usr/bin/env node
/**
 * Runs workspace unit tests when staged changes touch implementation or tests
 * for that workspace (or shared/). Skips for docs-only, public assets, SQL-only, etc.
 *
 * Set FORCE_PRECOMMIT_TESTS=1 to always run the full `npm run test:run` (both workspaces).
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function getStagedFiles() {
  try {
    return execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf8",
      cwd: root,
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isWebTestPath(f) {
  return (
    /^web\/.*\.(test|spec)\.(ts|tsx)$/.test(f) ||
    /^e2e\/.*\.spec\.ts$/.test(f)
  );
}

function isMobileTestPath(f) {
  return /^mobile\/.*\.(test|spec)\.(ts|tsx)$/.test(f);
}

function isSharedTestPath(f) {
  return /^shared\/.*\.(test|spec)\.ts$/.test(f);
}

function touchesWebCode(files) {
  return files.some(
    (f) =>
      f.startsWith("web/src/") ||
      f.startsWith("e2e/") ||
      f === "playwright.config.ts" ||
      f === "web/package.json" ||
      f === "web/vite.config.ts" ||
      f.startsWith("web/vitest.config.") ||
      isWebTestPath(f) ||
      f.startsWith("shared/"),
  );
}

function touchesMobileCode(files) {
  return files.some(
    (f) =>
      f.startsWith("mobile/app/") ||
      f.startsWith("mobile/src/") ||
      f === "mobile/package.json" ||
      f === "mobile/vitest.config.ts" ||
      isMobileTestPath(f) ||
      f.startsWith("shared/"),
  );
}

function main() {
  const files = getStagedFiles();
  if (files.length === 0) {
    return;
  }

  if (process.env.FORCE_PRECOMMIT_TESTS === "1") {
    execSync("npm run test:run", { stdio: "inherit", cwd: root });
    return;
  }

  const runWeb = touchesWebCode(files);
  const runMobile = touchesMobileCode(files);

  if (files.some(isSharedTestPath)) {
    execSync("npm run test:run", { stdio: "inherit", cwd: root });
    return;
  }

  if (!runWeb && !runMobile) {
    console.log(
      "pre-commit: skipping unit tests (no staged web/src, mobile app/src, e2e, shared, or related config/tests)",
    );
    return;
  }

  if (runWeb && runMobile) {
    execSync("npm run test:run", { stdio: "inherit", cwd: root });
    return;
  }
  if (runWeb) {
    execSync("npm run test:run -w web", { stdio: "inherit", cwd: root });
    return;
  }
  execSync("npm run test:run -w mobile", { stdio: "inherit", cwd: root });
}

main();
