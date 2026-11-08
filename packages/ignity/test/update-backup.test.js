'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { makeTmpDir } = require('./helpers/tmp');
const { runCli } = require('./helpers/run-cli');
const { snapshotTree } = require('./helpers/tree');

test('update preserva backup da versão anterior íntegra antes de substituí-la', (t) => {
  const root = makeTmpDir(t);
  const project = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(project);
  fs.mkdirSync(home);
  const cli = (args) => runCli(args, { cwd: project, home });
  assert.equal(cli(['init', '--client', 'claude']).code, 0);
  const rel = '.claude/skills/web-qa/SKILL.md';
  const original = 'Conteúdo íntegro de uma versão anterior.\n';
  fs.writeFileSync(path.join(project, rel), original);
  const manifestPath = path.join(project, '.ignity/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.files.find((entry) => entry.path === rel).sha256 = createHash('sha256').update(original).digest('hex');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const result = cli(['update']);
  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /foi alterado fora do Ignity/);
  const backups = path.join(project, '.ignity/backups');
  const backupFile = Object.keys(snapshotTree(backups)).find((name) => name.endsWith(rel));
  assert.ok(backupFile);
  assert.equal(fs.readFileSync(path.join(backups, backupFile), 'utf8'), original);
});

test('dicas de update e doctor copiam para --dir, inclusive com aspas no caminho', (t) => {
  const root = makeTmpDir(t);
  const project = path.join(root, "projeto com 'aspas'");
  const home = path.join(root, 'home');
  fs.mkdirSync(project);
  fs.mkdirSync(home);
  const cli = (args) => runCli(args, { cwd: root, home });
  assert.equal(cli(['init', '--dir', project, '--client', 'claude']).code, 0);
  const dest = path.join(project, 'project', 'SECTIONS.md');
  for (const command of ['update', 'doctor']) {
    fs.unlinkSync(dest);
    const result = cli([command, '--dir', project]);
    assert.equal(result.code, 0, result.stderr);
    const hint = result.stdout.match(/cp '[^\n]+?\.md' '[^\n]+?\.md'/);
    assert.ok(hint, result.stdout);
    execFileSync('/bin/sh', ['-c', hint[0]], { cwd: root });
    assert.ok(fs.existsSync(dest));
  }
});
