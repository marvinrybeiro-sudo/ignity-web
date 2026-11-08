'use strict';

/** Story 1.2 AC 16, 17, 17a: doctor checks. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeTmpDir } = require('./helpers/tmp');
const { runCli } = require('./helpers/run-cli');
const { createMemoryOutput } = require('../src/lib/log');
const { doctor, runChecks, elementorProPlanCheck, nodeCheck, ELEMENTOR_PLAN_REQUIREMENT } = require('../src/commands/doctor');
const { namesFromJson, namesFromToml, readMcpServerNames } = require('../src/lib/mcp-config');

test('elementor-pro-plan: INFO sem evidência, FAIL com false, OK com true', () => {
  const none = elementorProPlanCheck.run({});
  assert.equal(none.level, 'INFO');
  assert.match(none.message, /Requer Elementor Pro Advanced ou superior \(Advanced Solo em diante\)\. O plano Essential não tem Custom Code, usado pelo runtime da Ignity Motion\./);
  assert.match(none.fix, /confira o plano da sua licença na conta Elementor; se for Essential, faça upgrade para Advanced ou superior/i);
  const no = elementorProPlanCheck.run({ elementorEvidence: { customCodeAvailable: false } });
  assert.equal(no.level, 'FAIL');
  assert.match(no.fix, /faça upgrade para Elementor Pro Advanced ou superior/i);
  assert.equal(elementorProPlanCheck.run({ elementorEvidence: { customCodeAvailable: true } }).level, 'OK');
  assert.equal(elementorProPlanCheck.run({ elementorEvidence: { customCodeAvailable: 'talvez' } }).level, 'INFO');
});

test('node: FAIL abaixo de 22 (só em teste unitário), OK a partir de 22', () => {
  assert.equal(nodeCheck.run({ nodeVersion: '20.11.0' }).level, 'FAIL');
  assert.equal(nodeCheck.run({ nodeVersion: '22.0.0' }).level, 'OK');
});

test('runChecks: check que lança vira FAIL; exit 1 só com FAIL', (t) => {
  const results = runChecks([{ id: 'x', run: () => { throw new Error('boom'); } }], {});
  assert.equal(results[0].level, 'FAIL');
  const root = makeTmpDir(t);
  const out = createMemoryOutput();
  const warnOnly = [{ id: 'w', run: () => ({ level: 'WARN', message: 'w' }) }, { id: 'i', run: () => ({ level: 'INFO', message: 'i' }) }];
  assert.equal(doctor({ root, out }, warnOnly), 0);
  assert.equal(doctor({ root, out }, [{ id: 'f', run: () => ({ level: 'FAIL', message: 'f' }) }]), 1);
});

test('leitor MCP extrai só nomes (JSON, ~/.claude.json por projeto, TOML) e tolera arquivo inválido', (t) => {
  assert.deepEqual(namesFromJson('{"mcpServers":{"a":{"env":{"K":"v"}}},"projects":{"/p":{"mcpServers":{"b":{}}}}}', '/p'), ['a', 'b']);
  assert.deepEqual(namesFromToml('[mcp_servers.elementor]\ncommand="x"\n[mcp_servers."figma-dev".env]\nTOKEN="s"\n'), ['elementor', 'figma-dev']);
  const root = makeTmpDir(t);
  const home = makeTmpDir(t);
  fs.writeFileSync(path.join(root, '.mcp.json'), '{"mcpServers": {"x": "segredo-123"');
  const [project] = readMcpServerNames(root, 'claude', home);
  assert.deepEqual(project, { label: '.mcp.json', exists: true, readable: false, names: [] });
});

test('doctor via CLI: MCP declarado dá OK; plano Elementor sempre INFO; sem manifesto dá FAIL', (t) => {
  const root = makeTmpDir(t);
  const home = makeTmpDir(t);
  const cli = (args) => runCli(args, { cwd: root, home });
  const empty = cli(['doctor']);
  assert.equal(empty.code, 1);
  assert.match(empty.stdout, /\[FAIL\] manifest/);
  assert.equal(cli(['init', '--client', 'codex']).code, 0);
  fs.mkdirSync(path.join(home, '.codex'));
  fs.writeFileSync(path.join(home, '.codex', 'config.toml'), '[mcp_servers.elementor-site]\nenv = { T = "x" }\n[mcp_servers.figma]\n');
  const r = cli(['doctor']);
  assert.equal(r.code, 0, r.stdout);
  assert.match(r.stdout, /\[OK\] mcp-elementor: .*~\/\.codex\/config\.toml/);
  assert.match(r.stdout, /\[OK\] mcp-figma/);
  assert.ok(r.stdout.includes(`[INFO] elementor-pro-plan: ${ELEMENTOR_PLAN_REQUIREMENT}`));
  assert.match(r.stdout, /\[OK\] integrity/);
  fs.appendFileSync(path.join(root, '.agents', 'skills', 'web-qa', 'SKILL.md'), 'x');
  fs.rmSync(path.join(root, 'project', 'QA.md'));
  const changed = cli(['doctor']);
  assert.equal(changed.code, 0);
  assert.match(changed.stdout, /\[WARN\] integrity: .*web-qa/);
  assert.match(changed.stdout, /\[WARN\] templates: .*QA\.md/);
});
