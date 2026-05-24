# One-Shot Install Prompt

Copy the prompt below into **any AI coding tool** (Claude Code, Cursor, OpenCode, Cline, Windsurf, etc.) and it will inspect, understand, and install `dd-plugin` for you autonomously.

The prompt is **tool-agnostic** — the AI will detect which environment it's running in and follow the correct integration path.

---

## 📋 The Prompt

```markdown
You are about to install **dd-plugin** — an autonomous domain-name finder
powered by a Model Context Protocol (MCP) server. Your job is to inspect the
repository, understand it, and install it correctly for the AI tool you are
currently running inside.

## Context
- Repo: https://github.com/Amrwebdeveloper/dd-plugin
- What it does: typing `/dd <topic>` (or asking in natural language) returns
  available domain names ranked by an ML-predicted brand value.
- Two components in one repo:
    1. A universal MCP server (`mcp-servers/derabia/server.js`) exposing
       two tools: `check_domain` and `get_domain_prices`.
    2. A per-tool workflow file (skill / agent / rule / prompt) — same
       pipeline, different format per tool.

## Step 1 — Inspect the repo
Use your read/fetch tools to look at:
  1. `README.md` (root)               → overview + supported tools
  2. `integrations/README.md`         → matrix of 19 supported tools
  3. `integrations/<your-tool>/`      → README + config files for the tool
                                         you are running in (pick the one that
                                         matches). If unsure, default to the
                                         `generic/` folder.
  4. `install.js`                     → auto-installer source (skim only)

Then report in 3 sentences:
  • What the MCP server provides.
  • Which AI tool you have identified yourself as running inside.
  • Which integration folder you will use.

## Step 2 — Confirm understanding
State explicitly that you understand:
  • Node.js ≥ 18 is required.
  • Two env vars are required: `DERABIA_WHOIS_API_KEY` and
    `DERABIA_PRICING_API_KEY`. They are requested at https://api.derabia.com
    (granted on request — NOT self-service signup).
  • The workflow file describes the `/dd` pipeline (generate 30 candidates →
    parallel WHOIS check → parallel ML pricing → ranked top-10 table).

## Step 3 — Install
Pick ONE path:

  A. AUTO-INSTALLER (preferred when you have shell access)
     1. `git clone https://github.com/Amrwebdeveloper/dd-plugin.git`
     2. `cd dd-plugin`
     3. `node install.js --dry-run` — preview, change nothing
     4. Show me the dry-run output, then ask permission to run the real install
     5. On approval: `node install.js --tools=<my-tool>` (or `--all`)

  B. MANUAL INSTALL (when shell access is limited)
     1. Clone the repo to a stable location (e.g. `~/dd-plugin`).
     2. `npm install` inside `mcp-servers/derabia/`.
     3. Open `integrations/<my-tool>/README.md` and follow its instructions
        exactly — copy the MCP config snippet into the right file, copy the
        workflow file into the right directory.
     4. Use ABSOLUTE paths in every config (e.g. `/Users/me/dd-plugin/...`,
        never `./...`).

## Step 4 — Verify
  1. Confirm both env vars are set (or written into the MCP config block).
  2. Restart the tool (MCP servers only spawn at launch).
  3. Smoke test: ask the tool to "find available domains for a fitness
     tracker app" and confirm a ranked markdown table comes back.

## Hard constraints
  • NEVER commit API keys to any file that will be tracked by git. Keys go in
    env vars or local-only MCP config files (which are gitignored).
  • If the install requires destructive actions (overwriting an existing
    config), back up the original first and warn me before proceeding.
  • If you are not sure which tool you are running inside, STOP and ask me.
  • If you cannot find the API keys in my environment, STOP and ask me for
    them — do not invent or use placeholder values for a real install.

## My API keys
  DERABIA_WHOIS_API_KEY   = <I will provide, or read from env>
  DERABIA_PRICING_API_KEY = <I will provide, or read from env>

Begin with Step 1.
```

---

## 🚀 Short version (one-liner — for the impatient)

If you trust the auto-installer and just want it done:

```
Clone https://github.com/Amrwebdeveloper/dd-plugin , run `node install.js --dry-run`, show me the output, then on my approval run `node install.js` and configure for whatever tool you detect yourself running inside. Ask me for the two Derabia API keys when needed.
```

---

## 💡 Tips for using this prompt

1. **Pre-fill your keys** — replace `<I will provide…>` with your actual keys before pasting, so the AI doesn't have to ask. Don't paste keys into shared chats.

2. **Tool hint** — if the AI gets confused about which tool it's running in, add a line at the top: `You are running inside <Cursor / Cline / OpenCode / …>.`

3. **Per-project vs global** — by default the prompt does a global install. To restrict to one project, add: `Install only for this current project, not globally.`

4. **Dry-run only** — to see what would happen without writing: add `STOP after the dry-run — do not perform the real install.`

5. **Save it** — paste this prompt into a file in your dotfiles (e.g. `~/prompts/install-dd.md`) so you can reuse it every time you switch machines.
