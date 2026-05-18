#!/usr/bin/env node
/**
 * Deploy via Supabase MCP server (stdio JSON-RPC).
 * Usage: node scripts/mcp-deploy-from-bundle.mjs /tmp/mcp-stripe.json
 */
import fs from "node:fs";
import { spawn } from "node:child_process";

const bundlePath = process.argv[2];
if (!bundlePath) {
  console.error("Usage: node scripts/mcp-deploy-from-bundle.mjs <bundle.json>");
  process.exit(1);
}

const mcpPath = `${process.env.HOME}/.cursor/mcp.json`;
const mcp = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
const args = mcp.mcpServers?.supabase?.args ?? [];
const tokenIdx = args.indexOf("--access-token");
const token =
  tokenIdx >= 0 ? args[tokenIdx + 1] : process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("No Supabase access token in ~/.cursor/mcp.json or env");
  process.exit(1);
}

const body = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "deploy_edge_function",
    arguments: {
      project_id: body.project_id,
      name: body.name,
      entrypoint_path: body.entrypoint_path,
      import_map_path: body.import_map_path,
      verify_jwt: body.verify_jwt,
      files: body.files,
    },
  },
};

const child = spawn(
  "npx",
  ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", token],
  { stdio: ["pipe", "pipe", "inherit"] },
);

let out = "";
child.stdout.on("data", (d) => {
  out += d.toString();
});

child.stdin.write(
  JSON.stringify({
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "deploy-script", version: "1.0.0" },
    },
  }) + "\n",
);
child.stdin.write(
  JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) +
    "\n",
);
child.stdin.write(JSON.stringify(request) + "\n");
child.stdin.end();

child.on("close", (code) => {
  const lines = out.trim().split("\n");
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      if (msg.id === 1) {
        if (msg.error) {
          console.error("MCP error:", JSON.stringify(msg.error));
          process.exit(1);
        }
        const text = msg.result?.content?.[0]?.text ?? JSON.stringify(msg.result);
        console.log(body.name, text);
        process.exit(0);
      }
    } catch {
      /* ignore non-json */
    }
  }
  console.error("No deploy response. Raw:\n", out.slice(0, 2000));
  process.exit(code || 1);
});
