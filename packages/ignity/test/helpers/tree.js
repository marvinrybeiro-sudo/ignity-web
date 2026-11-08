'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { listFiles, sha256File } = require('../../scripts/lib/fs-utils');

/** Map of relative POSIX path -> SHA-256 for every file under `root` (empty if absent). */
function snapshotTree(root) {
  if (!fs.existsSync(root)) return {};
  const snap = {};
  for (const rel of listFiles(root)) snap[rel] = sha256File(path.join(root, rel));
  return snap;
}

/** Concatenated text of every file under `root`, for leak searches. */
function readAllText(root) {
  if (!fs.existsSync(root)) return '';
  return listFiles(root)
    .map((rel) => fs.readFileSync(path.join(root, rel), 'utf8'))
    .join('\n');
}

module.exports = { snapshotTree, readAllText };
