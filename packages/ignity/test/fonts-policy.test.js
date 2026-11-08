'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../content');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
test('política ativa mantém Custom Fonts e impede proibição de origem ou CDN', () => {
  // O CHANGELOG conserva literalmente o texto v1 para rollback (AC 4), não é uma instrução ativa.
  for (const file of walk(root).filter(f => !f.endsWith('CHANGELOG.md'))) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /não use Google Fonts|Não trocar por Google Fonts/);
    assert.doesNotMatch(text, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  }
  for (const skill of ['elementor', 'web-assets']) {
    const text = fs.readFileSync(path.join(root, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(text, /Custom Fonts/);
    assert.match(text, /self-hosted/);
    assert.match(text, /licença/);
  }
});
test('diff de elementor e web-assets limita-se ao bloco autorizado', () => {
  const v1 = path.resolve(__dirname, '../../../framework-agentico-web/skills');
  for (const skill of ['elementor', 'web-assets']) {
    const original = fs.readFileSync(path.join(v1, skill, 'SKILL.md'), 'utf8').split('\n');
    const updated = fs.readFileSync(path.join(root, 'skills', skill, 'SKILL.md'), 'utf8').split('\n');
    const index = skill === 'elementor' ? 52 : 13;
    const count = skill === 'elementor' ? 2 : 1;
    assert.deepEqual(updated.slice(0,index), original.slice(0,index));
    assert.deepEqual(updated.slice(index + (skill === 'elementor' ? 3 : 1)), original.slice(index+count));
  }
});
