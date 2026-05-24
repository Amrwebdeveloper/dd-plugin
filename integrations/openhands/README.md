# OpenHands Integration

Use the `dd` domain finder inside [OpenHands](https://www.openhands.dev) (formerly OpenDevin) — the open-source autonomous coding agent.

OpenHands supports MCP via the **Settings UI** or `config.toml` with three transport types: stdio, SSE, and SHTTP.

---

## Prerequisites

- [OpenHands](https://www.openhands.dev) installed (Docker, CLI, or cloud)
- Node.js ≥ 18 available inside the OpenHands runtime
- The `dd-plugin` repo cloned with MCP dependencies installed:
  ```bash
  git clone https://github.com/Amrwebdeveloper/dd-plugin.git
  cd dd-plugin/mcp-servers/derabia && npm install
  ```
- Two Derabia API keys (request at [api.derabia.com](https://api.derabia.com))

---

## Installation

### Option A — UI (recommended)

1. Open OpenHands → **Settings** → **MCP**.
2. Click **Add Server** → **Stdio**.
3. Fill in:
   - **Name:** `derabia`
   - **Command:** `node`
   - **Args:** `/absolute/path/to/dd-plugin/mcp-servers/derabia/server.js`
   - **Env:** `DERABIA_WHOIS_API_KEY=...`, `DERABIA_PRICING_API_KEY=...`
4. Save and restart.

### Option B — `config.toml`

If you're running OpenHands from source or in a container, edit `config.toml` and add the snippet from [`config.toml`](./config.toml):

```toml
[mcp]

[mcp.stdio_servers]
[mcp.stdio_servers.derabia]
command = "node"
args = ["/absolute/path/to/dd-plugin/mcp-servers/derabia/server.js"]
env = { DERABIA_WHOIS_API_KEY = "your_whois_key_here", DERABIA_PRICING_API_KEY = "your_pricing_key_here" }
```

### Option C — Use a proxy (production recommendation)

For production OpenHands, the docs recommend wrapping stdio MCP servers with [SuperGateway](https://github.com/supercorp-ai/supergateway) to expose them as HTTP/SSE. This is more reliable in containerized runtimes:

```bash
npx -y supergateway --stdio "node /absolute/path/to/dd-plugin/mcp-servers/derabia/server.js" --port 8080
```

Then point OpenHands at `http://localhost:8080/sse` as an SSE server.

---

## Usage

Ask the OpenHands agent:

```
Use the derabia MCP tools to find available domains for a fitness tracker app. Generate ~30 candidates, check availability in parallel, score with get_domain_prices, and return the top 10 as a markdown table.
```

For more deterministic output, paste the [generic prompt](../generic/PROMPT.md) into the system prompt or user message.

---

## Notes

- Inside Docker-based OpenHands runtimes, the `derabia` server needs to be reachable from inside the container. Either mount the `dd-plugin` directory into the container or use the SuperGateway proxy approach.
- Configure timeouts in OpenHands' MCP settings (lightweight ops: 1–30s; heavy ops: 300s+). `derabia` calls are lightweight — 30s is plenty.

See [OpenHands MCP docs](https://docs.openhands.dev/openhands/usage/settings/mcp-settings).
