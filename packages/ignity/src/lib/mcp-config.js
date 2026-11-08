'use strict';

/**
 * AC 17: reads ONLY server names from MCP client configs. Values of env, headers,
 * args and URLs are never returned, so they can never reach the output (Q-04).
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function namesFromJson(text, projectRoot) {
  const data = JSON.parse(text);
  const names = [];
  const take = (servers) => {
    if (servers && typeof servers === 'object' && !Array.isArray(servers)) names.push(...Object.keys(servers));
  };
  take(data && data.mcpServers);
  // ~/.claude.json keeps per-project servers under projects[<abs path>].mcpServers.
  if (projectRoot && data && data.projects && typeof data.projects === 'object') {
    const entry = data.projects[projectRoot];
    take(entry && entry.mcpServers);
  }
  return names;
}

const TOML_TABLE = /^\s*\[\s*mcp_servers\.(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_-]+))/;

function namesFromToml(text) {
  const names = [];
  for (const line of text.split(/\r?\n/)) {
    const m = TOML_TABLE.exec(line);
    if (m) names.push(m[1] || m[2] || m[3]);
  }
  return names;
}

/** Config files that may declare MCP servers, per client. Labels use `~` instead of the home path. */
function mcpSources(root, client, home = os.homedir()) {
  const sources = [];
  if (client === 'claude' || client === 'both') {
    sources.push({ label: '.mcp.json', file: path.join(root, '.mcp.json'), format: 'json' });
    sources.push({ label: '~/.claude.json', file: path.join(home, '.claude.json'), format: 'json', projectRoot: root });
  }
  if (client === 'codex' || client === 'both') {
    sources.push({ label: '.codex/config.toml', file: path.join(root, '.codex', 'config.toml'), format: 'toml' });
    sources.push({ label: '~/.codex/config.toml', file: path.join(home, '.codex', 'config.toml'), format: 'toml' });
  }
  return sources;
}

/**
 * @returns {{label: string, exists: boolean, readable: boolean, names: string[]}[]}
 */
function readMcpServerNames(root, client, home) {
  return mcpSources(root, client, home).map((src) => {
    if (!fs.existsSync(src.file)) return { label: src.label, exists: false, readable: false, names: [] };
    try {
      const text = fs.readFileSync(src.file, 'utf8');
      const names = src.format === 'json' ? namesFromJson(text, src.projectRoot) : namesFromToml(text);
      return { label: src.label, exists: true, readable: true, names: [...new Set(names)] };
    } catch {
      // Parser errors may quote file content (and secrets): never propagate them.
      return { label: src.label, exists: true, readable: false, names: [] };
    }
  });
}

module.exports = { readMcpServerNames, mcpSources, namesFromJson, namesFromToml };
