'use strict';

/**
 * Minimal frontmatter parser for SKILL.md: only flat `key: value` lines between
 * the opening and closing `---`. No YAML dependency (PyYAML blocked the v1 validator).
 *
 * @param {string} text
 * @returns {{data: Record<string, string>, keys: string[]}}
 */
function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) throw new Error('missing opening frontmatter delimiter');
  const end = normalized.indexOf('\n---\n', 4);
  if (end < 0) throw new Error('missing closing frontmatter delimiter');
  const data = {};
  const keys = [];
  for (const line of normalized.slice(4, end).split('\n')) {
    if (line.trim() === '') continue;
    const match = /^([A-Za-z0-9_-]+):\s?(.*)$/.exec(line);
    if (!match) throw new Error(`unsupported frontmatter line: ${JSON.stringify(line)}`);
    const [, key, raw] = match;
    if (key in data) throw new Error(`duplicate frontmatter key: ${key}`);
    let value = raw.trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    data[key] = value;
    keys.push(key);
  }
  return { data, keys };
}

module.exports = { parseFrontmatter };
