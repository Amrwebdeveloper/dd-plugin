# Generic / Universal Integration

The `derabia` MCP server is **client-agnostic** — it speaks standard [Model Context Protocol](https://modelcontextprotocol.io). If your tool supports MCP at all, it can use this server.

This folder is for:

1. **Tools not covered by a dedicated integration folder** (e.g. Goose, custom MCP clients, hosted LLM platforms with MCP support).
2. **Plain LLM use cases without MCP** — the [`PROMPT.md`](./PROMPT.md) file is a standalone system prompt you can paste into ChatGPT, Claude.ai, Gemini, or any chat interface, paired with manual API calls.

---

## A. Generic MCP client

Any MCP client needs three things:

1. **A way to launch the server**: `node /absolute/path/to/dd-plugin/mcp-servers/derabia/server.js`
2. **Two environment variables**: `DERABIA_WHOIS_API_KEY` and `DERABIA_PRICING_API_KEY`
3. **stdio transport** (the server speaks JSON-RPC over stdin/stdout)

Example minimal config (the exact JSON shape varies per client):

```json
{
  "mcpServers": {
    "derabia": {
      "command": "node",
      "args": ["/absolute/path/to/dd-plugin/mcp-servers/derabia/server.js"],
      "env": {
        "DERABIA_WHOIS_API_KEY": "...",
        "DERABIA_PRICING_API_KEY": "..."
      }
    }
  }
}
```

Once registered, your client should expose two tools:
- `check_domain(domain: string) → { domain, available, registrar?, expires_at? }`
- `get_domain_prices(domain: string) → { domain, estimated_value, currency, confidence? }`

Combine these with the workflow in [`PROMPT.md`](./PROMPT.md).

---

## B. Goose (Block's open-source agent)

[Goose](https://block.github.io/goose/) is MCP-native. Add the server via `goose configure` → `Add Extension` → `Command-line Extension`:

```
Name: derabia
Command: node /absolute/path/to/dd-plugin/mcp-servers/derabia/server.js
Env: DERABIA_WHOIS_API_KEY=..., DERABIA_PRICING_API_KEY=...
```

Then paste the [`PROMPT.md`](./PROMPT.md) content into your session or save it as a Goose recipe.

---

## C. Plain LLM (no MCP)

If you're using an LLM without MCP support (e.g. a generic ChatGPT session), you can still run the workflow manually:

1. Have the LLM generate ~30 domain candidates using [`PROMPT.md`](./PROMPT.md).
2. Take the list and run them yourself against the Derabia APIs:
   ```bash
   for d in zenly.com runpace.io ...; do
     curl -H "X-API-Key: $DERABIA_WHOIS_API_KEY" \
       "https://api.derabia.com/whois?domain=$d"
   done
   ```
3. Pass the available domains back to the LLM and ask it to rank.

Less elegant than MCP, but works anywhere.

---

## D. HTTP / remote MCP clients

The current `derabia` server uses **stdio transport** only. If your client requires HTTP/SSE transport, wrap the stdio server with a proxy like [`mcp-proxy`](https://github.com/sparfenyuk/mcp-proxy) or extend `server.js` to use `SSEServerTransport` from the MCP SDK.

---

See [`../README.md`](../README.md) for the full list of supported tools with dedicated integrations.
