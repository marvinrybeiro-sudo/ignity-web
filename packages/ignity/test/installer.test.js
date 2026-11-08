'use strict';

/**
 * AC 6: acceptance tests for the `ignity` CLI (QA scenarios 1-6, docs/reviews/qa-review.md).
 *
 * The CLI (bin/ignity.js) is delivered by Story 1.2. While it does not exist, each
 * scenario is registered as `todo` so the suite exits 0 and the report lists what is
 * still missing to close G2. As soon as bin/ignity.js exists they run for real.
 *
 * Contract used here comes from Story 1.2 ACs: `.ignity/manifest.json` with files[]
 * ({path, sha256, owner, created, kind?}), markers `<!-- IGNITY:START -->` /
 * `<!-- IGNITY:END -->`, `.ignity/framework/FRAMEWORK.md`, `.ignity/backups/`.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeTmpDir } = require('./helpers/tmp');
const { runCli, cliExists, PKG_ROOT } = require('./helpers/run-cli');
const { materializeV1Install } = require('./helpers/v1-install');
const { snapshotTree, readAllText } = require('./helpers/tree');
const { listFiles } = require('../scripts/lib/fs-utils');

const CONTENT = path.join(PKG_ROOT, 'content');
const START = '<!-- IGNITY:START -->';
const END = '<!-- IGNITY:END -->';
const SENTINEL = 'ignity-sentinel-7f3a';
const TODO_REASON = 'pendente: bin/ignity.js é entregue pela Story 1.2';

/** Registers a scenario as `todo` (no execution) while the CLI is missing. */
function scenario(name, fn) {
  if (cliExists()) test(name, fn);
  else test.todo(`${name} [${TODO_REASON}]`);
}

function setup(t) {
  const root = makeTmpDir(t);
  const project = path.join(root, 'project-dir');
  const home = path.join(root, 'home');
  fs.mkdirSync(project);
  fs.mkdirSync(home);
  const cli = (args, env) => runCli(args, { cwd: project, home, env });
  return { project, home, cli };
}

function readManifest(project) {
  return JSON.parse(fs.readFileSync(path.join(project, '.ignity', 'manifest.json'), 'utf8'));
}

function assertOk(r, label) {
  assert.equal(r.code, 0, `${label} falhou (exit ${r.code})\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
}

function assertSkillsMatchContent(project, folder) {
  const expected = snapshotTree(path.join(CONTENT, 'skills'));
  const installed = snapshotTree(path.join(project, folder, 'skills'));
  for (const [rel, hash] of Object.entries(expected)) assert.equal(installed[rel], hash, `${folder}/skills/${rel}`);
}

function countMarkers(text) {
  return { start: text.split(START).length - 1, end: text.split(END).length - 1 };
}

scenario('cenário 1: init em pasta vazia cria skills, project/ e manifesto', (t) => {
  const { project, cli } = setup(t);
  assertOk(cli(['init', '--client', 'both']), 'init');

  assertSkillsMatchContent(project, '.claude');
  assertSkillsMatchContent(project, '.agents');
  for (const tpl of listFiles(path.join(CONTENT, 'templates'))) {
    assert.ok(fs.existsSync(path.join(project, 'project', tpl)), `project/${tpl} ausente`);
  }
  assert.ok(fs.existsSync(path.join(project, '.ignity', 'framework', 'FRAMEWORK.md')));
  for (const adapter of ['CLAUDE.md', 'AGENTS.md']) {
    assert.deepEqual(countMarkers(fs.readFileSync(path.join(project, adapter), 'utf8')), { start: 1, end: 1 }, adapter);
  }

  const manifest = readManifest(project);
  for (const key of ['ignityVersion', 'client', 'installedAt', 'updatedAt']) assert.ok(manifest[key], `manifesto sem ${key}`);
  assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0);
  for (const f of manifest.files) {
    assert.equal(f.owner, 'ignity', f.path);
    assert.equal(typeof f.created, 'boolean', f.path);
    assert.ok(!path.isAbsolute(f.path) && !f.path.split('/').includes('..'), `caminho inseguro: ${f.path}`);
    if (f.kind !== 'merged-block') assert.match(f.sha256, /^[0-9a-f]{64}$/, f.path);
  }
});

scenario('cenário 2: init com CLAUDE.md próprio mescla com marcadores, preserva o original e é idempotente', (t) => {
  const { project, cli } = setup(t);
  const own = '# Meu projeto\n\nRegra própria: responder em português.\n';
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), own);

  assertOk(cli(['init', '--client', 'claude']), 'init #1');
  const merged = fs.readFileSync(path.join(project, 'CLAUDE.md'), 'utf8');
  assert.ok(merged.startsWith(own), 'conteúdo original não preservado byte a byte no início');
  assert.deepEqual(countMarkers(merged), { start: 1, end: 1 });
  assert.ok(merged.indexOf(START) > own.length - 1 && merged.indexOf(END) > merged.indexOf(START));
  const entry = readManifest(project).files.find((f) => f.path === 'CLAUDE.md');
  assert.equal(entry && entry.kind, 'merged-block');

  const before = snapshotTree(project);
  const backupsBefore = snapshotTree(path.join(project, '.ignity', 'backups'));
  assertOk(cli(['init', '--client', 'claude']), 'init #2');
  const after = snapshotTree(project);
  // The manifest may refresh `updatedAt`; everything else must be byte-identical.
  delete before['.ignity/manifest.json'];
  delete after['.ignity/manifest.json'];
  assert.deepEqual(after, before, 'segunda execução gerou diff');
  assert.deepEqual(snapshotTree(path.join(project, '.ignity', 'backups')), backupsBefore, 'backup novo sem mudança');
});

scenario('cenário 3: update com project/STATE.md editado atualiza skills e não toca project/', (t) => {
  const { project, cli } = setup(t);
  assertOk(cli(['init', '--client', 'both']), 'init');

  fs.appendFileSync(path.join(project, 'project', 'STATE.md'), '\nEstado do projeto em andamento.\n');
  fs.writeFileSync(path.join(project, 'project', 'NOTAS.md'), 'arquivo do usuário\n');
  const skillFile = path.join(project, '.claude', 'skills', 'web-qa', 'SKILL.md');
  fs.writeFileSync(skillFile, 'versão antiga da skill\n');
  const projectBefore = snapshotTree(path.join(project, 'project'));

  const r = cli(['update']);
  assertOk(r, 'update');
  assert.deepEqual(snapshotTree(path.join(project, 'project')), projectBefore, 'update alterou project/');
  assertSkillsMatchContent(project, '.claude');
  assertSkillsMatchContent(project, '.agents');
  assert.match(r.stdout + r.stderr, /web-qa/, 'sem aviso nominal da skill alterada');
  assert.ok(Object.keys(snapshotTree(path.join(project, '.ignity', 'backups'))).length > 0, 'skill alterada sem backup');
});

scenario('cenário 4: update sobre instalação v1 (sem manifesto) detecta e migra', (t) => {
  const { project, cli } = setup(t);
  materializeV1Install(project);
  fs.appendFileSync(path.join(project, 'project', 'STATE.md'), '\nTrabalho feito no v1.\n');
  const projectBefore = snapshotTree(path.join(project, 'project'));
  assert.equal(fs.existsSync(path.join(project, '.ignity', 'manifest.json')), false);

  assertOk(cli(['update']), 'update (migração v1)');
  assert.ok(fs.existsSync(path.join(project, '.ignity', 'manifest.json')), 'manifesto v2 não criado');
  assert.deepEqual(snapshotTree(path.join(project, 'project')), projectBefore, 'migração alterou project/');
  assertSkillsMatchContent(project, '.claude');
  assertSkillsMatchContent(project, '.agents');
  for (const adapter of ['CLAUDE.md', 'AGENTS.md']) {
    assert.deepEqual(countMarkers(fs.readFileSync(path.join(project, adapter), 'utf8')), { start: 1, end: 1 }, adapter);
  }
});

scenario('cenário 5: uninstall remove só o que está no manifesto', (t) => {
  const { project, cli } = setup(t);
  const own = '# Meu projeto\n\nConteúdo do usuário.\n';
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), own);
  fs.mkdirSync(path.join(project, 'src'));
  fs.writeFileSync(path.join(project, 'src', 'app.js'), 'console.log(1);\n');
  assertOk(cli(['init', '--client', 'claude']), 'init');

  const userSkill = path.join(project, '.claude', 'skills', 'minha-skill', 'SKILL.md');
  fs.mkdirSync(path.dirname(userSkill), { recursive: true });
  fs.writeFileSync(userSkill, '---\nname: minha-skill\ndescription: do usuário\n---\n');
  fs.appendFileSync(path.join(project, 'project', 'STATE.md'), '\nEstado.\n');
  const projectBefore = snapshotTree(path.join(project, 'project'));
  const managed = readManifest(project).files.filter((f) => f.kind !== 'merged-block').map((f) => f.path);

  assertOk(cli(['uninstall']), 'uninstall');
  for (const rel of managed.filter((p) => !p.startsWith('project/'))) {
    assert.equal(fs.existsSync(path.join(project, rel)), false, `${rel} não foi removido`);
  }
  assert.equal(fs.readFileSync(userSkill, 'utf8').includes('minha-skill'), true, 'skill do usuário removida');
  assert.equal(fs.readFileSync(path.join(project, 'src', 'app.js'), 'utf8'), 'console.log(1);\n');
  assert.deepEqual(snapshotTree(path.join(project, 'project')), projectBefore, 'uninstall alterou project/');
  const claude = fs.readFileSync(path.join(project, 'CLAUDE.md'), 'utf8');
  assert.deepEqual(countMarkers(claude), { start: 0, end: 0 });
  assert.ok(claude.startsWith(own.trimEnd()), 'conteúdo do usuário em CLAUDE.md perdido');
  assert.equal(fs.existsSync(path.join(project, '.ignity', 'manifest.json')), false);
});

scenario('cenário 6: doctor sem MCP dá WARN com instrução e não vaza token sentinela', (t) => {
  const { project, cli } = setup(t);
  const env = { IGNITY_TEST_SECRET: SENTINEL };
  assertOk(cli(['init', '--client', 'claude'], env), 'init');
  // MCP config without Elementor/Figma servers, carrying the sentinel in env, headers, args and URL.
  fs.writeFileSync(
    path.join(project, '.mcp.json'),
    JSON.stringify(
      {
        mcpServers: {
          'outro-servidor': {
            command: 'npx',
            args: ['outro', `--token=${SENTINEL}`],
            env: { API_TOKEN: SENTINEL },
            headers: { Authorization: `Bearer ${SENTINEL}` },
            url: `https://user:${SENTINEL}@example.com/mcp`,
          },
        },
      },
      null,
      2,
    ),
  );

  const r = cli(['doctor'], env);
  assert.equal(r.code, 0, `doctor com MCP ausente não deve falhar\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /WARN/);
  assert.match(r.stdout, /MCP/i);
  assert.match(r.stdout, /elementor/i);
  for (const [label, text] of [
    ['stdout', r.stdout],
    ['stderr', r.stderr],
    ['.ignity/', readAllText(path.join(project, '.ignity'))],
    ['project/', readAllText(path.join(project, 'project'))],
  ]) {
    assert.equal(text.includes(SENTINEL), false, `sentinela vazou em ${label}`);
  }
});
