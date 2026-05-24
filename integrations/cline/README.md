# Cline Integration

Use the `dd` domain finder inside [Cline](https://cline.bot) — the popular VS Code AI coding extension.

Cline supports MCP via `cline_mcp_settings.json` and custom rules via `.clinerules/` files.

---

## Prerequisites

- VS Code + [Cline extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)
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

In VS Code, open the Cline panel → **MCP Servers** → **Edit Configuration**. This opens `cline_mcp_settings.json`. Merge in the contents of [`cline_mcp_settings.json`](./cline_mcp_settings.json):

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
      "autoApprove": []
    }
  }
}
```

### 2. Install the `dd` rule

Copy [`clinerules/dd.md`](./clinerules/dd.md) into your project's `.clinerules/` folder:

```bash
mkdir -p .clinerules
cp integrations/cline/clinerules/dd.md .clinerules/
```

> If you want it available across all projects, use Cline's **Global Custom Instructions** instead (Cline settings → Custom Instructions).

### 3. Reload the Cline panel

Click the refresh icon in the MCP Servers section.

---

## Usage

In the Cline chat, just say:

```
find me domains for a fitness tracker app
```

or

```
suggest brand names for an AI note-taking tool
```

Cline will pick up the `.clinerules/dd.md` rule and run the pipeline.

---

## Notes

- Make sure `disabled: false` and the path in `args` is absolute.
- The `autoApprove: []` array means Cline will ask before each tool call. If you trust the server, you can pre-approve specific tools: `autoApprove: ["check_domain", "get_domain_prices"]`.

See [Cline MCP docs](https://docs.cline.bot/mcp/configuring-mcp-servers) for more.
