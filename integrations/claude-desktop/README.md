# Claude Desktop Integration

Use the `dd` domain finder inside the [Claude Desktop](https://claude.ai/download) app — Anthropic's standalone desktop client (different from Claude Code).

Claude Desktop is **MCP-native**: it speaks the protocol directly, no extension needed. This is one of the simplest integrations.

---

## Prerequisites

- [Claude Desktop](https://claude.ai/download) (macOS, Windows, or Linux build)
- Node.js ≥ 18
- The `dd-plugin` repo cloned with MCP dependencies installed:
  ```bash
  git clone https://github.com/Amrwebdeveloper/dd-plugin.git
  cd dd-plugin/mcp-servers/derabia && npm install
  ```
- Two Derabia API keys (request at [api.derabia.com](https://api.derabia.com))

---

## Installation

### 1. Edit your `claude_desktop_config.json`

Location varies by OS:

| OS | Path |
|----|------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

Create the file if it doesn't exist. Merge in the contents of [`claude_desktop_config.json`](./claude_desktop_config.json):

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

> If `mcpServers` already has entries, just add the `derabia` block alongside them — don't replace the whole file.

### 2. Restart Claude Desktop

Fully quit (⌘Q on macOS / right-click tray icon → Quit on Windows) and relaunch. The MCP server only starts at launch.

### 3. Verify the connection

Open a new chat in Claude Desktop. Click the **🔌 plug icon** at the bottom of the input. You should see `derabia` listed with two tools: `check_domain` and `get_domain_prices`.

---

## Usage

Claude Desktop has no slash commands or rule files, so just paste the workflow prompt at the start of your message. Use the universal prompt from [`../generic/PROMPT.md`](../generic/PROMPT.md), or this short version:

```
Use the derabia MCP tools to find available domains for "fitness tracker app":
1. Generate ~30 candidates mixing coined/compound/phonetic/modifier styles with .com .io .app .co .ai .dev TLDs
2. Call check_domain on all in parallel, keep only available
3. Call get_domain_prices on survivors in parallel
4. Return the top 10 ranked by brand_value as a markdown table with columns: Domain, Brand Value (USD), Length, Style
No preamble.
```

---

## Notes

- Claude Desktop supports **Desktop Extensions** (`.mcpb` files) as of early 2026 — pre-packaged MCP servers that install with a double-click. A future version of `dd-plugin` may ship as a `.mcpb` for one-click install.
- The Anthropic transport is moving toward **Streamable HTTP** (MCP 2025-11-25). The current `derabia` server uses stdio, which still works fine in Claude Desktop.

See the [official Claude Desktop MCP guide](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop).
