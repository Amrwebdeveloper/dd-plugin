# Integrations — Use `dd` in any MCP-compatible AI tool

The `derabia` MCP server is **client-agnostic** — it speaks standard [Model Context Protocol](https://modelcontextprotocol.io) and works with any tool that supports MCP. The only thing that differs per tool is **how you register the server** and **how you define the `/dd` workflow** (as an agent, rule, workflow, or prompt).

This directory contains ready-to-copy integration files for each supported tool.

---

## Supported Tools

### IDEs & coding agents

| Tool | Folder | MCP config | Workflow format |
|------|--------|------------|-----------------|
| **Claude Code** | _(root of repo)_ | [`.mcp.json`](../.mcp.json) | [`skills/dd/SKILL.md`](../skills/dd/SKILL.md) |
| **OpenCode** (SST) | [`opencode/`](./opencode/) | `opencode.json` (`mcp.derabia`) | `.opencode/agent/dd.md` |
| **Cursor** | [`cursor/`](./cursor/) | `.cursor/mcp.json` | `.cursor/rules/dd.mdc` |
| **Cline** (VS Code) | [`cline/`](./cline/) | `cline_mcp_settings.json` | `.clinerules/dd.md` |
| **Roo Code** ⚠️ | [`roo-code/`](./roo-code/) | `mcp_settings.json` (VS Code globalStorage) | `.roo/rules/dd.md` |
| **Kilo Code** | [`kilo-code/`](./kilo-code/) | `mcp_settings.json` (VS Code globalStorage) | `.kilocode/rules/dd.md` |
| **Continue.dev** | [`continue/`](./continue/) | `config.yaml` (`mcpServers`) | `.continue/prompts/dd.prompt` |
| **Windsurf** (Codeium) | [`windsurf/`](./windsurf/) | `~/.codeium/windsurf/mcp_config.json` | `.windsurf/workflows/dd.md` |
| **Trae** (ByteDance) | [`trae/`](./trae/) | `~/.trae/settings/mcp.json` or UI | `.trae/rules/dd.md` |
| **Kiro** (AWS) | [`kiro/`](./kiro/) | `~/.kiro/settings/mcp.json` | _inline prompt_ |
| **Void** | [`void/`](./void/) | `~/.config/void/mcp_servers.json` | _inline prompt_ |
| **Cody** (Sourcegraph) | [`cody/`](./cody/) | VS Code settings (`cody.experimental.mcp.servers`) | _inline prompt_ |
| **VS Code Copilot** | [`vscode-copilot/`](./vscode-copilot/) | `.vscode/mcp.json` | _inline prompt_ |
| **Zed** | [`zed/`](./zed/) | `settings.json` (`context_servers`) | _inline prompt_ |
| **OpenHands** (OpenDevin) | [`openhands/`](./openhands/) | `config.toml` (`[mcp.stdio_servers.derabia]`) | _inline prompt_ |
| **Aider** | [`aider/`](./aider/) | _no native MCP — prompt fallback only_ | _inline prompt_ |

### Desktop chat clients (MCP-native)

| Tool | Folder | MCP config | Workflow format |
|------|--------|------------|-----------------|
| **Claude Desktop** | [`claude-desktop/`](./claude-desktop/) | `claude_desktop_config.json` | _inline prompt_ |
| **5ire** | [`5ire/`](./5ire/) | UI: Settings → Tools → MCP | _inline prompt_ |
| **Goose** (Block) | [`generic/`](./generic/#b-goose-blocks-open-source-agent) | `~/.config/goose/config.yaml` | _inline prompt_ |

### Catch-all

| Tool | Folder | Notes |
|------|--------|-------|
| **Other / custom MCP / plain LLM** | [`generic/`](./generic/) | Universal [`PROMPT.md`](./generic/PROMPT.md) + install guide |

> ⚠️ **Roo Code** was archived on 2026-05-15. Use Kilo Code instead if you're starting fresh.

---

## Quick install — auto-detect

Don't want to set things up manually? Run the auto-installer from the repo root:

```bash
node install.js          # interactive, detects tools, prompts for keys
node install.js --all    # configure every detected tool
```

See [the main README](../README.md#-quick-install-auto-detect) for the full installer reference.

---

## How it all fits together

```
        ┌────────────────────────────────────────┐
        │  derabia MCP server  (mcp-servers/)    │  ← one server, universal
        │  ─ check_domain                        │
        │  ─ get_domain_prices                   │
        └────────────────────┬───────────────────┘
                             │  stdio (JSON-RPC)
        ┌────────────────────┼────────────────────┬───────────────┐
        ▼                    ▼                    ▼               ▼
   Claude Code           OpenCode              Cursor          Cline / Continue
   skills/dd/            .opencode/agent/      .cursor/rules/  .clinerules/  .continue/prompts/
        │                    │                    │               │
        └────────────────────┴─────────── all describe the same /dd workflow
                                          using each tool's native format
```

The **server** is the same code for every client. The **workflow files** are translations of one document (the `/dd` pipeline) into each tool's idiomatic format.

---

## Quick start

1. Pick your tool from the table above.
2. Open its folder and follow that folder's `README.md`.
3. Each integration is self-contained — you don't need to read the others.

If your tool isn't listed, start with [`generic/README.md`](./generic/README.md).

---

## Tips that apply to every integration

### Use absolute paths

The `command`/`args` in every config file uses `/absolute/path/to/dd-plugin/...`. Replace this with the real absolute path on your machine. Relative paths usually fail because MCP clients spawn the server from an unpredictable working directory.

### Set env vars in the MCP config (not your shell)

Putting `DERABIA_WHOIS_API_KEY` and `DERABIA_PRICING_API_KEY` directly in the `env` block of the MCP config is the most reliable approach. Shell env vars may not propagate to GUI-launched apps (especially on macOS).

### Restart after editing config

Every tool needs a restart (or reload window) after you change its MCP config. The server is only spawned at startup.

### Test the server standalone first

If something doesn't work, run the server directly and check for errors:

```bash
DERABIA_WHOIS_API_KEY=test DERABIA_PRICING_API_KEY=test \
  node /absolute/path/to/dd-plugin/mcp-servers/derabia/server.js
```

It should start silently and wait for stdin input. Press `Ctrl+C` to quit. If it crashes, the error tells you what's wrong before you blame the client.

---

## Contributing a new integration

Want to add support for another tool (Aider, Roo Code, Cody, etc.)? PRs welcome — please follow the existing structure:

```
integrations/<tool-name>/
├── README.md              ← install + usage
├── <mcp-config-file>      ← copyable MCP snippet
└── <workflow-file>        ← agent/rule/prompt in the tool's format
```

And add a row to the [Supported Tools](#supported-tools) table above.
