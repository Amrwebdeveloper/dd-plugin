#!/usr/bin/env node
/**
 * dd-plugin auto-installer
 *
 * Detects installed AI coding tools and wires the `derabia` MCP server +
 * the `/dd` workflow into each one's native config format.
 *
 * Usage:
 *   node install.js                           interactive, auto-detect
 *   node install.js --all                     install for every detected tool
 *   node install.js --tools=cursor,opencode   install for specific tools only
 *   node install.js --dry-run                 show the plan, change nothing
 *   node install.js --uninstall               remove dd-plugin configs
 *   node install.js --help                    print this message
 *
 * Environment variables (skip interactive prompts if set):
 *   DERABIA_WHOIS_API_KEY
 *   DERABIA_PRICING_API_KEY
 *
 * Cross-platform: macOS, Linux, Windows. Zero npm dependencies.
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  unlinkSync,
} from "node:fs";
import { join, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawnSync } from "node:child_process";
import { homedir, platform } from "node:os";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const PLUGIN_ROOT = dirname(__filename);
const SERVER_PATH = resolve(PLUGIN_ROOT, "mcp-servers", "derabia", "server.js");
const SERVER_DIR = dirname(SERVER_PATH);
const INTEGRATIONS_DIR = resolve(PLUGIN_ROOT, "integrations");
const HOME = homedir();
const PLAT = platform(); // 'win32' | 'darwin' | 'linux'
const IS_WIN = PLAT === "win32";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny logger with ANSI colors (skip on Windows older terminals)
// ─────────────────────────────────────────────────────────────────────────────

const NO_COLOR = process.env.NO_COLOR || (IS_WIN && !process.env.WT_SESSION);
const c = (code) => (s) => (NO_COLOR ? s : `\x1b[${code}m${s}\x1b[0m`);
const dim = c("2");
const bold = c("1");
const cyan = c("36");
const green = c("32");
const yellow = c("33");
const red = c("31");
const gray = c("90");

const log = {
  info: (msg) => console.log(`${cyan("ℹ")} ${msg}`),
  ok: (msg) => console.log(`${green("✔")} ${msg}`),
  warn: (msg) => console.log(`${yellow("⚠")} ${msg}`),
  err: (msg) => console.error(`${red("✖")} ${msg}`),
  step: (msg) => console.log(`\n${bold(cyan("›"))} ${bold(msg)}`),
  dim: (msg) => console.log(dim(msg)),
};

// ─────────────────────────────────────────────────────────────────────────────
// CLI argument parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    all: false,
    dryRun: false,
    uninstall: false,
    help: false,
    tools: null,
  };
  for (const arg of argv.slice(2)) {
    if (arg === "--all") args.all = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--uninstall") args.uninstall = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg.startsWith("--tools=")) args.tools = arg.slice(8).split(",").map((s) => s.trim());
    else if (arg.startsWith("--tools ")) args.tools = arg.slice(8).split(",").map((s) => s.trim());
    else {
      log.warn(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
${bold("dd-plugin auto-installer")}

Detects which AI coding tools you have installed and configures each one
to use the ${bold("derabia")} MCP server + the ${bold("/dd")} workflow.

${bold("Usage")}
  node install.js                            interactive — detect, prompt, install
  node install.js --all                      install for every detected tool
  node install.js --tools=cursor,opencode    install for specific tools only
  node install.js --dry-run                  show the plan, write nothing
  node install.js --uninstall                remove dd-plugin configs

${bold("Supported tools")}
  claude-code, opencode, cursor, cline, continue, windsurf,
  vscode-copilot, zed, goose, trae, roo-code, kilo-code,
  claude-desktop, kiro, void, cody, openhands, 5ire, aider

${bold("Environment variables")} (skip interactive prompts)
  DERABIA_WHOIS_API_KEY
  DERABIA_PRICING_API_KEY

${bold("Examples")}
  node install.js --tools=cursor --dry-run
  DERABIA_WHOIS_API_KEY=xxx DERABIA_PRICING_API_KEY=yyy node install.js --all
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// File helpers
// ─────────────────────────────────────────────────────────────────────────────

function readJsonSafe(path) {
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    // strip BOM + tolerate JSONC-style trailing commas if present (best effort)
    return JSON.parse(raw.replace(/^﻿/, ""));
  } catch (e) {
    log.warn(`Could not parse ${path}: ${e.message}`);
    return null;
  }
}

function writeJsonPretty(path, obj, dryRun = false) {
  const json = JSON.stringify(obj, null, 2) + "\n";
  if (dryRun) {
    log.dim(`   would write ${path} (${json.length} bytes)`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) {
    const backup = `${path}.bak-${Date.now()}`;
    copyFileSync(path, backup);
    log.dim(`   backed up existing → ${backup}`);
  }
  writeFileSync(path, json, "utf8");
  log.ok(`wrote ${path}`);
}

function ensureDir(dir, dryRun = false) {
  if (existsSync(dir)) return;
  if (dryRun) {
    log.dim(`   would create directory ${dir}`);
    return;
  }
  mkdirSync(dir, { recursive: true });
}

function copyFile(src, dst, dryRun = false) {
  if (dryRun) {
    log.dim(`   would copy ${src} → ${dst}`);
    return;
  }
  ensureDir(dirname(dst));
  copyFileSync(src, dst);
  log.ok(`copied ${dst.replace(HOME, "~")}`);
}

function cmdExists(cmd) {
  try {
    const which = IS_WIN ? "where" : "which";
    const r = spawnSync(which, [cmd], { stdio: "ignore" });
    return r.status === 0;
  } catch {
    return false;
  }
}

function getVSCodeExtensions() {
  if (!cmdExists("code")) return [];
  try {
    const out = execSync("code --list-extensions", { encoding: "utf8", timeout: 5000 });
    return out.split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform-specific user-config base paths
// ─────────────────────────────────────────────────────────────────────────────

function xdgConfigHome() {
  if (process.env.XDG_CONFIG_HOME) return process.env.XDG_CONFIG_HOME;
  if (IS_WIN) return join(HOME, "AppData", "Roaming");
  if (PLAT === "darwin") return join(HOME, ".config"); // many tools use ~/.config on mac too
  return join(HOME, ".config");
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool registry — each tool defines detect() + plan({ keys, serverPath })
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each plan() returns an array of actions:
 *   { kind: 'mergeJson', path, root: ['mcpServers'], key: 'derabia', value: {...} }
 *   { kind: 'writeJson', path, value: {...} }
 *   { kind: 'copyFile', src, dst }
 *   { kind: 'writeText', path, text }
 *   { kind: 'note', text }
 */

const TOOLS = {
  "claude-code": {
    label: "Claude Code",
    detect() {
      return existsSync(join(HOME, ".claude")) || cmdExists("claude");
    },
    plan({ keys }) {
      // Claude Code reads .mcp.json + skills/ from the plugin folder itself
      // once it's installed via /plugin install. Local install only needs the
      // user to point their settings at the plugin folder.
      return [
        {
          kind: "note",
          text: `Claude Code reads .mcp.json and skills/ from the plugin folder.
   Install via:  ${bold("/plugin install Amrwebdeveloper/dd-plugin")}
   Then set env vars in ~/.claude/settings.json:
     "env": {
       "DERABIA_WHOIS_API_KEY": "${keys.whois}",
       "DERABIA_PRICING_API_KEY": "${keys.pricing}"
     }`,
        },
      ];
    },
    restart: "Restart Claude Code (exit and relaunch).",
  },

  opencode: {
    label: "OpenCode (SST)",
    detect() {
      return (
        existsSync(join(xdgConfigHome(), "opencode")) ||
        existsSync(join(HOME, ".config", "opencode")) ||
        cmdExists("opencode")
      );
    },
    plan({ keys, serverPath }) {
      const cfgPath = join(xdgConfigHome(), "opencode", "opencode.json");
      const agentPath = join(xdgConfigHome(), "opencode", "agent", "dd.md");
      const agentSrc = join(INTEGRATIONS_DIR, "opencode", "agent", "dd.md");
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcp"],
          key: "derabia",
          value: {
            type: "local",
            command: ["node", serverPath],
            enabled: true,
            environment: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
          },
        },
        { kind: "copyFile", src: agentSrc, dst: agentPath },
      ];
    },
    restart: "Restart OpenCode (exit and relaunch the CLI).",
  },

  cursor: {
    label: "Cursor",
    detect() {
      const macApp = "/Applications/Cursor.app";
      const winApp = join(HOME, "AppData", "Local", "Programs", "cursor");
      const linuxDir = join(HOME, ".config", "Cursor");
      const cursorCfg = join(HOME, ".cursor");
      return (
        existsSync(cursorCfg) ||
        existsSync(macApp) ||
        existsSync(winApp) ||
        existsSync(linuxDir) ||
        cmdExists("cursor")
      );
    },
    plan({ keys, serverPath }) {
      const cfgPath = join(HOME, ".cursor", "mcp.json");
      const rulePath = join(HOME, ".cursor", "rules", "dd.mdc");
      const ruleSrc = join(INTEGRATIONS_DIR, "cursor", "rules", "dd.mdc");
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcpServers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
          },
        },
        { kind: "copyFile", src: ruleSrc, dst: rulePath },
      ];
    },
    restart: "Reload Cursor: Cmd/Ctrl+Shift+P → 'Developer: Reload Window'.",
  },

  cline: {
    label: "Cline (VS Code extension)",
    detect() {
      const exts = getVSCodeExtensions();
      return exts.includes("saoudrizwan.claude-dev");
    },
    plan({ keys, serverPath }) {
      // Cline stores MCP settings inside VS Code's globalStorage
      let cfgPath;
      if (IS_WIN) {
        cfgPath = join(
          HOME,
          "AppData",
          "Roaming",
          "Code",
          "User",
          "globalStorage",
          "saoudrizwan.claude-dev",
          "settings",
          "cline_mcp_settings.json"
        );
      } else if (PLAT === "darwin") {
        cfgPath = join(
          HOME,
          "Library",
          "Application Support",
          "Code",
          "User",
          "globalStorage",
          "saoudrizwan.claude-dev",
          "settings",
          "cline_mcp_settings.json"
        );
      } else {
        cfgPath = join(
          HOME,
          ".config",
          "Code",
          "User",
          "globalStorage",
          "saoudrizwan.claude-dev",
          "settings",
          "cline_mcp_settings.json"
        );
      }
      // Workflow rule goes into project's .clinerules/ — best done per-project,
      // but for a global install we write to ~/.clinerules/ as a fallback.
      const rulePath = join(HOME, ".clinerules", "dd.md");
      const ruleSrc = join(INTEGRATIONS_DIR, "cline", "clinerules", "dd.md");
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcpServers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
            disabled: false,
            autoApprove: [],
          },
        },
        { kind: "copyFile", src: ruleSrc, dst: rulePath },
        {
          kind: "note",
          text: `Rule was placed at ~/.clinerules/dd.md as a fallback.
   For best results, copy it into each project's .clinerules/ folder.`,
        },
      ];
    },
    restart: "Click the refresh icon in Cline's MCP Servers panel in VS Code.",
  },

  continue: {
    label: "Continue.dev",
    detect() {
      return existsSync(join(HOME, ".continue"));
    },
    plan({ keys, serverPath }) {
      const cfgPath = join(HOME, ".continue", "config.yaml");
      const promptDst = join(HOME, ".continue", "prompts", "dd.prompt");
      const promptSrc = join(INTEGRATIONS_DIR, "continue", "prompts", "dd.prompt");
      // We don't have a YAML parser bundled, so we either create a fresh
      // config.yaml or guide the user to merge manually.
      if (!existsSync(cfgPath)) {
        const yaml = `# Generated by dd-plugin installer
mcpServers:
  - name: derabia
    command: node
    args:
      - ${serverPath}
    env:
      DERABIA_WHOIS_API_KEY: ${keys.whois}
      DERABIA_PRICING_API_KEY: ${keys.pricing}
`;
        return [
          { kind: "writeText", path: cfgPath, text: yaml },
          { kind: "copyFile", src: promptSrc, dst: promptDst },
        ];
      }
      // Existing YAML — print the snippet for manual merge
      const snippet = `mcpServers:
  - name: derabia
    command: node
    args:
      - ${serverPath}
    env:
      DERABIA_WHOIS_API_KEY: ${keys.whois}
      DERABIA_PRICING_API_KEY: ${keys.pricing}`;
      return [
        { kind: "copyFile", src: promptSrc, dst: promptDst },
        {
          kind: "note",
          text: `${yellow("Continue.dev already has a config.yaml.")} Merge this snippet under ${bold("mcpServers:")} manually:\n\n${snippet}`,
        },
      ];
    },
    restart: "Cmd/Ctrl+Shift+P → 'Continue: Reload Config'.",
  },

  windsurf: {
    label: "Windsurf (Codeium)",
    detect() {
      return (
        existsSync(join(HOME, ".codeium", "windsurf")) ||
        existsSync("/Applications/Windsurf.app") ||
        cmdExists("windsurf")
      );
    },
    plan({ keys, serverPath }) {
      const cfgPath = join(HOME, ".codeium", "windsurf", "mcp_config.json");
      const wfPath = join(HOME, ".codeium", "windsurf", "global_workflows", "dd.md");
      const wfSrc = join(INTEGRATIONS_DIR, "windsurf", "workflows", "dd.md");
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcpServers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
          },
        },
        { kind: "copyFile", src: wfSrc, dst: wfPath },
      ];
    },
    restart: "Quit and relaunch Windsurf.",
  },

  "vscode-copilot": {
    label: "VS Code GitHub Copilot",
    detect() {
      const exts = getVSCodeExtensions();
      return exts.includes("github.copilot") || exts.includes("github.copilot-chat");
    },
    plan({ keys, serverPath }) {
      // VS Code Copilot reads .vscode/mcp.json per-project. For a global
      // install we point to the user's global settings via mcp.servers.
      // The safest cross-version target is the global settings.json under "mcp".
      let cfgPath;
      if (IS_WIN) {
        cfgPath = join(HOME, "AppData", "Roaming", "Code", "User", "mcp.json");
      } else if (PLAT === "darwin") {
        cfgPath = join(HOME, "Library", "Application Support", "Code", "User", "mcp.json");
      } else {
        cfgPath = join(HOME, ".config", "Code", "User", "mcp.json");
      }
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["servers"],
          key: "derabia",
          value: {
            type: "stdio",
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
          },
        },
        {
          kind: "note",
          text: `Open Copilot Chat in ${bold("Agent")} mode (not Ask). Paste the workflow from ${join(INTEGRATIONS_DIR, "generic", "PROMPT.md")} or describe the task naturally.`,
        },
      ];
    },
    restart: "Cmd/Ctrl+Shift+P → 'Developer: Reload Window'.",
  },

  zed: {
    label: "Zed",
    detect() {
      const macSupport = join(HOME, "Library", "Application Support", "Zed");
      const linuxCfg = join(HOME, ".config", "zed");
      const winData = join(HOME, "AppData", "Roaming", "Zed");
      return (
        existsSync(macSupport) ||
        existsSync(linuxCfg) ||
        existsSync(winData) ||
        cmdExists("zed")
      );
    },
    plan({ keys, serverPath }) {
      let cfgPath;
      if (IS_WIN) cfgPath = join(HOME, "AppData", "Roaming", "Zed", "settings.json");
      else if (PLAT === "darwin")
        cfgPath = join(HOME, "Library", "Application Support", "Zed", "settings.json");
      else cfgPath = join(HOME, ".config", "zed", "settings.json");

      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["context_servers"],
          key: "derabia",
          value: {
            command: {
              path: "node",
              args: [serverPath],
              env: {
                DERABIA_WHOIS_API_KEY: keys.whois,
                DERABIA_PRICING_API_KEY: keys.pricing,
              },
            },
          },
        },
        {
          kind: "note",
          text: `Use the workflow prompt from ${join(INTEGRATIONS_DIR, "generic", "PROMPT.md")} in Zed's Assistant panel.`,
        },
      ];
    },
    restart: "Quit and relaunch Zed.",
  },

  goose: {
    label: "Goose (Block)",
    detect() {
      return existsSync(join(HOME, ".config", "goose")) || cmdExists("goose");
    },
    plan({ keys, serverPath }) {
      const cfgPath = join(HOME, ".config", "goose", "config.yaml");
      // Goose uses YAML — same approach as Continue
      if (!existsSync(cfgPath)) {
        const yaml = `# Generated by dd-plugin installer
extensions:
  derabia:
    type: stdio
    cmd: node
    args:
      - ${serverPath}
    envs:
      DERABIA_WHOIS_API_KEY: ${keys.whois}
      DERABIA_PRICING_API_KEY: ${keys.pricing}
    enabled: true
`;
        return [{ kind: "writeText", path: cfgPath, text: yaml }];
      }
      return [
        {
          kind: "note",
          text: `${yellow("Goose already has a config.yaml.")} Run ${bold("goose configure")} → Add Extension → Command-line Extension to register the derabia server.`,
        },
      ];
    },
    restart: "Restart your Goose session.",
  },

  trae: {
    label: "Trae (ByteDance)",
    detect() {
      return (
        existsSync(join(HOME, ".trae")) ||
        existsSync("/Applications/Trae.app") ||
        existsSync(join(HOME, "AppData", "Local", "Programs", "Trae")) ||
        existsSync(join(HOME, "AppData", "Roaming", "Trae")) ||
        cmdExists("trae")
      );
    },
    plan({ keys, serverPath }) {
      const cfgPath = join(HOME, ".trae", "settings", "mcp.json");
      const rulePath = join(HOME, ".trae", "rules", "dd.md");
      const ruleSrc = join(INTEGRATIONS_DIR, "trae", "rules", "dd.md");
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcpServers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
          },
        },
        { kind: "copyFile", src: ruleSrc, dst: rulePath },
        {
          kind: "note",
          text: `If Trae doesn't read ${cfgPath}, paste the same JSON into ${bold("Settings → MCP → Configure Manually")} inside Trae's UI.`,
        },
      ];
    },
    restart: "Quit and relaunch Trae.",
  },

  "roo-code": {
    label: "Roo Code (VS Code, archived 2026-05-15)",
    detect() {
      const exts = getVSCodeExtensions();
      return exts.includes("rooveterinaryinc.roo-cline");
    },
    plan({ keys, serverPath }) {
      let cfgPath;
      if (IS_WIN) {
        cfgPath = join(
          HOME,
          "AppData",
          "Roaming",
          "Code",
          "User",
          "globalStorage",
          "rooveterinaryinc.roo-cline",
          "settings",
          "mcp_settings.json"
        );
      } else if (PLAT === "darwin") {
        cfgPath = join(
          HOME,
          "Library",
          "Application Support",
          "Code",
          "User",
          "globalStorage",
          "rooveterinaryinc.roo-cline",
          "settings",
          "mcp_settings.json"
        );
      } else {
        cfgPath = join(
          HOME,
          ".config",
          "Code",
          "User",
          "globalStorage",
          "rooveterinaryinc.roo-cline",
          "settings",
          "mcp_settings.json"
        );
      }
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcpServers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
            disabled: false,
            alwaysAllow: [],
          },
        },
        {
          kind: "note",
          text: `${yellow("Roo Code was archived on 2026-05-15.")} Consider migrating to ${bold("Kilo Code")} (use --tools=kilo-code instead).`,
        },
      ];
    },
    restart: "Click the refresh icon in Roo Code's MCP Servers panel.",
  },

  "kilo-code": {
    label: "Kilo Code (VS Code, Roo Code successor)",
    detect() {
      const exts = getVSCodeExtensions();
      return exts.includes("kilocode.kilo-code");
    },
    plan({ keys, serverPath }) {
      let cfgPath;
      if (IS_WIN) {
        cfgPath = join(
          HOME,
          "AppData",
          "Roaming",
          "Code",
          "User",
          "globalStorage",
          "kilocode.kilo-code",
          "settings",
          "mcp_settings.json"
        );
      } else if (PLAT === "darwin") {
        cfgPath = join(
          HOME,
          "Library",
          "Application Support",
          "Code",
          "User",
          "globalStorage",
          "kilocode.kilo-code",
          "settings",
          "mcp_settings.json"
        );
      } else {
        cfgPath = join(
          HOME,
          ".config",
          "Code",
          "User",
          "globalStorage",
          "kilocode.kilo-code",
          "settings",
          "mcp_settings.json"
        );
      }
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcpServers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
            disabled: false,
            alwaysAllow: [],
          },
        },
      ];
    },
    restart: "Click the refresh icon in Kilo Code's MCP Servers panel.",
  },

  "claude-desktop": {
    label: "Claude Desktop",
    detect() {
      // Check config dir or app install
      const macCfg = join(HOME, "Library", "Application Support", "Claude");
      const winCfg = join(HOME, "AppData", "Roaming", "Claude");
      const linuxCfg = join(HOME, ".config", "Claude");
      const macApp = "/Applications/Claude.app";
      const winApp = join(HOME, "AppData", "Local", "Programs", "Claude");
      return (
        existsSync(macCfg) ||
        existsSync(winCfg) ||
        existsSync(linuxCfg) ||
        existsSync(macApp) ||
        existsSync(winApp)
      );
    },
    plan({ keys, serverPath }) {
      let cfgPath;
      if (IS_WIN) {
        cfgPath = join(HOME, "AppData", "Roaming", "Claude", "claude_desktop_config.json");
      } else if (PLAT === "darwin") {
        cfgPath = join(
          HOME,
          "Library",
          "Application Support",
          "Claude",
          "claude_desktop_config.json"
        );
      } else {
        cfgPath = join(HOME, ".config", "Claude", "claude_desktop_config.json");
      }
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcpServers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
          },
        },
      ];
    },
    restart: "Fully quit Claude Desktop (⌘Q on mac, tray → Quit on win) and relaunch.",
  },

  kiro: {
    label: "Kiro (AWS)",
    detect() {
      return (
        existsSync(join(HOME, ".kiro")) ||
        existsSync("/Applications/Kiro.app") ||
        cmdExists("kiro")
      );
    },
    plan({ keys, serverPath }) {
      const cfgPath = join(HOME, ".kiro", "settings", "mcp.json");
      // Kiro doesn't inherit PATH — set a sensible default
      const pathEnv = IS_WIN
        ? "C:\\Program Files\\nodejs;C:\\Windows\\System32"
        : "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin";
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcpServers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
              PATH: pathEnv,
            },
            disabled: false,
            disabledTools: [],
          },
        },
        {
          kind: "note",
          text: `${yellow("Kiro doesn't inherit shell PATH.")} If 'node' isn't found, change env.PATH to the directory containing your node binary (find it with: ${bold("which node")}).`,
        },
      ];
    },
    restart: "Quit and relaunch Kiro.",
  },

  void: {
    label: "Void editor",
    detect() {
      return (
        existsSync(join(HOME, ".config", "void")) ||
        existsSync(join(HOME, "Library", "Application Support", "Void")) ||
        existsSync(join(HOME, "AppData", "Roaming", "void")) ||
        existsSync("/Applications/Void.app") ||
        cmdExists("void")
      );
    },
    plan({ keys, serverPath }) {
      let cfgPath;
      if (IS_WIN) cfgPath = join(HOME, "AppData", "Roaming", "void", "mcp_servers.json");
      else cfgPath = join(HOME, ".config", "void", "mcp_servers.json");
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["mcpServers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
          },
        },
        {
          kind: "note",
          text: `Void has a known bug restricting MCP servers to its install dir. If you hit "module not found", check ${bold("https://github.com/voideditor/void/issues/701")}.`,
        },
      ];
    },
    restart: "Quit and relaunch Void.",
  },

  cody: {
    label: "Cody (Sourcegraph)",
    detect() {
      const exts = getVSCodeExtensions();
      return exts.includes("sourcegraph.cody-ai");
    },
    plan({ keys, serverPath }) {
      let cfgPath;
      if (IS_WIN) cfgPath = join(HOME, "AppData", "Roaming", "Code", "User", "settings.json");
      else if (PLAT === "darwin")
        cfgPath = join(HOME, "Library", "Application Support", "Code", "User", "settings.json");
      else cfgPath = join(HOME, ".config", "Code", "User", "settings.json");
      return [
        {
          kind: "mergeJson",
          path: cfgPath,
          root: ["cody.experimental.mcp.servers"],
          key: "derabia",
          value: {
            command: "node",
            args: [serverPath],
            env: {
              DERABIA_WHOIS_API_KEY: keys.whois,
              DERABIA_PRICING_API_KEY: keys.pricing,
            },
          },
        },
        {
          kind: "note",
          text: `Cody MCP requires ${bold("agentic context gathering")} (paid plans only). The setting key ${dim("cody.experimental.mcp.servers")} may be renamed in future versions.`,
        },
      ];
    },
    restart: "Cmd/Ctrl+Shift+P → 'Developer: Reload Window'.",
  },

  openhands: {
    label: "OpenHands (formerly OpenDevin)",
    detect() {
      return existsSync(join(HOME, ".openhands")) || cmdExists("openhands");
    },
    plan({ keys, serverPath }) {
      // OpenHands uses TOML — best done manually or via UI
      const snippet = `[mcp]

[mcp.stdio_servers]

[mcp.stdio_servers.derabia]
command = "node"
args = ["${serverPath}"]
env = { DERABIA_WHOIS_API_KEY = "${keys.whois}", DERABIA_PRICING_API_KEY = "${keys.pricing}" }`;
      return [
        {
          kind: "note",
          text: `OpenHands uses ${bold("TOML")} config (not JSON). The simplest path is the UI:\n${bold("Settings → MCP → Add Server → Stdio")}.\n\nOr add this to your config.toml manually:\n\n${snippet}`,
        },
      ];
    },
    restart: "Restart your OpenHands runtime / Docker container.",
  },

  "5ire": {
    label: "5ire (desktop AI assistant)",
    detect() {
      return (
        existsSync("/Applications/5ire.app") ||
        existsSync(join(HOME, "AppData", "Local", "Programs", "5ire")) ||
        existsSync(join(HOME, "AppData", "Roaming", "5ire")) ||
        existsSync(join(HOME, ".config", "5ire"))
      );
    },
    plan({ keys, serverPath }) {
      return [
        {
          kind: "note",
          text: `5ire configures MCP via its UI:\n${bold("Settings → Tools → MCP Servers → Add Server (Local/stdio)")}\n\nName: derabia\nCommand: node\nArgs: ${serverPath}\nEnv:\n  DERABIA_WHOIS_API_KEY=${keys.whois}\n  DERABIA_PRICING_API_KEY=${keys.pricing}`,
        },
      ];
    },
    restart: "5ire picks up MCP changes immediately — no restart needed.",
  },

  aider: {
    label: "Aider (CLI, no native MCP)",
    detect() {
      return cmdExists("aider");
    },
    plan() {
      return [
        {
          kind: "note",
          text: `${yellow("Aider does not natively support MCP")} (see issue #4506).\nUse the prompt-based fallback in ${bold("integrations/aider/README.md")} which has the LLM call the Derabia API directly via curl.\nFor a true MCP-native CLI experience, consider ${bold("OpenCode")} instead.`,
        },
      ];
    },
    restart: "n/a",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Action executor
// ─────────────────────────────────────────────────────────────────────────────

function executeActions(toolKey, actions, { dryRun }) {
  log.step(`${TOOLS[toolKey].label}`);
  for (const action of actions) {
    switch (action.kind) {
      case "mergeJson": {
        const existing = readJsonSafe(action.path) || {};
        let cursor = existing;
        for (const k of action.root) {
          if (!cursor[k] || typeof cursor[k] !== "object") cursor[k] = {};
          cursor = cursor[k];
        }
        cursor[action.key] = action.value;
        writeJsonPretty(action.path, existing, dryRun);
        break;
      }
      case "writeJson": {
        writeJsonPretty(action.path, action.value, dryRun);
        break;
      }
      case "writeText": {
        if (dryRun) {
          log.dim(`   would write ${action.path} (${action.text.length} bytes)`);
        } else {
          mkdirSync(dirname(action.path), { recursive: true });
          writeFileSync(action.path, action.text, "utf8");
          log.ok(`wrote ${action.path}`);
        }
        break;
      }
      case "copyFile": {
        if (!existsSync(action.src)) {
          log.err(`source file missing: ${action.src}`);
          break;
        }
        copyFile(action.src, action.dst, dryRun);
        break;
      }
      case "note": {
        console.log(`   ${action.text.split("\n").join("\n   ")}`);
        break;
      }
    }
  }
}

function executeUninstall(toolKey, { dryRun }) {
  log.step(`Uninstall — ${TOOLS[toolKey].label}`);
  // For uninstall we just remove the 'derabia' key from each tool's MCP config
  // and delete workflow files we copied. We need to introspect the plan to
  // know the paths, so we generate a dummy plan with empty keys.
  const fakeKeys = { whois: "", pricing: "" };
  const plan = TOOLS[toolKey].plan({ keys: fakeKeys, serverPath: SERVER_PATH });
  for (const action of plan) {
    if (action.kind === "mergeJson") {
      const existing = readJsonSafe(action.path);
      if (!existing) {
        log.dim(`   ${action.path} not present, skipping`);
        continue;
      }
      let cursor = existing;
      for (const k of action.root) {
        if (!cursor[k]) {
          cursor = null;
          break;
        }
        cursor = cursor[k];
      }
      if (cursor && action.key in cursor) {
        if (dryRun) {
          log.dim(`   would remove "${action.key}" from ${action.path}`);
        } else {
          delete cursor[action.key];
          writeJsonPretty(action.path, existing, false);
        }
      } else {
        log.dim(`   ${action.path} did not contain "${action.key}"`);
      }
    } else if (action.kind === "copyFile" || action.kind === "writeText") {
      const target = action.dst || action.path;
      if (!existsSync(target)) {
        log.dim(`   ${target} not present, skipping`);
        continue;
      }
      if (dryRun) {
        log.dim(`   would delete ${target}`);
      } else {
        try {
          unlinkSync(target);
          log.ok(`deleted ${target}`);
        } catch (e) {
          log.warn(`could not delete ${target}: ${e.message}`);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP server dependency check
// ─────────────────────────────────────────────────────────────────────────────

function ensureMcpServerReady() {
  if (!existsSync(SERVER_PATH)) {
    log.err(`MCP server not found at ${SERVER_PATH}`);
    log.err(`Are you running install.js from the dd-plugin root?`);
    process.exit(1);
  }
  const nodeModules = join(SERVER_DIR, "node_modules");
  if (existsSync(nodeModules)) return;
  log.step("Installing MCP server dependencies");
  log.info(`Running ${bold("npm install")} in ${SERVER_DIR}`);
  const result = spawnSync(IS_WIN ? "npm.cmd" : "npm", ["install"], {
    cwd: SERVER_DIR,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    log.err("npm install failed");
    process.exit(1);
  }
  log.ok("MCP server dependencies installed");
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive prompts
// ─────────────────────────────────────────────────────────────────────────────

async function promptKeys(rl) {
  const keys = {
    whois: process.env.DERABIA_WHOIS_API_KEY || "",
    pricing: process.env.DERABIA_PRICING_API_KEY || "",
  };
  if (keys.whois && keys.pricing) {
    log.ok("Found both API keys in environment.");
    return keys;
  }
  log.step("API keys");
  log.info(
    `Request keys at ${cyan("https://api.derabia.com")} (granted on request, not self-service).\n   Leave blank to skip — you can add keys later by editing the config files.`
  );
  if (!keys.whois) {
    keys.whois = (await rl.question(`${dim("?")} DERABIA_WHOIS_API_KEY: `)).trim();
  }
  if (!keys.pricing) {
    keys.pricing = (await rl.question(`${dim("?")} DERABIA_PRICING_API_KEY: `)).trim();
  }
  if (!keys.whois) keys.whois = "your_whois_api_key_here";
  if (!keys.pricing) keys.pricing = "your_pricing_api_key_here";
  return keys;
}

async function promptToolSelection(rl, detected) {
  log.step("Pick which tools to configure");
  detected.forEach((t, i) => console.log(`   ${bold(i + 1)}. ${TOOLS[t].label}`));
  console.log(`   ${bold("a")}. All detected`);
  console.log(`   ${bold("q")}. Quit`);
  const answer = (
    await rl.question(`${dim("?")} Selection (e.g. "1,3" or "a"): `)
  ).trim().toLowerCase();
  if (answer === "q" || answer === "") return [];
  if (answer === "a") return detected;
  const picks = answer
    .split(/[,\s]+/)
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= detected.length)
    .map((n) => detected[n - 1]);
  return [...new Set(picks)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  console.log(bold(cyan("\n  ┌─ dd-plugin installer ─────────────────────────┐")));
  console.log(bold(cyan("  │  Detecting installed AI coding tools…         │")));
  console.log(bold(cyan("  └───────────────────────────────────────────────┘\n")));

  // Detection
  const detected = [];
  const undetected = [];
  for (const [key, tool] of Object.entries(TOOLS)) {
    const found = !!tool.detect();
    if (found) detected.push(key);
    else undetected.push(key);
    console.log(
      `  ${found ? green("●") : gray("○")} ${found ? bold(tool.label) : gray(tool.label)}`
    );
  }
  console.log();

  if (detected.length === 0) {
    log.warn("No supported AI tools detected on this machine.");
    log.info("Install one of: Claude Code, OpenCode, Cursor, Cline, Continue.dev, Windsurf, VS Code+Copilot, Zed, Goose.");
    return;
  }

  // Determine which to install/uninstall
  let selected;
  const rl = createInterface({ input, output });
  try {
    if (args.tools) {
      selected = args.tools.filter((t) => TOOLS[t] && detected.includes(t));
      const skipped = args.tools.filter((t) => !TOOLS[t] || !detected.includes(t));
      if (skipped.length) log.warn(`Skipping (not detected or unknown): ${skipped.join(", ")}`);
    } else if (args.all) {
      selected = detected;
    } else {
      selected = await promptToolSelection(rl, detected);
    }

    if (selected.length === 0) {
      log.info("Nothing to do. Exiting.");
      return;
    }

    if (args.uninstall) {
      log.step(`Uninstalling from ${selected.length} tool(s)`);
      for (const t of selected) executeUninstall(t, { dryRun: args.dryRun });
      console.log();
      log.ok("Uninstall complete.");
      return;
    }

    // Ensure server is ready (npm install if needed)
    if (!args.dryRun) ensureMcpServerReady();

    // Get API keys
    const keys = await promptKeys(rl);

    // Execute install plan for each selected tool
    log.step(`Installing to ${selected.length} tool(s)${args.dryRun ? " (dry-run)" : ""}`);
    for (const t of selected) {
      const plan = TOOLS[t].plan({ keys, serverPath: SERVER_PATH });
      executeActions(t, plan, { dryRun: args.dryRun });
    }

    // Final summary
    console.log();
    log.step(args.dryRun ? "Dry-run complete." : "Install complete!");
    console.log(`\n  ${bold("Next steps:")}`);
    selected.forEach((t, i) => {
      console.log(`   ${bold(i + 1)}. ${TOOLS[t].label}: ${TOOLS[t].restart}`);
    });
    console.log(
      `\n  ${bold("Try it:")} ask your AI tool to ${cyan("find available domains for a fitness tracker app")}.`
    );
    if (!keys.whois || keys.whois === "your_whois_api_key_here") {
      console.log(
        `\n  ${yellow("⚠")}  You skipped the API keys. Edit the config files (or set env vars) before using ${bold("/dd")}.`
      );
    }
    console.log();
  } finally {
    rl.close();
  }
}

main().catch((e) => {
  log.err(`Installer crashed: ${e.message}`);
  if (process.env.DEBUG) console.error(e.stack);
  process.exit(1);
});
