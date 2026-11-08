'use strict';

/** AC 3: the v1 fixture is complete (29 files in `both` mode) and reproducible. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { makeTmpDir } = require('./helpers/tmp');
const { materializeV1Install, loadV1Manifest, FIXTURE } = require('./helpers/v1-install');
const { snapshotTree } = require('./helpers/tree');

const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'snapshot-v1.js');

test('fixture v1 lista os 29 arquivos do modo both com SHA-256', () => {
  const manifest = loadV1Manifest();
  assert.equal(manifest.mode, 'both');
  assert.equal(manifest.files.length, 29);
  assert.equal(manifest.count, 29);
  const paths = manifest.files.map((f) => f.path);
  assert.equal(new Set(paths).size, 29, 'caminhos duplicados');
  for (const f of manifest.files) assert.match(f.sha256, /^[0-9a-f]{64}$/, f.path);
  assert.equal(paths.filter((p) => p.startsWith('.claude/skills/')).length, 9);
  assert.equal(paths.filter((p) => p.startsWith('.agents/skills/')).length, 9);
  assert.ok(paths.includes('CLAUDE.md') && paths.includes('AGENTS.md'));
  assert.equal(paths.filter((p) => /^project\/[^/]+$/.test(p)).length, 8);
  assert.ok(paths.includes('project/framework/FRAMEWORK.md'));
});

test('snapshot-v1.js é reprodutível: regenerar não altera o fixture', (t) => {
  const out = path.join(makeTmpDir(t), 'v1-manifest.json');
  const run = () => spawnSync(process.execPath, [SCRIPT, '--out', out], { encoding: 'utf8' });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const generated = fs.readFileSync(out);
  assert.ok(generated.equals(fs.readFileSync(FIXTURE)), 'fixture versionado difere do gerado');
  assert.equal(run().status, 0);
  assert.ok(fs.readFileSync(out).equals(generated), 'segunda execução gerou bytes diferentes');
});

test('helper materializa uma instalação v1 com os hashes do fixture', (t) => {
  const dest = makeTmpDir(t);
  materializeV1Install(dest);
  const expected = Object.fromEntries(loadV1Manifest().files.map((f) => [f.path, f.sha256]));
  assert.deepEqual(snapshotTree(dest), expected);
});
