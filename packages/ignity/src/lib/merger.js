'use strict';

/**
 * AC 8 and AC 10: merges the Ignity block into CLAUDE.md / AGENTS.md.
 * Only the text between the markers is ever owned by Ignity; everything else is
 * preserved byte for byte. The original line ending (LF or CRLF) is kept.
 */

const START = '<!-- IGNITY:START -->';
const END = '<!-- IGNITY:END -->';

function detectEol(text) {
  return typeof text === 'string' && text.includes('\r\n') ? '\r\n' : '\n';
}

function normalizeBody(body, eol) {
  return body.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n').join(eol);
}

/** Locates the marker pair. Returns null without markers; throws when they are malformed. */
function findBlock(text) {
  const starts = text.split(START).length - 1;
  const ends = text.split(END).length - 1;
  if (starts === 0 && ends === 0) return null;
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  if (starts !== 1 || ends !== 1 || end < start) {
    throw new Error(
      `Marcadores ${START} / ${END} malformados (esperado um par, nesta ordem). ` +
        'Corrija o arquivo à mão, deixando um único par ou nenhum, e rode o comando de novo.',
    );
  }
  return { start, end: end + END.length };
}

function hasBlock(text) {
  return typeof text === 'string' && findBlock(text) !== null;
}

function renderBlock(body, eol) {
  return `${START}${eol}${normalizeBody(body, eol)}${eol}${END}`;
}

/**
 * @param {string|null} existing current file content (null when the file does not exist)
 * @param {string} body adapter content
 * @returns {string} new file content
 */
function upsertBlock(existing, body) {
  if (existing === null || existing === undefined || existing === '') return `${renderBlock(body, '\n')}\n`;
  const eol = detectEol(existing);
  const block = findBlock(existing);
  if (block) return existing.slice(0, block.start) + renderBlock(body, eol) + existing.slice(block.end);
  const sep = existing.endsWith('\n') ? eol : eol + eol;
  return `${existing}${sep}${renderBlock(body, eol)}${eol}`;
}

/** Replaces the first occurrence of `oldText` (LF or CRLF variant) with the block. Returns null if absent. */
function replaceTextWithBlock(existing, oldText, body) {
  const eol = detectEol(existing);
  for (const candidate of [oldText, oldText.replace(/\r?\n/g, '\r\n')]) {
    const idx = existing.indexOf(candidate);
    if (idx < 0) continue;
    const trailing = candidate.endsWith('\n') ? eol : '';
    return existing.slice(0, idx) + renderBlock(body, eol) + trailing + existing.slice(idx + candidate.length);
  }
  return null;
}

/** Removes the block (and the blank separator line the merger added). Returns the text unchanged without markers. */
function removeBlock(existing) {
  const block = findBlock(existing);
  if (!block) return existing;
  const eol = detectEol(existing);
  let before = existing.slice(0, block.start);
  let after = existing.slice(block.end);
  if (after.startsWith(eol)) after = after.slice(eol.length);
  else if (after.startsWith('\n')) after = after.slice(1);
  if (after === '' && before.endsWith(eol + eol)) before = before.slice(0, -eol.length);
  return before + after;
}

/** Body between the markers (LF-normalized) or null. */
function extractBody(existing) {
  if (typeof existing !== 'string') return null;
  const block = findBlock(existing);
  if (!block) return null;
  return existing
    .slice(block.start + START.length, block.end - END.length)
    .replace(/\r\n/g, '\n')
    .replace(/^\n/, '')
    .replace(/\n$/, '');
}

module.exports = { START, END, upsertBlock, removeBlock, replaceTextWithBlock, extractBody, hasBlock, normalizeBody };
