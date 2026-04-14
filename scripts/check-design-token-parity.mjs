#!/usr/bin/env node
/**
 * Ensures `web/src/index.css` @theme hex/rgba entries stay aligned with
 * `shared/constants/design-tokens.ts` for keys we expose on both web and mobile.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

/** @type {Array<[key: string, cssVar: string]>} */
const HEX_PAIRS = [
  ["primary", "--color-primary"],
  ["primaryHover", "--color-primary-hover"],
  ["primaryMuted", "--color-primary-muted"],
  ["surface", "--color-surface"],
  ["accent", "--color-accent"],
  ["highlightUnderline", "--color-highlight-underline"],
  ["borderLight", "--color-border"],
  ["borderFocus", "--color-border-focus"],
  ["slate950", "--color-slate-950"],
  ["teal600", "--color-teal-600"],
  ["borderDefault", "--color-slate-200"],
  ["slate400", "--color-slate-400"],
  ["slate500", "--color-slate-500"],
  ["ink", "--color-slate-900"],
];

/** @type {Array<[key: string, cssVar: string]>} */
const RGBA_PAIRS = [
  ["highlightWash", "--color-highlight-wash"],
  ["accentSoft", "--color-highlight-soft"],
  ["glassBorder", "--glass-border"],
];

function extractThemeBlock(css) {
  const start = css.indexOf("@theme {");
  if (start === -1) throw new Error("Missing @theme block in web/src/index.css");
  let i = start + "@theme {".length;
  let depth = 1;
  while (i < css.length && depth > 0) {
    const c = css[i];
    if (c === "{") depth += 1;
    else if (c === "}") depth -= 1;
    i += 1;
  }
  if (depth !== 0) throw new Error("Unclosed @theme block");
  return css.slice(start + "@theme {".length, i - 1);
}

function parseTsColors(ts) {
  const colors = {};
  for (const m of ts.matchAll(/^\s*(\w+):\s*"([^"]+)",?\s*$/gm)) {
    colors[m[1]] = m[2].trim();
  }
  return colors;
}

function parseCssVars(themeBody) {
  const vars = {};
  for (const m of themeBody.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    vars[`--${m[1]}`] = m[2].trim().replace(/\s+/g, " ");
  }
  return vars;
}

function normalizeRgba(val) {
  return val
    .toLowerCase()
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")");
}

function main() {
  const tsPath = path.join(root, "shared/constants/design-tokens.ts");
  const cssPath = path.join(root, "web/src/index.css");
  const ts = fs.readFileSync(tsPath, "utf8");
  const css = fs.readFileSync(cssPath, "utf8");
  const colors = parseTsColors(ts);
  const themeBody = extractThemeBlock(css);
  const cssVars = parseCssVars(themeBody);

  const errors = [];

  for (const [key, varName] of HEX_PAIRS) {
    const expected = colors[key]?.toLowerCase();
    const raw = cssVars[varName]?.toLowerCase().split(/\s+/)[0];
    if (!expected) {
      errors.push(`TS missing BLUPRNT_COLORS.${key}`);
      continue;
    }
    if (!raw) {
      errors.push(`CSS missing ${varName} (expected ${key}=${expected})`);
      continue;
    }
    if (raw !== expected) {
      errors.push(
        `Mismatch ${key}: TS ${expected} vs ${varName} ${cssVars[varName]}`,
      );
    }
  }

  for (const [key, varName] of RGBA_PAIRS) {
    const expected = normalizeRgba(colors[key] ?? "");
    const raw = normalizeRgba(cssVars[varName] ?? "");
    if (!expected) {
      errors.push(`TS missing BLUPRNT_COLORS.${key}`);
      continue;
    }
    if (!raw) {
      errors.push(`CSS missing ${varName}`);
      continue;
    }
    if (raw !== expected) {
      errors.push(
        `Mismatch ${key}: TS "${colors[key]}" vs ${varName} "${cssVars[varName]}"`,
      );
    }
  }

  if (errors.length) {
    console.error("Design token parity check failed:\n");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("Design token parity OK (%s pairs)", HEX_PAIRS.length + RGBA_PAIRS.length);
}

main();
