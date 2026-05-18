#!/usr/bin/env node
/**
 * Quick per-workspace lint / test / typecheck (faster feedback than `npm run check`).
 * Run from repo root: `npm run status`
 * 
 * Now runs in parallel for even faster feedback and prints errors!
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execPromise = promisify(exec);

const workspaces = ["shared", "web", "mobile"];

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};

async function run(cmd) {
  try {
    const { stdout } = await execPromise(cmd);
    return { ok: true, output: stdout };
  } catch (err) {
    return { ok: false, error: err.stdout || err.stderr || err.message };
  }
}

console.log(`${colors.bold}\n🔍 BLUPRNT Monorepo Health Check (Parallel)\n${colors.reset}`);

const checks = workspaces.map(async (ws) => {
  const [lint, test, type] = await Promise.all([
    run(`npm run lint -w ${ws}`),
    run(`npm run test:run -w ${ws}`),
    run(`npm run typecheck -w ${ws}`),
  ]);

  return { ws, lint, test, type };
});

const results = await Promise.all(checks);

let hasFailures = false;

for (const res of results) {
  process.stdout.write(`Checking ${colors.cyan}${res.ws.padEnd(8)}${colors.reset} `);
  
  const status = [];
  if (res.lint.ok) status.push(`${colors.green}Lint ✓${colors.reset}`); else { status.push(`${colors.red}Lint ✗${colors.reset}`); hasFailures = true; }
  if (res.test.ok) status.push(`${colors.green}Test ✓${colors.reset}`); else { status.push(`${colors.red}Test ✗${colors.reset}`); hasFailures = true; }
  if (res.type.ok) status.push(`${colors.green}Type ✓${colors.reset}`); else { status.push(`${colors.red}Type ✗${colors.reset}`); hasFailures = true; }

  console.log(status.join(" | "));
}

if (hasFailures) {
  console.log(`\n${colors.bold}${colors.red}❌ Some checks failed. Details below:${colors.reset}\n`);
  
  for (const res of results) {
    if (!res.lint.ok) {
      console.log(`${colors.bold}${res.ws} Lint Error:${colors.reset}`);
      console.log(res.lint.error);
      console.log("-".repeat(40));
    }
    if (!res.test.ok) {
      console.log(`${colors.bold}${res.ws} Test Error:${colors.reset}`);
      console.log(res.test.error);
      console.log("-".repeat(40));
    }
    if (!res.type.ok) {
      console.log(`${colors.bold}${res.ws} Typecheck Error:${colors.reset}`);
      console.log(res.type.error);
      console.log("-".repeat(40));
    }
  }
}

console.log("\n" + colors.dim + "Run 'npm run quality' for a full deep scan.\n" + colors.reset);

if (hasFailures) {
  process.exit(1);
}
