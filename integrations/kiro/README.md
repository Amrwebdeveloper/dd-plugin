# Kiro Integration

Use the `dd` domain finder inside [Kiro](https://kiro.dev) — AWS's agentic AI IDE.

Kiro has first-class MCP support with separate global and per-project config files.

---

## Prerequisites

- [Kiro](https://kiro.dev) installed
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

Edit `~/.kiro/settings/mcp.json` (create it if missing) and merge in [`mcp.json`](./mcp.json):

```json
{
  "mcpServers": {
    "derabia": {
      "command": "node",
      "args": ["/absolute/path/to/dd-plugin/mcp-servers/derabia/server.js"],
      "env": {
        "DERABIA_WHOIS_API_KEY": "your_whois_key_here",
        "DERABIA_PRICING_API_KEY": "your_pricing_key_here",
        "PATH": "/usr/local/bin:/usr/bin:/bin"
      },
      "disabled": false,
      "disabledTools": []
    }
  }
}
```

> **Important for Kiro:** Kiro runs MCP servers in a minimal environment — it does NOT inherit your shell's PATH. The `env.PATH` field above is required so Node can find its dependencies. Adjust the path to match where `node` lives on your system (`which node` → use the directory).

### 2. (Optional) Per-project config

For project-scoped overrides, create `.kiro/settings/mcp.json` in your repo root. Project config wins over global when both define `derabia`.

### 3. Restart Kiro

Quit and relaunch.

### 4. Verify

Open Kiro's MCP panel — you should see `derabia` with `check_domain` and `get_domain_prices` listed.

---

## Usage

In Kiro's chat:

```
find me available domains for a fitness tracker app using the derabia MCP server
```

For a more reliable workflow, paste the [generic prompt](../generic/PROMPT.md) at the start of your message.

---

## Notes

- Kiro requires **full paths** for `command` — it doesn't inherit shell PATH. Use absolute paths like `/usr/local/bin/node` if `node` alone doesn't work.
- Use `${ENV_VAR}` references in `env` instead of hardcoding API keys for safety.

See the [Kiro MCP docs](https://kiro.dev/docs/mcp/) for more.
