'use strict';

/**
 * AC 2: content/ is a byte-for-byte copy of the v1 kit.
 *
 * TEMPORARY: this test pins the initial migration only. Story 1.3 changes the
 * purpose of the `elementor` skill, so this test must be removed or narrowed to the
 * unchanged files at that point. Story 1.2 already narrowed it (CHANGED_IN_1_2).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { snapshotTree } = require('./helpers/tree');
const { V1_ROOT } = require('./helpers/v1-install');

const CONTENT = path.resolve(__dirname, '..', 'content');

// Story 1.2 (AC 7): intentional edits — FRAMEWORK.md now resolved from .ignity/framework/.
// These files are excluded from byte parity and checked for the new search order instead.
const CHANGED_IN_1_2 = {
  skills: ['web-orchestrator/SKILL.md'],
  adapters: ['AGENTS.md', 'CLAUDE.md'],
};

function withoutChanged(snapshot, dir) {
  const copy = { ...snapshot };
  // Explicit additions/changes: 1.4 briefing, 1.5 setup/copy, 1.15 feedback.
  if (dir === 'templates') for (const rel of ['BRIEF.md', 'COPY.md', 'IGNITY-FEEDBACK.md']) delete copy[rel];
  if (dir === 'skills') delete copy['web-setup/SKILL.md'];
  for (const rel of CHANGED_IN_1_2[dir] || []) delete copy[rel];
  if (dir === 'skills') for (const rel of ['elementor/SKILL.md', 'elementor/CHANGELOG.md', 'web-assets/SKILL.md']) delete copy[rel];
  return copy;
}

test('content/ contém somente skills, templates, adapters e framework', () => {
  const entries = fs.readdirSync(CONTENT).filter((n) => n !== '.DS_Store').sort();
  assert.deepEqual(entries, ['adapters', 'framework', 'skills', 'templates']);
});

test('adições declaradas da preparação do site são distribuídas', () => {
  for (const rel of ['skills/web-setup/SKILL.md', 'templates/COPY.md']) {
    assert.ok(fs.readFileSync(path.join(CONTENT, rel), 'utf8').trim().length > 0, rel);
  }
});

for (const dir of ['skills', 'templates', 'adapters']) {
  test(`content/${dir}/ é igual byte a byte a framework-agentico-web/${dir}/`, () => {
    const v1 = snapshotTree(path.join(V1_ROOT, dir));
    assert.ok(Object.keys(v1).length > 0, `v1 ${dir}/ vazio ou ausente`);
    assert.deepEqual(withoutChanged(snapshotTree(path.join(CONTENT, dir)), dir), withoutChanged(v1, dir));
  });
}

test('Story 1.2: arquivos alterados de propósito apontam primeiro para .ignity/framework/FRAMEWORK.md', () => {
  for (const [dir, files] of Object.entries(CHANGED_IN_1_2)) {
    for (const rel of files) {
      const text = fs.readFileSync(path.join(CONTENT, dir, rel), 'utf8');
      const v2 = text.indexOf('.ignity/framework/FRAMEWORK.md');
      assert.ok(v2 >= 0, `${dir}/${rel} sem o caminho v2`);
      assert.ok(text.indexOf('project/framework/FRAMEWORK.md') > v2, `${dir}/${rel} sem o fallback v1 depois do v2`);
      assert.equal(text.includes('dois níveis acima'), false, `${dir}/${rel} ainda cita "dois níveis acima"`);
    }
  }
});

test('content/framework/FRAMEWORK.md é igual byte a byte ao FRAMEWORK.md do v1', () => {
  assert.deepEqual(snapshotTree(path.join(CONTENT, 'framework')), {
    'FRAMEWORK.md': snapshotTree(V1_ROOT)['FRAMEWORK.md'],
  });
});
