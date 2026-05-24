# VS Code (GitHub Copilot Agent) Integration

Use the `dd` domain finder inside **VS Code with GitHub Copilot's Agent Mode** — Copilot supports MCP servers via `.vscode/mcp.json`.

---

## Prerequisites

- [VS Code](https://code.visualstudio.com) (1.96+)
- [GitHub Copilot](https://github.com/features/copilot) extension with Agent Mode enabled
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

Create `.vscode/mcp.json` in your workspace (or use the global VS Code settings) and copy from [`mcp.json`](./mcp.json):

```json
{
  "servers": {
    "derabia": {
      "type": "stdio",
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

### 2. Reload VS Code

`Cmd/Ctrl + Shift + P` → "Developer: Reload Window". The Copilot Agent should now see the `derabia` tools.

---

## Usage

Open Copilot Chat in **Agent mode** (not Ask mode), then say:

```
Find me available domains for a fitness tracker app. Use the derabia MCP tools — generate ~30 candidates, check availability in parallel, score with get_domain_prices, and return the top 10 ranked by value.
```

> Unlike Cursor/Cline/OpenCode, VS Code Copilot doesn't have a first-class "rule" or "agent" system. The workflow lives in your prompt. To save typing, paste the [generic prompt](../generic/PROMPT.md) into your message as a system-style preamble.

---

## Notes

- Copilot Agent mode is required (Ask mode doesn't use MCP tools).
- MCP support is still evolving in VS Code; check the [official MCP docs](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) for the latest format.
