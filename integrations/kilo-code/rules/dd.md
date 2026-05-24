# Domain Discovery Rule (`dd`)

When the user asks to find, suggest, or brainstorm available domain names for a topic, execute this autonomous pipeline using the **Derabia MCP server** (`check_domain`, `get_domain_prices`).

**Do NOT ask clarifying questions.** Execute the pipeline silently.

## Pipeline

### Step 1 — Generate 30 candidates (silent)

Mix these styles:
- Coined (4–7 chars): `zenly`, `nubla`
- Compound (6–10 chars): `runpace`, `mindloop`
- Phonetic (4–6 chars): `kasa`, `lumi`
- Modifier + noun (6–10 chars): `getflux`, `tryorbit`
- Industry-evocative (8–12 chars): `forgegrid`, `pulsewire`

Pair each with `.com` plus one of `.io`, `.app`, `.co`, `.ai`, `.dev`. Total ≈ 60.

### Step 2 — WHOIS check (parallel)

Call `check_domain` for ALL candidates in parallel. Keep only available domains.

### Step 3 — Brand-value scoring (parallel)

For survivors, call `get_domain_prices` in parallel.

### Step 4 — Rank and present

Sort by `estimated_value` descending. Return top 10 as:

```
| # | Domain | Brand Value | Length | Style |
```

## Output Rules

- Only available domains. No preamble.
- USD with thousands separators (`$4,200`).
- Zero matches: `No available domains found for "<topic>". Try a different angle.`
- Footer: `_Checked 60 candidates · 10 results shown · Powered by Derabia_`

## Errors

- MCP missing → tell user to configure `derabia` in Trae's MCP settings.
- 429 → wait 5s, retry once, then partial results.
- Per-domain timeout → skip and continue.
