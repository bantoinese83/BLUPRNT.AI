#!/usr/bin/env node
import { execSync } from "node:child_process";
const workspaces = ["shared", "web", "mobile"];

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};

function run(cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.stderr?.toString() || err.message };
  }
}

console.log(`${colors.bold}\n🔍 BLUPRNT Monorepo Health Check\n${colors.reset}`);

for (const ws of workspaces) {
  process.stdout.write(`Checking ${colors.cyan}${ws.padEnd(8)}${colors.reset} `);
  
  const results = {
    lint: run(`npm run lint -w ${ws}`, "."),
    test: run(`npm run test:run -w ${ws}`, "."),
    type: run(`npm run typecheck -w ${ws}`, "."),
  };

  const status = [];
  if (results.lint.ok) status.push(`${colors.green}Lint ✓${colors.reset}`); else status.push(`${colors.red}Lint ✗${colors.reset}`);
  if (results.test.ok) status.push(`${colors.green}Test ✓${colors.reset}`); else status.push(`${colors.red}Test ✗${colors.reset}`);
  if (results.type.ok) status.push(`${colors.green}Type ✓${colors.reset}`); else status.push(`${colors.red}Type ✗${colors.reset}`);

  console.log(status.join(" | "));
}

console.log("\n" + colors.dim + "Run 'npm run quality' for a full deep scan.\n" + colors.reset);
