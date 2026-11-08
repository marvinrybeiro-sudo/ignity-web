'use strict';

/** Story 1.2 AC 13, 13a, 14: v1 detection (complete and partial) and migration variants. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeTmpDir } = require('./helpers/tmp');
const { runCli } = require('./helpers/run-cli');
const { materializeV1Install, loadV1Manifest, V1_ROOT } = require('./helpers/v1-install');
const { snapshotTree } = require('./helpers/tree');
const { detectV1, V1_DATA } = require('../src/lib/v1-detect');
const { START, END } = require('../src/lib/merger');

function setup(t) {
  const root = makeTmpDir(t);
  const project = path.join(root, 'p');
  const home = path.join(root, 'h');
  fs.mkdirSync(project);
  fs.mkdirSync(home);
  return { project, cli: (args) => runCli(args, { cwd: project, home }) };
}

const exists = (project, rel) => fs.existsSync(path.join(project, rel));
const read = (project, rel) => fs.readFileSync(path.join(project, rel), 'utf8');

test('src/data/v1-hashes.json reproduz o fixture e o texto dos adapters v1', () => {
  const fixture = loadV1Manifest();
  assert.deepEqual(V1_DATA.files, Object.fromEntries(fixture.files.map((f) => [f.path, f.sha256])));
  for (const name of ['CLAUDE.md', 'AGENTS.md']) {
    assert.equal(V1_DATA.adapters[name].text, fs.readFileSync(path.join(V1_ROOT, 'adapters', name), 'utf8'));
    assert.equal(V1_DATA.adapters[name].sha256, V1_DATA.files[name]);
  }
});

test('detectV1: completa, só skill, só framework, nenhuma', (t) => {
  const { project } = setup(t);
  assert.equal(detectV1(project).detected, false);
  materializeV1Install(project);
  const full = detectV1(project);
  assert.equal(full.detected, true);
  assert.equal(full.skillSignals.length, 2);
  assert.equal(full.frameworkSignal, true);
  fs.rmSync(path.join(project, 'project', 'framework'), { recursive: true });
  assert.deepEqual([detectV1(project).detected, detectV1(project).frameworkSignal], [true, false]);
});

test('AC 13a: só a skill v1 (sem project/framework/FRAMEWORK.md) migra e diz qual sinal faltou', (t) => {
  const { project, cli } = setup(t);
  materializeV1Install(project);
  fs.rmSync(path.join(project, 'project', 'framework'), { recursive: true });
  const before = snapshotTree(path.join(project, 'project'));
  const r = cli(['update']);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /sinal encontrado: .*web-orchestrator\/SKILL\.md/);
  assert.match(r.stdout, /sinal ausente: project\/framework\/FRAMEWORK\.md/);
  assert.ok(exists(project, '.ignity/manifest.json'));
  assert.deepEqual(snapshotTree(path.join(project, 'project')), before);
  const doctor = cli(['doctor']);
  assert.match(doctor.stdout, /\[OK\] v1-framework/);
});

test('AC 13a: só project/framework/FRAMEWORK.md instala skills do zero, avisa e não toca project/', (t) => {
  const { project, cli } = setup(t);
  materializeV1Install(project);
  for (const dir of ['.claude', '.agents']) fs.rmSync(path.join(project, dir), { recursive: true });
  fs.rmSync(path.join(project, 'AGENTS.md'));
  const before = snapshotTree(path.join(project, 'project'));
  const r = cli(['update']);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /sinal ausente: \{\.claude\|\.agents\}/);
  assert.match(r.stdout, /sinal encontrado: project\/framework\/FRAMEWORK\.md/);
  assert.match(r.stdout, /skills v1 não encontradas/);
  assert.ok(exists(project, '.claude/skills/web-orchestrator/SKILL.md'));
  assert.ok(exists(project, '.agents/skills/web-orchestrator/SKILL.md'), 'sem sinais de cliente, padrão both');
  assert.deepEqual(snapshotTree(path.join(project, 'project')), before);
  assert.match(cli(['doctor']).stdout, /\[INFO\] v1-framework: project\/framework\/FRAMEWORK\.md .*obsoleto/);
});

test('AC 13: CLAUDE.md mesclado à mão com o texto v1 → só o trecho v1 vira bloco', (t) => {
  const { project, cli } = setup(t);
  materializeV1Install(project);
  const v1 = read(project, 'CLAUDE.md');
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), `# Regras minhas\n\n${v1}\n## Mais regras\n`);
  const r = cli(['update']);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const after = read(project, 'CLAUDE.md');
  assert.ok(after.startsWith(`# Regras minhas\n\n${START}\n`));
  assert.ok(after.endsWith(`${END}\n\n## Mais regras\n`));
  assert.equal(after.includes('Guia: `project/framework/FRAMEWORK.md`.'), false);
  const backups = Object.keys(snapshotTree(path.join(project, '.ignity', 'backups')));
  assert.ok(backups.some((k) => k.endsWith('/CLAUDE.md')), 'CLAUDE.md sem backup antes da troca');
});

test('AC 13: adapter sem o texto v1 → bloco anexado com aviso; skill v1 alterada → backup', (t) => {
  const { project, cli } = setup(t);
  materializeV1Install(project);
  fs.writeFileSync(path.join(project, 'AGENTS.md'), '# Só meu\n');
  fs.appendFileSync(path.join(project, '.claude', 'skills', 'web-seo', 'SKILL.md'), '\nnota minha\n');
  const r = cli(['update']);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /AGENTS\.md não contém o texto do adapter v1/);
  assert.match(r.stdout, /AVISO: \.claude\/skills\/web-seo\/SKILL\.md foi alterado/);
  assert.ok(read(project, 'AGENTS.md').startsWith(`# Só meu\n\n${START}`));
  const backups = Object.keys(snapshotTree(path.join(project, '.ignity', 'backups')));
  assert.ok(backups.some((k) => k.endsWith('.claude/skills/web-seo/SKILL.md')));
  assert.ok(backups.some((k) => k.endsWith('/AGENTS.md')));
});

test('AC 14: update sem manifesto e sem sinais v1 sai com exit 1 e sugere init', (t) => {
  const { cli } = setup(t);
  const r = cli(['update']);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /ignity-web init/);
});
