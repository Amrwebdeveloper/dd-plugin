#!/usr/bin/env node
/**
 * Derabia MCP Server
 *
 * Exposes two tools:
 *   - check_domain        → WHOIS availability check
 *   - get_domain_prices   → ML-based brand-value prediction
 *
 * Configuration (via environment variables):
 *   DERABIA_WHOIS_API_KEY     (required) — key for the WHOIS endpoint
 *   DERABIA_PRICING_API_KEY   (required) — key for the pricing endpoint
 *   DERABIA_WHOIS_API_URL     (optional) — default: https://api.derabia.com/whois
 *   DERABIA_PRICING_API_URL   (optional) — default: https://api.derabia.com/pricing
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ---------- Configuration ----------
const WHOIS_API_KEY = process.env.DERABIA_WHOIS_API_KEY;
const PRICING_API_KEY = process.env.DERABIA_PRICING_API_KEY;
const WHOIS_API_URL =
  process.env.DERABIA_WHOIS_API_URL || "https://api.derabia.com/whois";
const PRICING_API_URL =
  process.env.DERABIA_PRICING_API_URL || "https://api.derabia.com/pricing";

const REQUEST_TIMEOUT_MS = 15000;

// ---------- Helpers ----------
function jsonResult(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function jsonError(message, extra = {}) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: message, ...extra }, null, 2),
      },
    ],
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeDomain(domain) {
  if (typeof domain !== "string") {
    throw new Error("domain must be a string");
  }
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) throw new Error("domain cannot be empty");
  if (!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/.test(trimmed)) {
    throw new Error(`invalid domain format: "${domain}"`);
  }
  return trimmed;
}

// ---------- Tool implementations ----------

/**
 * check_domain — WHOIS availability lookup.
 * Returns { domain, available, registrar?, expires_at? }
 */
async function checkDomain({ domain }) {
  if (!WHOIS_API_KEY) {
    return jsonError(
      "DERABIA_WHOIS_API_KEY is not set. Get a key at https://derabia.com and export it as an environment variable."
    );
  }

  let normalized;
  try {
    normalized = normalizeDomain(domain);
  } catch (e) {
    return jsonError(e.message);
  }

  try {
    const url = `${WHOIS_API_URL}?domain=${encodeURIComponent(normalized)}`;
    const res = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        "X-API-Key": WHOIS_API_KEY,
        Accept: "application/json",
        "User-Agent": "derabia-mcp/1.0.0",
      },
    });

    if (res.status === 401 || res.status === 403) {
      return jsonError("WHOIS API authentication failed. Verify DERABIA_WHOIS_API_KEY.");
    }
    if (res.status === 429) {
      return jsonError("WHOIS API rate limit exceeded. Retry in a few seconds.", {
        retry_after_seconds: Number(res.headers.get("retry-after")) || 5,
      });
    }
    if (!res.ok) {
      return jsonError(`WHOIS API returned HTTP ${res.status}`, {
        body: (await res.text()).slice(0, 500),
      });
    }

    const data = await res.json();

    // Normalize a variety of possible response shapes into one schema
    const available =
      data.available ??
      data.is_available ??
      data.status === "available" ??
      data.availability === "available";

    return jsonResult({
      domain: normalized,
      available: Boolean(available),
      registrar: data.registrar ?? null,
      expires_at: data.expires_at ?? data.expiry ?? null,
      raw: data,
    });
  } catch (e) {
    if (e.name === "AbortError") {
      return jsonError(`WHOIS lookup timed out for "${normalized}"`);
    }
    return jsonError(`WHOIS lookup failed: ${e.message}`);
  }
}

/**
 * get_domain_prices — ML brand-value prediction.
 * Returns { domain, estimated_value, currency, confidence? }
 */
async function getDomainPrices({ domain }) {
  if (!PRICING_API_KEY) {
    return jsonError(
      "DERABIA_PRICING_API_KEY is not set. Get a key at https://derabia.com and export it as an environment variable."
    );
  }

  let normalized;
  try {
    normalized = normalizeDomain(domain);
  } catch (e) {
    return jsonError(e.message);
  }

  try {
    const url = `${PRICING_API_URL}?domain=${encodeURIComponent(normalized)}`;
    const res = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        "X-API-Key": PRICING_API_KEY,
        Accept: "application/json",
        "User-Agent": "derabia-mcp/1.0.0",
      },
    });

    if (res.status === 401 || res.status === 403) {
      return jsonError("Pricing API authentication failed. Verify DERABIA_PRICING_API_KEY.");
    }
    if (res.status === 429) {
      return jsonError("Pricing API rate limit exceeded. Retry in a few seconds.", {
        retry_after_seconds: Number(res.headers.get("retry-after")) || 5,
      });
    }
    if (!res.ok) {
      return jsonError(`Pricing API returned HTTP ${res.status}`, {
        body: (await res.text()).slice(0, 500),
      });
    }

    const data = await res.json();

    const estimated =
      data.estimated_value ??
      data.price ??
      data.brand_value ??
      data.value ??
      null;

    return jsonResult({
      domain: normalized,
      estimated_value: estimated,
      currency: data.currency || "USD",
      confidence: data.confidence ?? null,
      raw: data,
    });
  } catch (e) {
    if (e.name === "AbortError") {
      return jsonError(`Pricing lookup timed out for "${normalized}"`);
    }
    return jsonError(`Pricing lookup failed: ${e.message}`);
  }
}

// ---------- MCP server wiring ----------

const TOOLS = [
  {
    name: "check_domain",
    description:
      "Check whether a domain is available for registration via the Derabia WHOIS API. Returns availability status, registrar (if registered), and expiry date.",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description:
            "Fully-qualified domain name to check, e.g. 'example.com'. Must include a TLD.",
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "get_domain_prices",
    description:
      "Estimate the brand value of a domain using the Derabia ML pricing model. Use this only for domains that are AVAILABLE (call check_domain first). Returns an estimated price in USD.",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Fully-qualified domain name to price, e.g. 'example.com'.",
        },
      },
      required: ["domain"],
    },
  },
];

const server = new Server(
  { name: "derabia", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  switch (name) {
    case "check_domain":
      return checkDomain(args || {});
    case "get_domain_prices":
      return getDomainPrices(args || {});
    default:
      return jsonError(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
