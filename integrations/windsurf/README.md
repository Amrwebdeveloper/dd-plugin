# Windsurf Integration

Use the `dd` domain finder inside [Windsurf](https://windsurf.com) (Codeium's AI IDE) — supports MCP and the **Workflows** system (markdown recipes invoked with `/workflow-name`).

---

## Prerequisites

- [Windsurf](https://windsurf.com) installed
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

Edit `~/.codeium/windsurf/mcp_config.json` (create the file if needed) and merge in the contents of [`mcp_config.json`](./mcp_config.json):

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

### 2. Install the `dd` workflow

Copy [`workflows/dd.md`](./workflows/dd.md) into your workflows directory:

```bash
# Project-scoped (recommended for teams)
mkdir -p .windsurf/workflows
cp integrations/windsurf/workflows/dd.md .windsurf/workflows/

# OR global (available in every Windsurf project)
mkdir -p ~/.codeium/windsurf/global_workflows
cp integrations/windsurf/workflows/dd.md ~/.codeium/windsurf/global_workflows/
```

### 3. Restart Windsurf

Quit and relaunch so Cascade picks up the new MCP server and workflow.

---

## Usage

In Cascade, invoke the workflow with a slash command:

```
/dd fitness tracker app
```

Or with no argument (Cascade will infer the topic from your recent messages):

```
/dd
```

---

## Notes

- `.windsurf/workflows/*.md` files are version-controlled with your repo, so the workflow travels with the codebase.
- For team-wide adoption, commit the workflow to your repo and document the MCP install in your project's onboarding.

See the [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp) for more.
