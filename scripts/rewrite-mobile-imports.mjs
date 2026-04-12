/**
 * Rewrite mobile relative imports to @/, @shared/, @app/, @assets/ (workspace-relative).
 * Run from repo root: node scripts/rewrite-mobile-imports.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, "../mobile");
const workspaceRoot = path.resolve(mobileRoot, "..");

function walk(dir, files) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ent.name === "node_modules" ||
      ent.name === "dist" ||
      ent.name === ".expo"
    ) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p);
  }
}

function rewrite(relImp, dir) {
  if (!relImp.startsWith(".")) return null;
  const resolved = path.resolve(dir, relImp);
  const relFromWs = path
    .relative(workspaceRoot, resolved)
    .replace(/\\/g, "/");
  if (relFromWs.startsWith("..")) return null;

  if (relFromWs.startsWith("mobile/src/")) {
    return `@/${relFromWs.slice("mobile/src/".length)}`;
  }
  if (relFromWs.startsWith("shared/")) {
    return `@shared/${relFromWs.slice("shared/".length)}`;
  }
  if (relFromWs.startsWith("mobile/assets/")) {
    return `@assets/${relFromWs.slice("mobile/assets/".length)}`;
  }
  if (relFromWs.startsWith("mobile/app/")) {
    return `@app/${relFromWs.slice("mobile/app/".length)}`;
  }
  return null;
}

const files = [];
walk(mobileRoot, files);

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  const dir = path.dirname(file);

  content = content.replace(
    /from\s+["'](\.[^'"]+)["']/g,
    (match, relImp) => {
      const next = rewrite(relImp, dir);
      if (!next) return match;
      return `from "${next}"`;
    },
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("updated", path.relative(mobileRoot, file));
  }
}
