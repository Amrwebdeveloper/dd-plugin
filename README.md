# dd-plugin — Autonomous Domain Name Finder for Claude Code

> Generate available, brand-worthy domain names in seconds. Type `/dd <topic>` and get a ranked list of available domains scored by an ML brand-value model.

`dd-plugin` is a [Claude Code](https://claude.com/claude-code) plugin that bundles:

1. **The `/dd` skill** — an autonomous workflow that brainstorms domain candidates, filters by availability, and ranks survivors by predicted brand value.
2. **The `derabia` MCP server** — a Node.js server exposing two tools (`check_domain`, `get_domain_prices`) backed by the [Derabia](https://api.derabia.com) WHOIS and ML pricing APIs.

Everything is in one repo. One install command, two API keys, and you're done.

---

## Table of Contents

- [What it does](#what-it-does)
- [Requirements](#requirements)
- [Installation](#installation)
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

## Installation

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
├── .claude-plugin/
│   └── plugin.json              ← plugin metadata
├── .mcp.json                    ← MCP server declaration
├── skills/
│   └── dd/
│       └── SKILL.md             ← the /dd skill
├── mcp-servers/
│   └── derabia/
│       ├── package.json
│       ├── server.js            ← MCP server implementation
│       └── .env.example         ← API key template
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
