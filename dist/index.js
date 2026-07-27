import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createCatalogServer } from "./catalogServer.js";
const server = createCatalogServer();
const transport = new StdioServerTransport();
await server.connect(transport);
