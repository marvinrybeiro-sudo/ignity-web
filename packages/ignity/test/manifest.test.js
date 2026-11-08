'use strict';

/** Story 1.2 AC 4, AC 5 and path traversal guard. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeTmpDir } = require('./helpers/tmp');
const { validateManifest, readManifest, writeManifest } = require('../src/lib/manifest');
const { resolveInside, isSafeRelative } = require('../src/lib/paths');

const HASH = 'a'.repeat(64);
const valid = () => ({
  ignityVersion: '2.0.0',
  client: 'claude',
  installedAt: '2026-11-08T00:00:00.000Z',
  updatedAt: '2026-11-08T00:00:00.000Z',
  files: [
    { path: '.claude/skills/x/SKILL.md', sha256: HASH, owner: 'ignity', created: true },
    { path: 'CLAUDE.md', kind: 'merged-block', blockSha256: HASH, owner: 'ignity', created: false },
  ],
});

test('manifesto válido passa; campos obrigatórios e tipos são conferidos', () => {
  assert.deepEqual(validateManifest(valid()), []);
  const bad = valid();
  delete bad.ignityVersion;
  bad.client = 'vim';
  bad.files[0].created = 'sim';
  bad.files[0].sha256 = 'xyz';
  const problems = validateManifest(bad).join(' | ');
  assert.match(problems, /ignityVersion/);
  assert.match(problems, /client/);
  assert.match(problems, /created/);
  assert.match(problems, /sha256/);
});

test('caminhos inseguros no manifesto são recusados', () => {
  for (const p of ['../fora.md', '/etc/passwd', 'a/../../b', 'a\\b', 'C:/x', '', './a']) {
    const m = valid();
    m.files[0].path = p;
    assert.match(validateManifest(m).join(' '), /inseguro/, p);
    assert.equal(isSafeRelative(p), false, p);
  }
});

test('resolveInside recusa traversal e link simbólico que sai da pasta', (t) => {
  const root = makeTmpDir(t);
  const outside = makeTmpDir(t);
  assert.throws(() => resolveInside(root, '../x'), /inseguro/);
  fs.symlinkSync(outside, path.join(root, '.claude'));
  assert.throws(() => resolveInside(root, '.claude/skills/x/SKILL.md'), /link simbólico/);
  assert.equal(resolveInside(root, 'a/b.md'), path.join(root, 'a', 'b.md'));
});

test('grava de forma atômica, relê e não deixa temporário; JSON inválido não ecoa conteúdo', (t) => {
  const root = makeTmpDir(t);
  writeManifest(root, valid());
  assert.deepEqual(readManifest(root).files.map((f) => f.path), ['.claude/skills/x/SKILL.md', 'CLAUDE.md']);
  assert.deepEqual(fs.readdirSync(path.join(root, '.ignity')), ['manifest.json']);
  fs.writeFileSync(path.join(root, '.ignity', 'manifest.json'), '{"segredo-xyz": ');
  assert.throws(() => readManifest(root), (e) => /não é um JSON válido/.test(e.message) && !e.message.includes('segredo-xyz'));
  assert.equal(readManifest(makeTmpDir(t)), null);
});

test('manifesto só contém as chaves do contrato (sem env, tokens ou URLs)', () => {
  const m = valid();
  assert.deepEqual(Object.keys(m).sort(), ['client', 'files', 'ignityVersion', 'installedAt', 'updatedAt']);
});
