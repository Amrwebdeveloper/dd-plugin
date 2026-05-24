# dd-plugin — Autonomous Domain Name Finder

> Generate available, brand-worthy domain names in seconds. Type `/dd <topic>` and get a ranked list of available domains scored by an ML brand-value model.

`dd-plugin` bundles two things in one repo:

1. **The `/dd` workflow** — an autonomous pipeline that brainstorms domain candidates, filters by WHOIS availability, and ranks survivors by predicted brand value.
2. **The `derabia` MCP server** — a Node.js server exposing two tools (`check_domain`, `get_domain_prices`) backed by the [Derabia](https://api.derabia.com) WHOIS and ML pricing APIs.

### Supported AI tools (19 and growing)

The MCP server speaks the standard [Model Context Protocol](https://modelcontextprotocol.io), so it works with **any MCP-compatible client**. Ready-to-copy integration files are provided for:

**IDEs & coding agents:** [Claude Code](#installation-claude-code) · [OpenCode](./integrations/opencode/) · [Cursor](./integrations/cursor/) · [Cline](./integrations/cline/) · [Roo Code](./integrations/roo-code/) · [Kilo Code](./integrations/kilo-code/) · [Continue.dev](./integrations/continue/) · [Windsurf](./integrations/windsurf/) · [Trae](./integrations/trae/) · [Kiro](./integrations/kiro/) · [Void](./integrations/void/) · [Cody](./integrations/cody/) · [VS Code Copilot](./integrations/vscode-copilot/) · [Zed](./integrations/zed/) · [OpenHands](./integrations/openhands/) · [Aider](./integrations/aider/)

**Desktop chat clients:** [Claude Desktop](./integrations/claude-desktop/) · [5ire](./integrations/5ire/) · [Goose](./integrations/generic/#b-goose-blocks-open-source-agent)

**Anything else:** [Generic MCP / plain LLM](./integrations/generic/)

See [`integrations/README.md`](./integrations/README.md) for the full matrix with config paths and workflow file formats.

---

## Table of Contents

- [What it does](#what-it-does)
- [Requirements](#requirements)
- [⚡ Quick install (auto-detect)](#-quick-install-auto-detect)
- [Installation (Claude Code)](#installation-claude-code)
- [Installation (other tools)](#installation-other-tools)
- [Configuration (API keys)](#configuration-api-keys)
- [Usage](#usage)
- [Examples](#examples)
- [How it works](#how-it-works)
- [Repository layout](#repository-layout)
- [Troubleshooting](#troubleshooting)
- [Customization](#customization)
- [Contributing](#contributing)
- [License](#license)

---

## What it does

Typing `/dd fitness tracker app` in Claude Code triggers a fully autonomous pipeline:

```
   /dd <topic>
       │
       ▼
 ┌──────────────────────┐
 │  1. Generate 30      │   Coined, compound, phonetic, modifier+noun…
 │     candidates       │   Paired with .com / .io / .app / .co / .ai / .dev
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │  2. WHOIS check      │   Parallel calls to Derabia WHOIS API
 │     (parallel)       │   Filter to only AVAILABLE domains
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │  3. Brand-value      │   Parallel calls to Derabia Pricing API
 │     scoring (ML)     │   ML model predicts USD value per domain
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │  4. Rank & return    │   Top 10 sorted by value, as a markdown table
 │     top 10           │
 └──────────────────────┘
```

No clarifying questions, no confirmation prompts, no preamble in the output — just results.

---

## Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| [Claude Code](https://claude.com/claude-code) | latest | Install from claude.com/claude-code |
| [Node.js](https://nodejs.org/) | ≥ 18.0.0 | Required for the MCP server |
| Derabia WHOIS API key | — | Request one at [api.derabia.com](https://api.derabia.com) |
| Derabia Pricing API key | — | Request one at [api.derabia.com](https://api.derabia.com) |

> **Note:** API keys are granted on request via [api.derabia.com](https://api.derabia.com), not via self-service signup. Allow some time for approval.

---

## ⚡ Quick install (auto-detect)

Three ways to install, fastest first:

### 🤖 Option 1 — Tell your AI assistant to do it

The single fastest way. Copy [the install prompt](./INSTALL_PROMPT.md) and paste it into Claude Code, Cursor, OpenCode, Cline, Windsurf, or any AI coding tool. It will inspect this repo, detect which tool it's running inside, install correctly, and verify it works — all without you running a single command.

```
"Install dd-plugin from https://github.com/Amrwebdeveloper/dd-plugin
 — inspect the integrations/ folder, detect which tool you're inside,
 and follow that integration's README. Ask me for the API keys when needed."
```

See [`INSTALL_PROMPT.md`](./INSTALL_PROMPT.md) for the polished long-form version.

### 🛠 Option 2 — Run the auto-installer manually

The installer detects which AI coding tools you have on your machine and configures each one automatically — MCP server registration, workflow file placement, and API keys.

```bash
git clone https://github.com/Amrwebdeveloper/dd-plugin.git
cd dd-plugin
node install.js
```

You'll see output like:

```
  ┌─ dd-plugin installer ─────────────────────────┐
  │  Detecting installed AI coding tools…         │
  └───────────────────────────────────────────────┘

  ● Claude Code
  ● OpenCode (SST)
  ○ Cursor
  ● Cline (VS Code extension)
  ○ Continue.dev
  ○ Windsurf (Codeium)
  ● VS Code GitHub Copilot
  ○ Zed
  ○ Goose (Block)
  ● Trae (ByteDance)
  ○ Roo Code (VS Code, archived 2026-05-15)
  ○ Kilo Code (Roo Code successor)
  ● Claude Desktop
  ○ Kiro (AWS)
  ○ Void editor
  ○ Cody (Sourcegraph)
  ○ OpenHands (formerly OpenDevin)
  ○ 5ire (desktop AI assistant)
  ○ Aider (CLI, no native MCP)

› Pick which tools to configure
   1. Claude Code
   2. OpenCode (SST)
   3. Cline (VS Code extension)
   4. VS Code GitHub Copilot
   5. Trae (ByteDance)
   6. Claude Desktop
   a. All detected
   q. Quit
? Selection (e.g. "1,3" or "a"):
```

### Flags

| Flag | What it does |
|------|--------------|
| _(no flag)_ | Interactive — detects, prompts which tools, asks for API keys |
| `--all` | Configure every detected tool, no prompts |
| `--tools=cursor,opencode` | Only configure the listed tools |
| `--dry-run` | Show the plan, write nothing |
| `--uninstall` | Remove `dd-plugin` from selected tools |
| `--help` | Print usage |

### 📋 Option 3 — Non-interactive (CI / scripts)

```bash
DERABIA_WHOIS_API_KEY=xxx \
DERABIA_PRICING_API_KEY=yyy \
node install.js --all
```

### What it does for each tool

The installer:

1. Runs `npm install` inside `mcp-servers/derabia/` if needed (one-time)
2. **Merges** the `derabia` server into each tool's existing MCP config (it doesn't overwrite your other servers — your old config is backed up with a timestamp)
3. Copies the appropriate workflow file (`agent/dd.md`, `rules/dd.mdc`, `clinerules/dd.md`, etc.) into the right location for each tool
4. Prints restart instructions per tool

> **Tip:** Use `--dry-run` first to preview what will change without writing anything.

---

## Installation (Claude Code)

### Option A — Install from GitHub (recommended)

```bash
# In Claude Code
/plugin install Amrwebdeveloper/dd-plugin
```

Claude Code will clone the repo, register the `/dd` skill, and wire up the `derabia` MCP server automatically.

### Option B — Manual / local install

```bash
# 1. Clone the repo
git clone https://github.com/Amrwebdeveloper/dd-plugin.git
cd dd-plugin

# 2. Install MCP server dependencies
cd mcp-servers/derabia
npm install
cd ../..

# 3. Point Claude Code at the local plugin folder
# Add this to your Claude Code settings.json:
#   "plugins": ["./path/to/dd-plugin"]
```

---

## Installation (other tools)

This plugin works in **19+ MCP-compatible AI tools** (and counting). Pick yours:

### IDEs & coding agents

| Tool | Integration folder | Workflow trigger |
|------|--------------------|------------------|
| **OpenCode** (SST) | [`integrations/opencode/`](./integrations/opencode/) | `@dd <topic>` |
| **Cursor** | [`integrations/cursor/`](./integrations/cursor/) | Auto-attached on domain questions |
| **Cline** (VS Code) | [`integrations/cline/`](./integrations/cline/) | Natural language |
| **Roo Code** ⚠️ archived | [`integrations/roo-code/`](./integrations/roo-code/) | Natural language |
| **Kilo Code** (Roo successor) | [`integrations/kilo-code/`](./integrations/kilo-code/) | Natural language |
| **Continue.dev** | [`integrations/continue/`](./integrations/continue/) | `/dd <topic>` |
| **Windsurf** (Codeium) | [`integrations/windsurf/`](./integrations/windsurf/) | `/dd <topic>` |
| **Trae** (ByteDance) | [`integrations/trae/`](./integrations/trae/) | Natural language |
| **Kiro** (AWS) | [`integrations/kiro/`](./integrations/kiro/) | Inline prompt |
| **Void** | [`integrations/void/`](./integrations/void/) | Inline prompt |
| **Cody** (Sourcegraph) | [`integrations/cody/`](./integrations/cody/) | Inline prompt |
| **VS Code Copilot** (Agent) | [`integrations/vscode-copilot/`](./integrations/vscode-copilot/) | Inline prompt |
| **Zed** | [`integrations/zed/`](./integrations/zed/) | Inline prompt |
| **OpenHands** (OpenDevin) | [`integrations/openhands/`](./integrations/openhands/) | Inline prompt |
| **Aider** (no native MCP) | [`integrations/aider/`](./integrations/aider/) | Prompt + curl fallback |

### Desktop chat clients

| Tool | Integration folder | Workflow trigger |
|------|--------------------|------------------|
| **Claude Desktop** | [`integrations/claude-desktop/`](./integrations/claude-desktop/) | Inline prompt |
| **5ire** | [`integrations/5ire/`](./integrations/5ire/) | Inline prompt |
| **Goose** (Block) | [`integrations/generic/`](./integrations/generic/) | Inline prompt |

### Catch-all

| Tool | Integration folder | Notes |
|------|--------------------|-------|
| Anything else | [`integrations/generic/`](./integrations/generic/) | Universal PROMPT + install guide |

Each folder is self-contained — open it and follow that folder's README. The MCP server itself is the same; only the workflow wrapper differs per tool.

For the full overview with config paths, see [`integrations/README.md`](./integrations/README.md).

---

## Configuration (API keys)

Both API keys are **required**. Set them as environment variables — pick whichever method fits your OS.

### macOS / Linux

```bash
export DERABIA_WHOIS_API_KEY="your_whois_key_here"
export DERABIA_PRICING_API_KEY="your_pricing_key_here"
```

Add those lines to `~/.zshrc`, `~/.bashrc`, or `~/.profile` to persist across sessions.

### Windows (PowerShell)

```powershell
[System.Environment]::SetEnvironmentVariable("DERABIA_WHOIS_API_KEY", "your_whois_key_here", "User")
[System.Environment]::SetEnvironmentVariable("DERABIA_PRICING_API_KEY", "your_pricing_key_here", "User")
```

Restart your terminal (and Claude Code) for the variables to take effect.

### Windows (cmd)

```cmd
setx DERABIA_WHOIS_API_KEY "your_whois_key_here"
setx DERABIA_PRICING_API_KEY "your_pricing_key_here"
```

### Via Claude Code settings (any OS)

Open `~/.claude/settings.json` and add:

```json
{
  "env": {
    "DERABIA_WHOIS_API_KEY": "your_whois_key_here",
    "DERABIA_PRICING_API_KEY": "your_pricing_key_here"
  }
}
```

### Optional — Custom API endpoints

If you're using a staging environment or a self-hosted Derabia deployment, override the defaults:

```bash
export DERABIA_WHOIS_API_URL="https://staging.derabia.com/whois"
export DERABIA_PRICING_API_URL="https://staging.derabia.com/pricing"
```

---

## Usage

### Basic — with explicit topic

```
/dd fitness tracker app
```

Returns a ranked table of ~10 available domains.

### Implicit — infer from context

Describe what you're building, then call `/dd` with no argument:

```
I'm building a tool that helps remote teams sync during async work.

/dd
```

The skill infers the topic from your previous message and runs the pipeline.

---

## Examples

### Example 1 — SaaS for designers

**Input:**
```
/dd collaborative tool for product designers
```

**Output:**
```
| #  | Domain         | Brand Value | Length | Style |
|----|----------------|-------------|--------|-------|
| 1  | figly.com      | $5,400      | 5      | Coined |
| 2  | designloop.io  | $4,100      | 10     | Compound |
| 3  | krafted.app    | $3,800      | 7      | Coined |
| 4  | pixelflux.co   | $3,200      | 9      | Compound |
| 5  | drafty.io      | $2,900      | 6      | Coined |
| 6  | unifydesign.com| $2,750      | 11     | Compound |
| 7  | studio.dev     | $2,500      | 6      | Modifier+noun |
| 8  | mooddeck.com   | $2,400      | 8      | Compound |
| 9  | usepalette.co  | $2,100      | 10     | Modifier+noun |
| 10 | crafted.ai     | $1,950      | 7      | Coined |

_Checked 60 candidates · 10 results shown · Powered by Derabia_
```

### Example 2 — Mobile app idea

**Input:**
```
/dd meditation app for kids aged 5-10
```

**Output:** *(a ranked table of available domains tuned to "kids meditation")*

### Example 3 — Inferring from context

**Input:**
```
We're spinning up a small B2B startup that helps freight companies track containers in real time across ports.

/dd
```

**Output:** *(a ranked table for the inferred topic "freight container tracking")*

### Example 4 — No matches

**Input:**
```
/dd google
```

**Output:**
```
No available domains found for "google". Try a different angle or broader keywords.
```

---

## How it works

### The skill (`skills/dd/SKILL.md`)

A markdown file with YAML frontmatter that tells Claude exactly how to behave when `/dd` is invoked. Key behaviors:

- Generates a diverse pool of 30 candidates × multiple TLDs
- Calls `check_domain` and `get_domain_prices` in **parallel** (batched tool calls) for speed
- Ranks by predicted brand value, returns top 10
- No preamble, no clarifying questions, no confirmation prompts

### The MCP server (`mcp-servers/derabia/server.js`)

A small Node.js server using the official [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk). Two tools:

| Tool | Purpose | Required env var |
|------|---------|------------------|
| `check_domain` | WHOIS availability lookup | `DERABIA_WHOIS_API_KEY` |
| `get_domain_prices` | ML brand-value prediction | `DERABIA_PRICING_API_KEY` |

The server validates domain format, handles `401`/`403`/`429` gracefully, enforces a 15-second timeout per request, and normalizes the Derabia API response into a stable schema.

### The plugin manifest

- `.claude-plugin/plugin.json` — registers the plugin metadata (name, version, author)
- `.mcp.json` — declares the `derabia` MCP server, its command, and required env vars
- Skills are auto-discovered from the `skills/` directory

---

## Repository layout

```
dd-plugin/
├── install.js                   ← Auto-detect installer (run me first!)
├── package.json                 ← npm scripts: setup, install:dry-run, …
│
├── .claude-plugin/
│   └── plugin.json              ← Claude Code plugin metadata
├── .mcp.json                    ← Claude Code MCP server declaration
├── skills/
│   └── dd/
│       └── SKILL.md             ← Claude Code /dd skill
│
├── mcp-servers/
│   └── derabia/
│       ├── package.json
│       ├── server.js            ← MCP server (universal — used by all tools)
│       └── .env.example         ← API key template
│
├── integrations/                ← Adapters for 18 other AI tools
│   ├── README.md                ← Tool matrix
│   ├── opencode/                ← OpenCode (SST)
│   ├── cursor/                  ← Cursor
│   ├── cline/                   ← Cline (VS Code)
│   ├── roo-code/                ← Roo Code (VS Code, archived)
│   ├── kilo-code/               ← Kilo Code (Roo Code successor)
│   ├── continue/                ← Continue.dev
│   ├── windsurf/                ← Windsurf (Codeium)
│   ├── trae/                    ← Trae (ByteDance)
│   ├── kiro/                    ← Kiro (AWS)
│   ├── void/                    ← Void editor
│   ├── cody/                    ← Cody (Sourcegraph)
│   ├── vscode-copilot/          ← VS Code GitHub Copilot Agent
│   ├── zed/                     ← Zed editor
│   ├── openhands/               ← OpenHands (formerly OpenDevin)
│   ├── claude-desktop/          ← Claude Desktop app
│   ├── 5ire/                    ← 5ire desktop AI client
│   ├── aider/                   ← Aider CLI (prompt fallback)
│   └── generic/                 ← Goose, custom MCP, plain LLM prompt
│
├── README.md                    ← you are here
├── LICENSE                      ← MIT
└── .gitignore
```

---

## Troubleshooting

### `DERABIA_WHOIS_API_KEY is not set`

The MCP server can't read your environment variable. Try:

1. Confirm the variable is set: `echo $DERABIA_WHOIS_API_KEY` (mac/linux) or `echo $env:DERABIA_WHOIS_API_KEY` (PowerShell)
2. Restart Claude Code after setting the variable
3. If using `setx` on Windows, open a **new** terminal — `setx` doesn't update the current shell

### `WHOIS API authentication failed`

Your key is set but invalid. Double-check that you copied the full key and that it hasn't expired.

### `WHOIS API rate limit exceeded`

You're hitting the Derabia API too fast. The skill auto-retries once after 5 seconds; if it persists, upgrade your Derabia plan or wait a few minutes.

### `Derabia MCP server is not responding`

The MCP server failed to start. Check:

1. Node.js ≥ 18 is installed (`node --version`)
2. Dependencies are installed (`cd mcp-servers/derabia && npm install`)
3. Claude Code logs for MCP startup errors

### `No available domains found for "<topic>"`

All 60 candidates were already registered. Try:

- A broader or more abstract topic
- Mention industry context (e.g. "fitness" → "fitness coaching for runners")
- Run `/dd` again — different candidates each time

---

## Customization

Want to tune the skill? Edit `skills/dd/SKILL.md`. Common tweaks:

| Want to… | Edit this in `SKILL.md` |
|----------|-------------------------|
| Generate more candidates | "Generate **30**" → bump the number |
| Show more results | "top **10**" → change to top 20 |
| Add/remove TLDs | The TLD list under Step 1 |
| Different output format | The "Rank & Present" section |
| Add filtering (e.g. max length) | Add a step between WHOIS and pricing |

After editing, restart Claude Code for changes to take effect.

---

## Contributing

PRs and issues welcome at [github.com/Amrwebdeveloper/dd-plugin](https://github.com/Amrwebdeveloper/dd-plugin).

Areas where help is especially appreciated:

- Additional TLD support and TLD-specific tuning
- Caching layer to reduce repeated API calls
- Optional `--style` flag (e.g. `/dd --style=coined fitness app`)
- Tests for the MCP server

---

## License

MIT — see [LICENSE](./LICENSE).

Derabia is a third-party service; this plugin is not officially affiliated with Derabia. You are responsible for your own API usage and any associated costs. To request API access, visit [api.derabia.com](https://api.derabia.com).
