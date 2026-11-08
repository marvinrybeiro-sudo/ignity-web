'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeTmpDir } = require('./helpers/tmp');
const { runCli } = require('./helpers/run-cli');

test('init cria relatório local e init/update preservam aprendizados preenchidos', (t) => {
  const root = makeTmpDir(t);
  const project = path.join(root, 'p');
  const home = path.join(root, 'h');
  fs.mkdirSync(project); fs.mkdirSync(home);
  const cli = (args) => runCli(args, { cwd: project, home });
  assert.equal(cli(['init', '--client', 'codex']).code, 0);
  const report = path.join(project, 'project', 'IGNITY-FEEDBACK.md');
  const template = fs.readFileSync(report, 'utf8');
  assert.match(template, /Problemas observados/);
  assert.match(template, /Ideias de melhoria/);
  const filled = template + '\nProblema observado: exemplo local, sem dados de cliente.\n';
  fs.writeFileSync(report, filled);
  assert.equal(cli(['init', '--client', 'codex']).code, 0);
  assert.equal(cli(['update']).code, 0);
  assert.equal(fs.readFileSync(report, 'utf8'), filled);
});
