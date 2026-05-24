# 5ire Integration

Use the `dd` domain finder inside [5ire](https://5ire.app) — a sleek cross-platform desktop AI assistant that's MCP-native and supports OpenAI, Anthropic, Azure, Google, and local models.

---

## Prerequisites

- [5ire](https://5ire.app) installed (macOS, Windows, or Linux)
- Node.js ≥ 18
- The `dd-plugin` repo cloned with MCP dependencies installed:
  ```bash
  git clone https://github.com/Amrwebdeveloper/dd-plugin.git
  cd dd-plugin/mcp-servers/derabia && npm install
  ```
- Two Derabia API keys (request at [api.derabia.com](https://api.derabia.com))

---

## Installation

### 1. Add the MCP server via the 5ire UI

1. Open 5ire → **Settings** → **Tools** → **MCP Servers**.
2. Click **Add Server**.
3. Select **Local (stdio)**.
4. Fill in:
   - **Name:** `derabia`
   - **Command:** `node`
   - **Args:** `/absolute/path/to/dd-plugin/mcp-servers/derabia/server.js`
   - **Env vars:**
     - `DERABIA_WHOIS_API_KEY=your_whois_key_here`
     - `DERABIA_PRICING_API_KEY=your_pricing_key_here`
5. Save and **Enable** the server.

Alternatively, if 5ire exposes a JSON config file directly, you can paste from [`mcp.json`](./mcp.json):

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

### 2. Verify

In a new 5ire chat, the `derabia` tools should appear in the tool list.

---

## Usage

Paste the [generic prompt](../generic/PROMPT.md) at the start of your conversation (or save it as a custom prompt template), then ask:

```
find me available domains for a fitness tracker app
```

---

## Notes

- 5ire is primarily a chat client, not a coding tool — best for exploratory brainstorming sessions rather than in-IDE workflows.
- The MCP config UI may vary between versions. See [5ire docs](https://5ire.app/docs) for the latest.
