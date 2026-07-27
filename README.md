# Akbank Credit Offers MCP

This is a TypeScript Model Context Protocol server that exposes Akbank credit offer data in `data.md`.

## Tools

- `list_credit_offers`: list Akbank credit offers, with optional loan type, amount, term, channel, and sort filters.
- `get_credit_offer`: get one credit offer by id.
- `search_credit_offers`: search by id, title, loan type, application channel, requirements, or notes.

## Local setup

```bash
npm install
npm run build
npm run dev
```

For a hosted HTTP MCP endpoint:

```bash
npm run build
npm start
```

The HTTP endpoint is `POST /mcp`, and a simple health check is available at `GET /health`.

## Test with MCP Inspector

```bash
npm run inspect
```

## VS Code MCP

The workspace includes `.vscode/mcp.json`, so VS Code can run the server with:

```bash
npm run dev
```

## Hosting note

For hosting, deploy the project to a Node.js host, set the `PORT` environment variable if required, and expose the app over HTTPS. Connect GPT-compatible MCP clients to:

```text
https://your-domain.example/mcp
```

If your GPT integration expects classic OpenAPI Actions instead of MCP, add a small REST wrapper and OpenAPI schema around the same credit offer functions.

See [DEPLOY.md](DEPLOY.md) for Render, Docker, and ChatGPT connection steps.