# Zed Integration

Use the `dd` domain finder inside the [Zed editor](https://zed.dev) — Zed has experimental MCP/"context server" support.

---

## Prerequisites

- [Zed](https://zed.dev) (latest)
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

Open Zed settings (`Cmd/Ctrl + ,`) and merge in the snippet from [`settings.json`](./settings.json):

```json
{
  "context_servers": {
    "derabia": {
      "command": {
        "path": "node",
        "args": ["/absolute/path/to/dd-plugin/mcp-servers/derabia/server.js"],
        "env": {
          "DERABIA_WHOIS_API_KEY": "your_whois_key_here",
          "DERABIA_PRICING_API_KEY": "your_pricing_key_here"
        }
      }
    }
  }
}
```

### 2. Reload Zed

Quit and relaunch Zed, then open the Assistant panel (`Cmd/Ctrl + ?`). The `derabia` tools should be available.

---

## Usage

In Zed's Assistant panel, say:

```
Find available domains for a fitness tracker app using the derabia MCP server. Generate ~30 candidates, call check_domain in parallel, filter to available, then call get_domain_prices on survivors in parallel. Return the top 10 ranked by brand value as a markdown table.
```

For a richer prompt, paste the [generic workflow prompt](../generic/PROMPT.md).

---

## Notes

- Zed's MCP / context server support is evolving; the schema may change. Check [Zed's assistant docs](https://zed.dev/docs/assistant) for the latest.
- Zed doesn't yet have a first-class "agent" or "rule" file system equivalent to OpenCode or Cursor.
