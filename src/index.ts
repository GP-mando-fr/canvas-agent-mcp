#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CanvasClient } from "./canvas.js";
import { registerTools } from "./tools.js";

async function main() {
  const canvas = new CanvasClient();
  const server = new McpServer({
    name: "canvas-agent-mcp",
    version: "1.0.0",
  });

  registerTools(server, canvas);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[canvas-agent-mcp] Server running on stdio");
}

main().catch((err) => {
  console.error("[canvas-agent-mcp] Fatal error:", err);
  process.exit(1);
});
