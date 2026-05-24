# Kilo Code Integration

Use the `dd` domain finder inside [Kilo Code](https://kilocode.ai) — the active fork / successor to Roo Code (which archived on 2026-05-15).

Kilo Code keeps Roo Code's interface, so this integration is nearly identical.

---

## Prerequisites

- VS Code with the [Kilo Code](https://marketplace.visualstudio.com/items?itemName=kilocode.kilo-code) extension
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

In VS Code, open the Kilo Code panel → click the **MCP** icon → **Edit Global MCP**. Merge in [`mcp_settings.json`](./mcp_settings.json):

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

### 2. Per-project override (optional)

Create `.kilocode/mcp.json` in your repo for project-specific config.

### 3. Install the `dd` rule

```bash
mkdir -p .kilocode/rules
cp integrations/kilo-code/rules/dd.md .kilocode/rules/
```

### 4. Reload

Click the refresh icon in Kilo Code's MCP Servers panel.

---

## Usage

In the Kilo Code chat:

```
find me available domains for a fitness tracker app
```

---

## Migration from Roo Code

If you're migrating from Roo Code, the [official migration guide](https://kilo.ai/articles/roo-to-kilo-migration-guide) covers the conversion. Your `.roo/` config can usually be copied to `.kilocode/` with minimal changes.
