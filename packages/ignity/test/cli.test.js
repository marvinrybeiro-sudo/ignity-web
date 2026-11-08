'use strict';

/** Story 1.2 AC 1, 2, 3, 6, 9-12, 15, 17b, 18: CLI entry, dry-run, status, uninstall and update details. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeTmpDir } = require('./helpers/tmp');
const { runCli } = require('./helpers/run-cli');
const { snapshotTree } = require('./helpers/tree');
const { detectClient } = require('../src/lib/client-detect');
const { createWriter } = require('../src/lib/writer');
const { createMemoryOutput } = require('../src/lib/log');
const { parseState } = require('../src/commands/status');
const { version } = require('../package.json');

function setup(t) {
  const root = makeTmpDir(t);
  const project = path.join(root, 'p');
  const home = path.join(root, 'h');
  fs.mkdirSync(project);
  fs.mkdirSync(home);
  return { root, project, cli: (args, cwd = project) => runCli(args, { cwd, home }) };
}

test('--version, --help, comando desconhecido e opção inválida', (t) => {
  const { cli } = setup(t);
  assert.deepEqual([cli(['--version']).code, cli(['--version']).stdout.trim()], [0, version]);
  const help = cli(['--help']);
  assert.equal(help.code, 0);
  for (const c of ['init', 'update', 'doctor', 'status', 'uninstall', '--dry-run', '--client', '--dir']) assert.ok(help.stdout.includes(c), c);
  const unknown = cli(['instalar']);
  assert.equal(unknown.code, 1);
  assert.match(unknown.stderr, /comando desconhecido/);
  assert.match(unknown.stderr, /Uso: npx ignity-web/);
  assert.equal(cli([]).code, 1);
  assert.equal(cli(['init', '--client', 'vim']).code, 1);
  assert.equal(cli(['init', '--nada']).code, 1);
});

test('AC 3: detecção de cliente', (t) => {
  const { project } = setup(t);
  assert.equal(detectClient(project), 'both');
  fs.mkdirSync(path.join(project, '.claude'));
  assert.equal(detectClient(project), 'claude');
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'x');
  assert.equal(detectClient(project), 'both');
  fs.rmSync(path.join(project, '.claude'), { recursive: true });
  assert.equal(detectClient(project), 'codex');
});

test('AC 2: --dry-run não grava nada e lista PREVER CRIAR/ATUALIZAR/REMOVER; --dir funciona', (t) => {
  const { root, project, cli } = setup(t);
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), '# Meu\n');
  const before = snapshotTree(project);
  const dry = cli(['init', '--dir', project, '--client', 'claude', '--dry-run'], root);
  assert.equal(dry.code, 0, dry.stderr);
  assert.match(dry.stdout, /PREVER CRIAR \.claude\/skills\/web-qa\/SKILL\.md/);
  assert.match(dry.stdout, /PREVER ATUALIZAR CLAUDE\.md/);
  assert.match(dry.stdout, /PREVER CRIAR \.ignity\/manifest\.json/);
  assert.deepEqual(snapshotTree(project), before);
  assert.equal(fs.existsSync(path.join(project, '.ignity')), false);

  assert.equal(cli(['init', '--dir', project, '--client', 'claude'], root).code, 0);
  const installed = snapshotTree(project);
  const dryUninstall = cli(['uninstall', '--dry-run']);
  assert.match(dryUninstall.stdout, /PREVER REMOVER \.claude\/skills\/web-qa\/SKILL\.md/);
  assert.deepEqual(snapshotTree(project), installed);
  assert.equal(cli(['init', '--dir', path.join(root, 'nao-existe')], root).code, 1);
});

test('AC 17b: fim do init repete o requisito do Elementor Pro e que o CLI não agiu no site', (t) => {
  const { cli } = setup(t);
  const r = cli(['init']);
  assert.equal(r.code, 0);
  const tail = r.stdout.trim().split('\n').slice(-3).join('\n');
  assert.match(tail, /Elementor Pro Advanced ou superior/);
  assert.match(tail, /não agiu no site/);
});

test('init preserva link simbólico do CLAUDE.md e atualiza seu destino interno', (t) => {
  const { project, cli } = setup(t);
  const target = path.join(project, 'instrucoes.md');
  const link = path.join(project, 'CLAUDE.md');
  fs.writeFileSync(target, 'Instruções originais\n');
  fs.symlinkSync('instrucoes.md', link);
  const result = cli(['init', '--client', 'claude']);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  assert.match(fs.readFileSync(target, 'utf8'), /^Instruções originais\n[\s\S]*<!-- IGNITY:START -->/);
  assert.equal(fs.readlinkSync(link), 'instrucoes.md');
});

test('init e update recusam adapters que apontam ao mesmo arquivo antes de gravar', (t) => {
  const { project, cli } = setup(t);
  const claude = path.join(project, 'CLAUDE.md');
  const agents = path.join(project, 'AGENTS.md');
  fs.writeFileSync(agents, 'Instruções existentes\n');
  fs.symlinkSync('AGENTS.md', claude);
  const init = cli(['init', '--client', 'both']);
  assert.equal(init.code, 1);
  assert.match(init.stderr, /CLAUDE\.md e AGENTS\.md apontam para o mesmo arquivo/);
  assert.equal(fs.readFileSync(agents, 'utf8'), 'Instruções existentes\n');
  assert.equal(fs.existsSync(path.join(project, '.ignity')), false);
  assert.equal(fs.existsSync(path.join(project, '.claude')), false);

  fs.unlinkSync(claude);
  assert.equal(cli(['init', '--client', 'both']).code, 0);
  fs.unlinkSync(claude);
  fs.symlinkSync('AGENTS.md', claude);
  const manifest = fs.readFileSync(path.join(project, '.ignity', 'manifest.json'));
  const contents = fs.readFileSync(agents);
  const update = cli(['update']);
  assert.equal(update.code, 1);
  assert.match(update.stderr, /apontam para o mesmo arquivo/);
  assert.deepEqual(fs.readFileSync(agents), contents);
  assert.deepEqual(fs.readFileSync(path.join(project, '.ignity', 'manifest.json')), manifest);
});

test('AC 10/12: update sem mudanças não gera diff nem backup; manifesto regravado após mudança', (t) => {
  const { project, cli } = setup(t);
  assert.equal(cli(['init', '--client', 'both']).code, 0);
  const before = snapshotTree(project);
  const r = cli(['update']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /Nada a fazer/);
  assert.deepEqual(snapshotTree(project), before, 'update no-op alterou arquivos (inclusive o manifesto)');
  const manifestBefore = JSON.parse(fs.readFileSync(path.join(project, '.ignity', 'manifest.json'), 'utf8'));
  fs.rmSync(path.join(project, '.agents', 'skills', 'web-seo', 'SKILL.md'));
  const r2 = cli(['update']);
  assert.match(r2.stdout, /CRIADO \.agents\/skills\/web-seo\/SKILL\.md/);
  assert.doesNotMatch(r2.stdout, /AVISO/);
  const manifestAfter = JSON.parse(fs.readFileSync(path.join(project, '.ignity', 'manifest.json'), 'utf8'));
  assert.equal(manifestAfter.installedAt, manifestBefore.installedAt);
  assert.ok(manifestAfter.updatedAt >= manifestBefore.updatedAt);
});

test('AC 11: update avisa template ausente com comando e não o cria', (t) => {
  const { project, cli } = setup(t);
  assert.equal(cli(['init', '--client', 'claude']).code, 0);
  fs.rmSync(path.join(project, 'project', 'SECTIONS.md'));
  const r = cli(['update']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /template project\/SECTIONS\.md ausente.*cp .*templates[\\/]SECTIONS\.md.*project\/SECTIONS\.md/);
  assert.equal(fs.existsSync(path.join(project, 'project', 'SECTIONS.md')), false);
});

test('guard de project/: o writer recusa alterar ou remover, e só cria no init', (t) => {
  const root = makeTmpDir(t);
  fs.mkdirSync(path.join(root, 'project'));
  fs.writeFileSync(path.join(root, 'project', 'STATE.md'), 'x');
  const out = createMemoryOutput();
  const upd = createWriter({ root, dryRun: false, out });
  assert.throws(() => upd.create('project/NOVO.md', 'x'), /não altera nem remove nada em project/);
  assert.throws(() => upd.update('project/STATE.md', 'y'), /project/);
  assert.throws(() => upd.remove('project/STATE.md'), /project/);
  const ini = createWriter({ root, dryRun: false, out, allowProjectCreate: true });
  assert.throws(() => ini.create('project/STATE.md', 'y'), /project/);
  ini.create('project/NOVO.md', 'x');
  assert.equal(fs.readFileSync(path.join(root, 'project', 'STATE.md'), 'utf8'), 'x');
  assert.throws(() => upd.create('../fora.md', 'x'), /inseguro/);
});

test('guard de project/ recusa aliases simbólicos dentro do projeto', (t) => {
  const root = makeTmpDir(t);
  fs.mkdirSync(path.join(root, 'project'));
  fs.mkdirSync(path.join(root, '.claude'));
  fs.writeFileSync(path.join(root, 'project', 'STATE.md'), 'original');
  fs.symlinkSync(path.join(root, 'project'), path.join(root, '.claude', 'skills'), 'dir');
  const writer = createWriter({ root, dryRun: false, out: createMemoryOutput() });
  assert.throws(() => writer.create('.claude/skills/new/SKILL.md', 'x'), /project/);
  assert.throws(() => writer.update('.claude/skills/STATE.md', 'x'), /project/);
  assert.throws(() => writer.remove('.claude/skills/STATE.md'), /project/);
  assert.equal(fs.readFileSync(path.join(root, 'project', 'STATE.md'), 'utf8'), 'original');
});

test('AC 15: uninstall mantém arquivo alterado (aviso), remove com --force (backup), apaga adapter criado e vazio', (t) => {
  const { project, cli } = setup(t);
  assert.equal(cli(['init', '--client', 'codex']).code, 0);
  const skill = path.join(project, '.agents', 'skills', 'web-qa', 'SKILL.md');
  fs.appendFileSync(skill, 'meu\n');
  const r = cli(['uninstall']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /AVISO: \.agents\/skills\/web-qa\/SKILL\.md foi alterado/);
  assert.ok(fs.existsSync(skill));
  assert.equal(fs.existsSync(path.join(project, 'AGENTS.md')), false, 'AGENTS.md criado pelo Ignity deveria sair');
  assert.equal(fs.existsSync(path.join(project, '.ignity')), false, 'sem backups, .ignity/ sai inteiro');
  assert.ok(fs.existsSync(path.join(project, 'project', 'STATE.md')));
  assert.equal(cli(['uninstall']).code, 1, 'sem manifesto não há o que remover');

  assert.equal(cli(['init', '--client', 'codex']).code, 0);
  fs.appendFileSync(skill, 'de novo\n');
  const forced = cli(['uninstall', '--force']);
  assert.equal(forced.code, 0);
  assert.equal(fs.existsSync(skill), false);
  assert.match(forced.stdout, /Backups mantidos em \.ignity\/backups\//);
  assert.ok(Object.keys(snapshotTree(path.join(project, '.ignity', 'backups'))).some((k) => k.endsWith('web-qa/SKILL.md')));
  assert.deepEqual(fs.readdirSync(path.join(project, '.ignity')), ['backups']);
});

test('AC 15: uninstall preserva guia alterado e arquivos não gerenciados dentro de .ignity', (t) => {
  const { project, cli } = setup(t);
  assert.equal(cli(['init', '--client', 'codex']).code, 0);
  const framework = path.join(project, '.ignity', 'framework', 'FRAMEWORK.md');
  const extra = path.join(project, '.ignity', 'framework', 'notas.txt');
  const other = path.join(project, '.ignity', 'privado.txt');
  fs.appendFileSync(framework, '\nAlteração pessoal\n');
  fs.writeFileSync(extra, 'notas pessoais');
  fs.writeFileSync(other, 'outro arquivo');
  const result = cli(['uninstall']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /FRAMEWORK\.md foi alterado/);
  assert.match(fs.readFileSync(framework, 'utf8'), /Alteração pessoal/);
  assert.equal(fs.readFileSync(extra, 'utf8'), 'notas pessoais');
  assert.equal(fs.readFileSync(other, 'utf8'), 'outro arquivo');
  assert.equal(fs.existsSync(path.join(project, '.ignity', 'manifest.json')), false);
});

test('AC 15: uninstall salva adapter criado com bloco alterado antes de removê-lo', (t) => {
  const { project, cli } = setup(t);
  assert.equal(cli(['init', '--client', 'codex']).code, 0);
  const adapter = path.join(project, 'AGENTS.md');
  const edited = fs.readFileSync(adapter, 'utf8').replace('<!-- IGNITY:END -->', 'Minha instrução\n<!-- IGNITY:END -->');
  fs.writeFileSync(adapter, edited);
  const result = cli(['uninstall']);
  assert.equal(result.code, 0);
  assert.equal(fs.existsSync(adapter), false);
  const backups = path.join(project, '.ignity', 'backups');
  const backup = Object.keys(snapshotTree(backups)).find((name) => name.endsWith('/AGENTS.md'));
  assert.ok(backup);
  assert.equal(fs.readFileSync(path.join(backups, backup), 'utf8'), edited);
});

test('AC 18: status com e sem project/STATE.md (somente leitura)', (t) => {
  const { project, cli } = setup(t);
  const none = cli(['status']);
  assert.equal(none.code, 0);
  assert.match(none.stdout, /Instalado: não/);
  assert.match(none.stdout, /\/web-orchestrator/);
  assert.equal(cli(['init', '--client', 'claude']).code, 0);
  const state = path.join(project, 'project', 'STATE.md');
  fs.writeFileSync(state, fs.readFileSync(state, 'utf8').replace('Ainda não definido. Consultar BRIEF.md e pedido atual.', 'Home da marca X').replace('| Contexto | Não iniciado |', '| Contexto | Concluído |'));
  const before = snapshotTree(project);
  const r = cli(['status']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, new RegExp(`Pacote: ignity ${version.replace(/\./g, '\\.')}`));
  assert.match(r.stdout, /Cliente: claude/);
  assert.match(r.stdout, /Última atualização: \d{4}-/);
  assert.match(r.stdout, /Objetivo ativo: Home da marca X/);
  assert.match(r.stdout, /Contexto\s+Concluído/);
  assert.deepEqual(snapshotTree(project), before);
  assert.deepEqual(parseState('# x\n').stages, []);
});
