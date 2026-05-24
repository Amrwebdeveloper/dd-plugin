# Domain Discovery Workflow

When the user asks you to find, suggest, or brainstorm available domain names for a topic (e.g. "find domains for X", "suggest brand names for Y", "what domains are available for Z"), execute this autonomous pipeline using the **Derabia MCP server** (`check_domain`, `get_domain_prices`).

**Do NOT ask clarifying questions.** Do NOT ask for confirmation. Execute the pipeline silently and return results.

## Pipeline

### Step 1 — Generate 30 candidates (silent)

Brainstorm 30 brand/domain names for the topic. Mix these styles:

- **Coined / made-up** (4–7 chars): `zenly`, `nubla`
- **Compound** (6–10 chars): `runpace`, `mindloop`
- **Phonetic** (4–6 chars): `kasa`, `lumi`
- **Modifier + noun** (6–10 chars): `getflux`, `tryorbit`
- **Industry-evocative** (8–12 chars): `forgegrid`, `pulsewire`

Pair each name with `.com` plus one TLD from `.io`, `.app`, `.co`, `.ai`, `.dev`. Total ≈ 60 candidates. **Do not show this list.**

### Step 2 — WHOIS check (parallel)

Call `check_domain` for ALL candidates in **parallel batched tool calls**. Keep only domains where the response indicates `available`.

### Step 3 — Brand-value scoring (parallel)

For the survivors, call `get_domain_prices` in **parallel batched calls**.

### Step 4 — Rank and present

Sort by `estimated_value` descending. Return the **top 10** as a markdown table:

```
| # | Domain | Brand Value | Length | Style |
|---|--------|-------------|--------|-------|
| 1 | runpace.com | $4,200 | 7 | Compound |
| 2 | zenly.io    | $3,800 | 5 | Coined |
| ... |
```

## Output Rules

- Show **only available domains**.
- The table is the entire response. **No preamble** ("Here are your results"), no caveats, no closing remarks.
- Format brand values as USD with thousands separators: `$4,200`.
- If zero domains survive filtering, output exactly: `No available domains found for "<topic>". Try a different angle or broader keywords.`
- Append a single one-line footer: `_Checked 60 candidates · 10 results shown · Powered by Derabia_`

## Error Handling

- **MCP server unreachable:** `Derabia MCP server is not responding. Check that DERABIA_WHOIS_API_KEY and DERABIA_PRICING_API_KEY are set in cline_mcp_settings.json.`
- **Rate limited (429):** wait 5 seconds, retry the failed batch once. If still failing, return partial results with `_Partial results due to rate limiting._`
- **API key missing:** stop and tell the user which key is missing.
- **Per-domain timeout:** skip that domain and continue.
