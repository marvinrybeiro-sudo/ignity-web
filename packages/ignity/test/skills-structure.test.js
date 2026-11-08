'use strict';

/** AC 8: SKILL.md frontmatter and local Markdown links in content/. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseFrontmatter } = require('./helpers/frontmatter');
const { brokenLocalLinks } = require('./helpers/md-links');
const { listFiles } = require('../scripts/lib/fs-utils');
const { makeTmpDir } = require('./helpers/tmp');

const CONTENT = path.resolve(__dirname, '..', 'content');
const SKILLS = path.join(CONTENT, 'skills');
const skillNames = fs.readdirSync(SKILLS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();

test('skills distribuídas incluem preparação do site', () => {
  assert.deepEqual(skillNames, ['elementor', 'web-assets', 'web-figma-spec', 'web-motion', 'web-orchestrator', 'web-qa', 'web-release', 'web-seo', 'web-setup']);
});

for (const skill of skillNames) {
  test(`skill ${skill}: frontmatter com exatamente name e description, name = pasta`, () => {
    const { data, keys } = parseFrontmatter(fs.readFileSync(path.join(SKILLS, skill, 'SKILL.md'), 'utf8'));
    assert.deepEqual([...keys].sort(), ['description', 'name']);
    assert.equal(data.name, skill);
    assert.ok(data.description.length > 0, 'description vazia');
  });
}

test('links Markdown locais em content/ resolvem', () => {
  const broken = [];
  for (const rel of listFiles(CONTENT).filter((f) => f.endsWith('.md'))) {
    for (const target of brokenLocalLinks(path.join(CONTENT, rel), CONTENT)) broken.push(`${rel} -> ${target}`);
  }
  assert.deepEqual(broken, []);
});

test('parser de frontmatter rejeita chave extra, ausência de delimitador e chave duplicada', () => {
  assert.deepEqual(parseFrontmatter('---\nname: a\ndescription: x: y\n---\n').data, { name: 'a', description: 'x: y' });
  assert.deepEqual(parseFrontmatter('---\nname: a\nversion: 1\n---\n').keys, ['name', 'version']);
  assert.throws(() => parseFrontmatter('# sem frontmatter\n'), /opening/);
  assert.throws(() => parseFrontmatter('---\nname: a\n'), /closing/);
  assert.throws(() => parseFrontmatter('---\nname: a\nname: b\n---\n'), /duplicate/);
});

test('verificador de links detecta link quebrado e ignora externos, âncoras e código', (t) => {
  const root = makeTmpDir(t);
  fs.mkdirSync(path.join(root, 'sub'));
  fs.writeFileSync(path.join(root, 'sub', 'ok.md'), 'ok\n');
  fs.writeFileSync(
    path.join(root, 'doc.md'),
    [
      '[ok](sub/ok.md#secao)',
      '[quebrado](sub/nao-existe.md)',
      '[fora](../fora.md)',
      '[web](https://example.com/x.md)',
      '[ancora](#topo)',
      '`[codigo](nao-checa.md)`',
      '[ref]: sub/ref-quebrado.md',
    ].join('\n'),
  );
  assert.deepEqual(brokenLocalLinks(path.join(root, 'doc.md'), root).sort(), [
    '../fora.md',
    'sub/nao-existe.md',
    'sub/ref-quebrado.md',
  ]);
});
