# Aider Integration

[Aider](https://aider.chat) is a popular terminal-based AI pair programmer. As of mid-2026, **Aider does not natively support MCP** — there's an [open feature request](https://github.com/aider-ai/aider/issues/4506), but no built-in MCP client yet.

This integration gives you two ways to use the `dd` workflow with Aider while waiting for native support.

---

## Option A — Prompt-only (works today, no MCP needed)

You can run the `/dd` workflow logic via Aider's chat, but the LLM has to call the Derabia API directly using `curl` instead of MCP tools.

1. Start Aider as usual.
2. Paste this into the chat (it includes the API keys inline — read them from your env first):

```
You will help me find available domains for a topic.

For each candidate I provide, run:
  curl -sf -H "X-API-Key: $DERABIA_WHOIS_API_KEY" "https://api.derabia.com/whois?domain=<domain>"
  curl -sf -H "X-API-Key: $DERABIA_PRICING_API_KEY" "https://api.derabia.com/pricing?domain=<domain>"

Workflow:
  1. Generate ~30 brand/domain candidates for the topic.
  2. Check WHOIS for all (use the bash !command interface to invoke curl).
  3. For available ones, get the price.
  4. Sort by price and return the top 10 as a markdown table.

Topic: fitness tracker app
```

3. Aider's `/run` or `!` bash escape will execute the curl calls and feed results back into the chat.

This is slower than MCP (no parallelism, Aider's bash is sequential) but works without any setup.

---

## Option B — Use a community MCP bridge

Several community projects bridge MCP and Aider. The most notable:

- **[`disler/aider-mcp-server`](https://github.com/disler/aider-mcp-server)** — exposes Aider as an MCP server (the opposite direction from what we want here, but useful for chaining).
- **[`lutzleonhardt/mcpm-aider`](https://github.com/lutzleonhardt/mcpm-aider)** — manages MCP servers for both Claude Desktop AND Aider's prompt-based usage.

These bridges are experimental — read their docs carefully before relying on them in production.

---

## Option C — Wait for native MCP support

Track [Aider issue #4506](https://github.com/aider-ai/aider/issues/4506) for `aider --mcp-server` support. When it lands, this README will be updated with a proper config snippet.

In the meantime, if you want a true MCP-native CLI experience, consider [OpenCode](../opencode/) (which is closely positioned to Aider but MCP-first).
