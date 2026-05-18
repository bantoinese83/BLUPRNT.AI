#!/usr/bin/env node
/**
 * Bundle a Supabase Edge Function entrypoint and its relative imports for MCP deploy_edge_function.
 * Usage: node scripts/bundle-edge-function.mjs <function-slug>
 *        node scripts/bundle-edge-function.mjs supabase/functions/revenuecat-webhook/index.ts
 * Writes MCP args JSON to stdout.
 */
import fs from "node:fs";
import path from "node:path";

const PROJECT_ID = "elucgaegaihkklnfoasm";
const FUNCTIONS_ROOT = path.resolve("supabase/functions");
const IMPORT_MAP = path.join(FUNCTIONS_ROOT, "import_map.json");

const IMPORT_RE =
  /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"](\.\.?\/[^'"]+)['"]/g;

function slugFromArg(arg) {
  if (arg.includes("/")) {
    const dir = path.dirname(path.resolve(arg));
    return path.basename(dir);
  }
  return arg.replace(/^functions\//, "");
}

function resolveRelative(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function mcpNameFor(abs) {
  if (abs.startsWith(FUNCTIONS_ROOT)) {
    return path.relative(FUNCTIONS_ROOT, abs).replace(/\\/g, "/");
  }
  const repoRoot = path.resolve(".");
  if (abs.startsWith(repoRoot)) {
    return path.relative(repoRoot, abs).replace(/\\/g, "/");
  }
  return path.basename(abs);
}

function enqueueImports(abs, queue, seen) {
  const content = fs.readFileSync(abs, "utf8");
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(content))) {
    const resolved = resolveRelative(abs, m[1]);
    if (resolved && !seen.has(resolved)) queue.push(resolved);
  }
}

function collectFiles(entryAbs) {
  const queue = [entryAbs];
  const seen = new Set();
  const files = [];

  while (queue.length) {
    const abs = queue.shift();
    if (!abs || seen.has(abs)) continue;
    seen.add(abs);
    files.push({ abs, name: mcpNameFor(abs) });
    enqueueImports(abs, queue, seen);
  }

  return files;
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/bundle-edge-function.mjs <slug-or-entry>");
  process.exit(1);
}

const slug = slugFromArg(arg);
const entryAbs = arg.includes("/")
  ? path.resolve(arg)
  : path.join(FUNCTIONS_ROOT, slug, "index.ts");

if (!fs.existsSync(entryAbs)) {
  console.error(`Entry not found: ${entryAbs}`);
  process.exit(1);
}

const collected = collectFiles(entryAbs);
const importMapRel = "import_map.json";
const verifyJwtBySlug = {
  "revenuecat-webhook": false,
  "stripe-webhook": false,
  "upload-document": true,
};

/** Deno deploy root is `source/`; `../../../shared` from `_shared/` escapes the bundle. */
function rewriteSharedImports(content) {
  return content.replaceAll("../../../shared/", "../shared/");
}

const mcpFiles = collected.map(({ abs, name }) => ({
  name,
  content: rewriteSharedImports(fs.readFileSync(abs, "utf8")),
}));

if (fs.existsSync(IMPORT_MAP)) {
  mcpFiles.push({
    name: importMapRel,
    content: fs.readFileSync(IMPORT_MAP, "utf8"),
  });
}

const payload = {
  project_id: PROJECT_ID,
  name: slug,
  entrypoint_path: path.relative(FUNCTIONS_ROOT, entryAbs).replace(/\\/g, "/"),
  import_map_path: importMapRel,
  verify_jwt: verifyJwtBySlug[slug] ?? false,
  files: mcpFiles,
};

process.stdout.write(JSON.stringify(payload));
