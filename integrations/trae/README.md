# Trae Integration

Use the `dd` domain finder inside [Trae](https://trae.ai) — ByteDance's AI-native IDE.

Trae has supported MCP since v1.3.0 (stdio + SSE transports) and also has a `.rules` system for custom workflows.

---

## Prerequisites

- [Trae](https://trae.ai) v1.3.0 or later
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

Open Trae → **Settings** → **MCP** (or **AI** → **Model Context Protocol**) → **Add Server** → **Configure Manually**.

Paste the contents of [`mcp.json`](./mcp.json):

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

> If Trae stores its MCP config as a file on disk (varies by version), it's typically at `~/.trae/settings/mcp.json` or accessible via the in-IDE settings UI.

### 2. Install the `dd` rule

Trae uses `.rules` files for project-level AI behavior. Copy [`rules/dd.md`](./rules/dd.md) into your project:

```bash
mkdir -p .trae/rules
cp integrations/trae/rules/dd.md .trae/rules/
```

### 3. Restart Trae

Quit and relaunch so the new MCP server and rule are picked up.

---

## Usage

In Trae's AI chat / Cue / Builder panel, just say:

```
find me available domains for a fitness tracker app
```

The `.rules/dd.md` rule will pick up the request and run the pipeline using the `derabia` MCP tools.

---

## Notes

- Trae's MCP support is relatively new and evolving. The exact config UI may differ between versions — refer to the [official docs](https://docs.trae.ai/ide/add-mcp-servers) if you hit format issues.
- For team-wide adoption, commit `.trae/rules/dd.md` to your repo so colleagues get it automatically.

See the [Trae MCP docs](https://docs.trae.ai/ide/model-context-protocol) for more.
