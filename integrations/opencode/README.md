# OpenCode Integration

Use the `dd` domain finder inside [OpenCode](https://opencode.ai) — SST's open-source AI coding agent.

OpenCode supports MCP natively, so the **same MCP server** from this repo works as-is. You just need to register it in `opencode.json` and copy the `dd` agent into your agents directory.

---

## Prerequisites

- [OpenCode](https://opencode.ai) installed (`brew install sst/tap/opencode` or `curl -fsSL https://opencode.ai/install | bash`)
- Node.js ≥ 18
- The `dd-plugin` repo cloned somewhere on your machine, with MCP dependencies installed:
  ```bash
  git clone https://github.com/Amrwebdeveloper/dd-plugin.git
  cd dd-plugin/mcp-servers/derabia
  npm install
  ```
- Two Derabia API keys (request at [api.derabia.com](https://api.derabia.com))

---

## Installation

### 1. Register the MCP server

Open your OpenCode config (`~/.config/opencode/opencode.json` or `.opencode/opencode.json` per-project) and add the `derabia` server under `mcp`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "derabia": {
      "type": "local",
      "command": ["node", "/absolute/path/to/dd-plugin/mcp-servers/derabia/server.js"],
      "enabled": true,
      "environment": {
        "DERABIA_WHOIS_API_KEY": "your_whois_key_here",
        "DERABIA_PRICING_API_KEY": "your_pricing_key_here"
      }
    }
  }
}
```

> Replace `/absolute/path/to/dd-plugin` with the actual path. On Windows use forward slashes or escape backslashes.

### 2. Install the `dd` agent

Copy [`agent/dd.md`](./agent/dd.md) into your OpenCode agents directory:

```bash
# Global (recommended)
mkdir -p ~/.config/opencode/agent
cp integrations/opencode/agent/dd.md ~/.config/opencode/agent/

# OR per-project
mkdir -p .opencode/agent
cp integrations/opencode/agent/dd.md .opencode/agent/
```

### 3. Restart OpenCode

```bash
# Exit and relaunch
opencode
```

---

## Usage

In any OpenCode session, invoke the `dd` agent:

```
@dd fitness tracker app
```

Or describe what you're building and let `dd` infer the topic:

```
I'm building a tool that syncs calendars across teams.
@dd
```

---

## Example output

```
| #  | Domain          | Brand Value | Length | Style |
|----|-----------------|-------------|--------|-------|
| 1  | syncly.com      | $5,200      | 6      | Coined |
| 2  | calendrix.io    | $3,800      | 9      | Compound |
| 3  | teamflux.app    | $3,400      | 8      | Compound |
| 4  | meetwave.com    | $2,900      | 8      | Compound |
| 5  | unifyteam.co    | $2,500      | 9      | Modifier+noun |
| ... |

_Checked 60 candidates · 10 results shown · Powered by Derabia_
```

---

## Troubleshooting

- **`derabia tools not found`** — check that the path in `command` is correct and absolute, and that `npm install` ran inside `mcp-servers/derabia/`.
- **`DERABIA_WHOIS_API_KEY is not set`** — ensure the `environment` block in `opencode.json` includes both keys, then restart OpenCode.
- **Agent not appearing** — confirm the file is named exactly `dd.md` and lives in `~/.config/opencode/agent/` or `.opencode/agent/`. OpenCode uses the filename as the agent name.

See the [OpenCode docs](https://opencode.ai/docs/) for more.
