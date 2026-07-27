import express from "express";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createCatalogServer } from "./catalogServer.js";

const port = Number(process.env.PORT ?? 3000);
const app = express();

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true, name: "akbank-credit-offers-mcp" });
});

app.post("/mcp", async (request, response) => {
  const server = createCatalogServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  response.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  } catch (error) {
    if (!response.headersSent) {
      response.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Akbank credit offers MCP HTTP server listening on http://localhost:${port}/mcp`);
});