# Cody (Sourcegraph) Integration

Use the `dd` domain finder inside [Cody](https://sourcegraph.com/cody) — Sourcegraph's AI coding assistant.

Cody has supported MCP since late 2024 via its agentic context-gathering feature. MCP servers are configured through the extension settings UI.

---

## Prerequisites

- VS Code or JetBrains IDE with [Cody](https://marketplace.visualstudio.com/items?itemName=sourcegraph.cody-ai) installed
- Cody Pro / Enterprise plan (MCP requires agentic mode which is paid)
- Node.js ≥ 18
- The `dd-plugin` repo cloned with MCP dependencies installed:
  ```bash
  git clone https://github.com/Amrwebdeveloper/dd-plugin.git
  cd dd-plugin/mcp-servers/derabia && npm install
  ```
- Two Derabia API keys (request at [api.derabia.com](https://api.derabia.com))

---

## Installation

### 1. Register the MCP server

Open VS Code Settings (`Cmd/Ctrl + ,`), search for **"Cody MCP"**, and open `settings.json` for editing. Add the snippet from [`settings-snippet.json`](./settings-snippet.json):

```json
{
  "cody.experimental.mcp.servers": {
    "derabia": {
      "command": "node",
      "args": ["/absolute/path/to/dd-plugin/mcp-servers/derabia/server.js"],
      "env": {
        "DERABIA_WHOIS_API_KEY": "your_whois_key_here",
        "DERABIA_PRICING_API_KEY": "your_pricing_key_here"
      }
    }
  }
}
```

> Setting key names may evolve — check the latest under Cody's settings search if `cody.experimental.mcp.servers` is renamed.

### 2. Reload VS Code

`Cmd/Ctrl + Shift + P` → "Developer: Reload Window".

### 3. Verify

Open Cody's chat panel. The `derabia` tools should appear in Cody's available context sources.

---

## Usage

In Cody chat (agentic mode enabled), ask:

```
find available domains for "fitness tracker app" — use the derabia MCP tools, check ~30 candidates in parallel, score with get_domain_prices, return top 10 as a table.
```

For a more reliable workflow, paste the [generic prompt](../generic/PROMPT.md) at the start of your message.

---

## Notes

- MCP in Cody requires **agentic context gathering**, which is part of paid plans (Pro / Enterprise).
- Cody's MCP config key may be marked `experimental` for now — expect it to stabilize over time.

See [Cody MCP changelog](https://sourcegraph.com/changelog/mcp-context-gathering) for updates.
