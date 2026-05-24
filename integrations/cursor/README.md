# Cursor Integration

Use the `dd` domain finder inside [Cursor](https://cursor.com).

Cursor supports MCP via `.cursor/mcp.json` and custom workflows via `.cursor/rules/*.mdc` files. The MCP server from this repo plugs in directly.

---

## Prerequisites

- [Cursor](https://cursor.com) installed
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

Create `.cursor/mcp.json` in your project root (or `~/.cursor/mcp.json` for all projects) and copy from [`mcp.json`](./mcp.json):

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

### 2. Install the `dd` rule

Copy [`rules/dd.mdc`](./rules/dd.mdc) into `.cursor/rules/` in your project (or `~/.cursor/rules/` globally):

```bash
mkdir -p .cursor/rules
cp integrations/cursor/rules/dd.mdc .cursor/rules/
```

### 3. Reload Cursor

`Cmd/Ctrl + Shift + P` → "Developer: Reload Window".

---

## Usage

In Cursor Chat (or Composer), trigger the rule manually:

```
@dd find me domains for "fitness tracker app"
```

Or, since the rule is configured as **Agent Requested**, Cursor will automatically attach it when you ask anything about finding domain names.

---

## Notes

- Cursor has a ceiling of ~40 active MCP tools across all servers — `derabia` only adds 2, so you're fine.
- Keep `alwaysApply` set to `false` (as in the included rule) to avoid the always-on token tax. The rule only activates when relevant.

See the [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for more.
