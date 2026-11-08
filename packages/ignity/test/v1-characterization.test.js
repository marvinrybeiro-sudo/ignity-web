'use strict';

/**
 * AC 7: characterization of the v1 installer failures that Story 1.2 fixes.
 * These tests document CURRENT (buggy) behaviour on purpose:
 *   SYS-01 — any edited file in project/ aborts the whole reinstall (exit 2);
 *   SYS-02 — a project-owned CLAUDE.md aborts the first install (exit 2).
 * The v1 kit is only read; the installer always writes into a temp dir.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { makeTmpDir } = require('./helpers/tmp');
const { V1_ROOT } = require('./helpers/v1-install');
const { listFiles } = require('../scripts/lib/fs-utils');

const INSTALLER = path.join(V1_ROOT, 'scripts', 'instalar.py');
const ABORT_MESSAGE = 'Nenhum arquivo foi copiado';

function findPython() {
  for (const bin of ['python3']) {
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8' });
    if (!r.error && r.status === 0) return bin;
  }
  return null;
}

const PYTHON = findPython();
let skip = false;
if (!fs.existsSync(INSTALLER)) skip = `instalar.py v1 ausente em ${INSTALLER}: caracterização pulada`;
else if (!PYTHON) skip = 'python3 não encontrado no PATH: caracterização do instalar.py v1 pulada';
if (skip) process.emitWarning(skip);

function install(dest) {
  // -B: never write __pycache__ next to the frozen v1 script.
  return spawnSync(PYTHON, ['-B', INSTALLER, '--dest', dest, '--client', 'both'], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH || '', PYTHONDONTWRITEBYTECODE: '1' },
  });
}

test('SYS-01: com project/STATE.md modificado, o v1 aborta com exit 2 e não copia nada', { skip }, (t) => {
  const dest = makeTmpDir(t);
  const first = install(dest);
  assert.equal(first.status, 0, first.stderr);

  fs.appendFileSync(path.join(dest, 'project', 'STATE.md'), '\nEstado editado pelo projeto.\n');
  // A missing skill file would be recreated by a working reinstall; v1 must not touch it.
  const removed = path.join(dest, '.claude', 'skills', 'web-qa', 'SKILL.md');
  fs.rmSync(removed);
  const before = listFiles(dest);

  const second = install(dest);
  assert.equal(second.status, 2);
  assert.match(second.stdout, new RegExp(ABORT_MESSAGE));
  assert.match(second.stdout, /project[\\/]STATE\.md/);
  assert.equal(fs.existsSync(removed), false, 'v1 recriou arquivo apesar do conflito');
  assert.deepEqual(listFiles(dest), before);
});

test('SYS-02: com CLAUDE.md próprio na raiz, o v1 aborta com exit 2 e nada é instalado', { skip }, (t) => {
  const dest = makeTmpDir(t);
  const own = '# Meu projeto\n\nRegras próprias do projeto.\n';
  fs.writeFileSync(path.join(dest, 'CLAUDE.md'), own);

  const r = install(dest);
  assert.equal(r.status, 2);
  assert.match(r.stdout, new RegExp(ABORT_MESSAGE));
  assert.match(r.stdout, /CLAUDE\.md/);
  assert.deepEqual(listFiles(dest), ['CLAUDE.md']);
  assert.equal(fs.readFileSync(path.join(dest, 'CLAUDE.md'), 'utf8'), own);
});
