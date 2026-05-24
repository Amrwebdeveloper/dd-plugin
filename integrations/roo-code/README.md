# Roo Code Integration

> **⚠️ Heads-up:** [Roo Code is archived as of 2026-05-15](https://github.com/RooCodeInc/Roo-Code). If you're starting fresh, use [Kilo Code](../kilo-code/) — it's the official migration path with a near-identical interface.

This folder still works for users who already have Roo Code installed and aren't ready to migrate.

---

## Prerequisites

- VS Code with [Roo Code](https://marketplace.visualstudio.com/items?itemName=RooVeterinaryInc.roo-cline) extension (`RooVeterinaryInc.roo-cline`)
- Node.js ≥ 18
- The `dd-plugin` repo cloned with MCP dependencies installed:
  ```bash
  git clone https://github.com/Amrwebdeveloper/dd-plugin.git
  cd dd-plugin/mcp-servers/derabia && npm install
  ```
- Two Derabia API keys (request at [api.derabia.com](https://api.derabia.com))

---

## Installation

### 1. Register the MCP server (global)

In VS Code, open the Roo Code panel → click the **MCP** icon → **Edit Global MCP**. This opens `mcp_settings.json`. Merge in the contents of [`mcp_settings.json`](./mcp_settings.json):

```json
{
  "mcpServers": {
    "derabia": {
      "command": "node",
      "args": ["/absolute/path/to/dd-plugin/mcp-servers/derabia/server.js"],
      "env": {
        "DERABIA_WHOIS_API_KEY": "your_whois_key_here",
        "DERABIA_PRICING_API_KEY": "your_pricing_key_here"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

### 2. (Optional) Per-project override

If you want different keys per project, create `.roo/mcp.json` in your repo root with the same structure. Project config overrides global when both define the same server name.

### 3. Install the `dd` rule

Roo Code supports custom rules via `.roo/rules/` (workspace) or via the Roo Code marketplace. Copy [`rules/dd.md`](./rules/dd.md) into your project:

```bash
mkdir -p .roo/rules
cp integrations/roo-code/rules/dd.md .roo/rules/
```

### 4. Reload

Click the refresh icon in Roo Code's MCP Servers panel.

---

## Usage

In the Roo Code chat:

```
find me available domains for a fitness tracker app
```

Roo Code's agent will pick up the `dd` rule and use the `derabia` MCP tools.

---

See the [Roo Code MCP docs](https://docs.roocode.com/features/mcp/using-mcp-in-roo).
