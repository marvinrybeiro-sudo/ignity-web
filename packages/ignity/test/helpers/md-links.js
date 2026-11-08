'use strict';

const fs = require('node:fs');
const path = require('node:path');

const INLINE_LINK = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const REFERENCE_DEF = /^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s+.*)?$/gm;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/** Strips fenced code blocks and inline code so example links are not checked. */
function stripCode(text) {
  return text.replace(/^```[\s\S]*?^```/gm, '').replace(/`[^`\n]*`/g, '');
}

/**
 * Returns the local Markdown link targets of `file` that do not resolve to an
 * existing path inside `root`.
 */
function brokenLocalLinks(file, root) {
  const text = stripCode(fs.readFileSync(file, 'utf8'));
  const targets = [...text.matchAll(INLINE_LINK), ...text.matchAll(REFERENCE_DEF)].map((m) => m[1]);
  const broken = [];
  for (const target of targets) {
    if (EXTERNAL.test(target)) continue;
    const clean = decodeURIComponent(target.split('#')[0].split('?')[0]);
    if (clean === '') continue;
    const resolved = path.resolve(path.dirname(file), clean);
    const inside = resolved === root || resolved.startsWith(root + path.sep);
    if (!inside || !fs.existsSync(resolved)) broken.push(target);
  }
  return broken;
}

module.exports = { brokenLocalLinks };
