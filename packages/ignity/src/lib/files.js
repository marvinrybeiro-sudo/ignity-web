'use strict';

/**
 * File helpers used at runtime by the CLI. Mirrors scripts/lib/fs-utils.js
 * (listFiles/sha256), which is not shipped in the npm package (`files` in
 * package.json), plus atomic writes.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

/** Every regular file under `root` as sorted POSIX relative paths. Symlinks are skipped. */
function listFiles(root) {
  const out = [];
  (function walk(dir) {
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, dirent.name);
      if (dirent.isDirectory()) walk(abs);
      else if (dirent.isFile()) out.push(path.relative(root, abs).split(path.sep).join('/'));
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

/** Returns the file content (Buffer, or string if `encoding`) or null if it does not exist. */
function readIfExists(file, encoding) {
  try {
    return fs.readFileSync(file, encoding);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

/** Writes via a temp file in the same directory + rename, so readers never see a partial file. */
function atomicWriteFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Rename over a symlink would replace the link itself. The caller validates
  // its destination inside the project; write atomically to that destination.
  let target = file;
  try {
    if (fs.lstatSync(file).isSymbolicLink()) target = fs.realpathSync(file);
  } catch (error) {
    if (error.code !== 'ENOENT' || fs.existsSync(file)) throw error;
    // A dangling link is not a new file and must never be silently replaced.
    try {
      if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Link simbólico sem destino recusado.');
    } catch (inner) {
      if (inner.code !== 'ENOENT') throw inner;
    }
  }
  const tmp = path.join(path.dirname(target), `.${path.basename(target)}.ignity-tmp-${process.pid}`);
  try {
    let mode;
    try {
      mode = fs.statSync(target).mode & 0o7777;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      mode = 0o666 & ~process.umask();
    }
    // Keep the temporary file private until its final permissions are set.
    const fd = fs.openSync(tmp, 'w', 0o600);
    try {
      fs.fchmodSync(fd, 0o600);
      fs.writeFileSync(fd, data);
      fs.fchmodSync(fd, mode);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, target);
  } catch (error) {
    fs.rmSync(tmp, { force: true });
    throw error;
  }
}

module.exports = { listFiles, sha256, sha256File, readIfExists, atomicWriteFile };
