'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * AC 3: `.claude/` -> claude; `.agents/` or `AGENTS.md` -> codex; both -> both; none -> both (v1 default).
 * @param {string} root
 * @returns {'claude'|'codex'|'both'}
 */
function detectClient(root) {
  const claude = fs.existsSync(path.join(root, '.claude'));
  const codex = fs.existsSync(path.join(root, '.agents')) || fs.existsSync(path.join(root, 'AGENTS.md'));
  if (claude && !codex) return 'claude';
  if (codex && !claude) return 'codex';
  return 'both';
}

module.exports = { detectClient };
