'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeTmpDir } = require('./helpers/tmp');
const { atomicWriteFile } = require('../src/lib/files');
const { createBackup } = require('../src/lib/backup');

test('escrita atômica e backup preservam permissões de arquivo privado', { skip: process.platform === 'win32' }, (t) => {
  const root = makeTmpDir(t);
  const file = path.join(root, 'CLAUDE.md');
  fs.writeFileSync(file, 'privado', { mode: 0o600 });
  fs.chmodSync(file, 0o600);
  const oldUmask = process.umask(0);
  try {
    const backup = createBackup({ root, dryRun: false, out: { line() {} } });
    const backupPath = path.join(root, backup.save('CLAUDE.md'));
    atomicWriteFile(file, 'atualizado');
    assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    assert.equal(fs.statSync(backupPath).mode & 0o777, 0o600);
    assert.equal(fs.readFileSync(backupPath, 'utf8'), 'privado');
  } finally {
    process.umask(oldUmask);
  }
});
