'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

/**
 * Lists every regular file under `root`, returning POSIX paths relative to `root`,
 * sorted by byte order. Symlinks and other special files are rejected.
 */
function listFiles(root) {
  const out = [];
  (function walk(dir) {
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, dirent.name);
      if (dirent.isDirectory()) walk(abs);
      else if (dirent.isFile()) out.push(path.relative(root, abs).split(path.sep).join('/'));
      else throw new Error(`Unsupported file type (not a regular file): ${abs}`);
    }
  })(root);
  return out.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function sha256File(file) {
  return sha256(fs.readFileSync(file));
}

module.exports = { listFiles, sha256, sha256File };
