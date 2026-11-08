'use strict';

/** Story 1.2 AC 1a: runtime Node.js check. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { checkNodeVersion, REQUIRED_MAJOR } = require('../src/lib/node-check');

test('checkNodeVersion: 20.11.0 reprova; 22.0.0 e 24.1.0 passam', () => {
  assert.equal(REQUIRED_MAJOR, 22);
  assert.equal(checkNodeVersion('20.11.0').ok, false);
  assert.equal(checkNodeVersion('22.0.0').ok, true);
  assert.equal(checkNodeVersion('24.1.0').ok, true);
  assert.equal(checkNodeVersion('v21.9.9').ok, false);
  assert.equal(checkNodeVersion('').ok, false);
  assert.equal(checkNodeVersion('abc').ok, false);
});

test('mensagem de reprovação em pt-BR com versão encontrada, mínima e próximo passo', () => {
  const { message } = checkNodeVersion('20.11.0');
  assert.match(message, /20\.11\.0/);
  assert.match(message, /22/);
  assert.match(message, /instale o Node 22 LTS ou mais novo em https:\/\/nodejs\.org\/ e rode o comando de novo/);
});

test('bin/ignity.js e node-check.js usam só sintaxe ES5 (parseável por Node antigo)', () => {
  const root = path.resolve(__dirname, '..');
  for (const rel of ['bin/ignity.js', 'src/lib/node-check.js']) {
    const code = fs
      .readFileSync(path.join(root, rel), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
    assert.doesNotMatch(code, /\b(const|let|class|async|await)\b|=>|`|\?\.|\?\?|\.\.\./, rel);
  }
  const bin = fs.readFileSync(path.join(root, 'bin/ignity.js'), 'utf8');
  assert.ok(bin.startsWith('#!/usr/bin/env node\n'));
  const firstRequire = /require\(([^)]+)\)/.exec(bin);
  assert.equal(firstRequire[1], "'../src/lib/node-check'", 'a checagem deve ser o primeiro require');
});

test('package.json mantém engines.node >=22 e licença MIT', () => {
  const pkg = require('../package.json');
  assert.equal(pkg.engines.node, '>=22');
  assert.equal(pkg.license, 'MIT');
});
