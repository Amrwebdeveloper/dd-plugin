# Continue.dev Integration

Use the `dd` domain finder inside [Continue.dev](https://continue.dev) — an open-source AI code assistant for VS Code and JetBrains.

Continue supports MCP via `config.yaml` and custom prompts via prompt files.

---

## Prerequisites

- VS Code or JetBrains with [Continue](https://continue.dev) extension
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

Open your Continue config (`~/.continue/config.yaml`) and merge in the snippet from [`config-snippet.yaml`](./config-snippet.yaml):

```yaml
mcpServers:
  - name: derabia
    command: node
    args:
      - /absolute/path/to/dd-plugin/mcp-servers/derabia/server.js
    env:
      DERABIA_WHOIS_API_KEY: your_whois_key_here
      DERABIA_PRICING_API_KEY: your_pricing_key_here
```

> If you're still on the legacy `config.json`, see [Continue's migration guide](https://docs.continue.dev/reference/yaml-migration). The new YAML format is recommended.

### 2. Install the `dd` prompt

Copy [`prompts/dd.prompt`](./prompts/dd.prompt) into your Continue prompts directory:

```bash
# Global
mkdir -p ~/.continue/prompts
cp integrations/continue/prompts/dd.prompt ~/.continue/prompts/

# OR per-project
mkdir -p .continue/prompts
cp integrations/continue/prompts/dd.prompt .continue/prompts/
```

### 3. Reload Continue

Use `Cmd/Ctrl + Shift + P` → "Continue: Reload Config".

---

## Usage

Invoke the prompt from the Continue chat with `/dd`:

```
/dd fitness tracker app
```

Or describe what you're building and call `/dd` with no argument — the prompt will infer the topic from your previous message.

---

## Notes

- Slash commands in the legacy `config.json` format are deprecated. Use prompt files (`.prompt`) going forward.
- Continue may show MCP tools as auto-approve or require approval per call depending on your settings.

See the [Continue MCP docs](https://docs.continue.dev/customize/deep-dives/mcp) for more.
