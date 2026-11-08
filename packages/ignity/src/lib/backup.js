'use strict';

/** AC 9: copies a file to .ignity/backups/{timestamp}/{path} before it is changed or removed. */

const fs = require('node:fs');
const path = require('node:path');
const { BACKUPS_DIR, resolveInside } = require('./paths');

function timestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

/**
 * One backup folder per run, created lazily on the first saved file.
 * @param {{root: string, dryRun: boolean, out: object, now?: Date}} options
 */
function createBackup({ root, dryRun, out, now = new Date() }) {
  const dir = `${BACKUPS_DIR}/${timestamp(now)}`;
  let count = 0;
  return {
    dir,
    get count() {
      return count;
    },
    /** @returns {string} relative path of the backup copy */
    save(rel) {
      const target = `${dir}/${rel}`;
      if (dryRun) {
        out.line(`PREVER CRIAR ${target} (backup)`);
      } else {
        const dest = resolveInside(root, target);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const source = resolveInside(root, rel);
        const mode = fs.statSync(source).mode & 0o7777;
        // Create or tighten the destination before copying private contents.
        const fd = fs.openSync(dest, 'w', 0o600);
        try {
          fs.fchmodSync(fd, 0o600);
        } finally {
          fs.closeSync(fd);
        }
        fs.copyFileSync(source, dest);
        fs.chmodSync(dest, mode);
        out.line(`BACKUP ${rel} -> ${target}`);
      }
      count++;
      return target;
    },
  };
}

module.exports = { createBackup, timestamp };
