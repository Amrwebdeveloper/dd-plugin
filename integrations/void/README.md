# Void Integration

Use the `dd` domain finder inside the [Void editor](https://voideditor.com) — an open-source, MIT-licensed AI IDE forked from VS Code.

Void has MCP support via `mcp_servers.json` (or `mcp.json` depending on version).

---

## Prerequisites

- [Void editor](https://voideditor.com) installed
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

Edit your Void MCP config file. Location depends on platform:

| OS | Path |
|----|------|
| **macOS / Linux** | `~/.config/void/mcp_servers.json` |
| **Windows** | `%APPDATA%\void\mcp_servers.json` |

Merge in [`mcp_servers.json`](./mcp_servers.json):

```json
{
  "mcpServers": {
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

### 2. Restart Void

Quit and relaunch.

---

## Usage

Open Void's chat / agent panel. Since Void doesn't yet have a custom-rule system, paste the [generic prompt](../generic/PROMPT.md) at the start of your message, then ask:

```
find me available domains for a fitness tracker app
```

---

## Known Issues

- Void currently has a [known bug](https://github.com/voideditor/void/issues/701) where MCP servers may be restricted to the Void installation directory, ignoring the `cwd` setting. If you hit "module not found" errors, ensure your `command` uses absolute paths and the `derabia` server's `node_modules` is fully installed.
- Void's MCP feature surface is still evolving. Check the [Void GitHub](https://github.com/voideditor/void) for the latest.
