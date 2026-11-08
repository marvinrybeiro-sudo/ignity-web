'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/**
 * Creates a fresh directory inside the system temp dir and removes it when the
 * test (or suite) owning `t` finishes. Every test writes only inside these dirs.
 */
function makeTmpDir(t, prefix = 'ignity-test-') {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

module.exports = { makeTmpDir };
