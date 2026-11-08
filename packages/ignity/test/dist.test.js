'use strict';

/** AC 4 and AC 5 (QA scenario 7): deterministic build and dist/ <-> content/skills parity. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { makeTmpDir } = require('./helpers/tmp');
const { readZip, createZip } = require('../scripts/lib/zip');
const { listFiles, sha256File } = require('../scripts/lib/fs-utils');
const { buildDist, listSkills, SKILLS_DIR } = require('../scripts/build-dist');
const { V1_ROOT } = require('./helpers/v1-install');

const PKG_ROOT = path.resolve(__dirname, '..');
const BUILD_SCRIPT = path.join(PKG_ROOT, 'scripts', 'build-dist.js');
const REPO_DIST = path.join(PKG_ROOT, 'dist');

/**
 * Compares every ZIP in `distDir` with `skillsDir/{skill}/` byte for byte.
 * @returns {string[]} problems (empty when in sync)
 */
function compareDist(distDir, skillsDir) {
  const problems = [];
  const skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const zips = fs.readdirSync(distDir).filter((n) => n.endsWith('.zip'));
  for (const skill of skills) if (!zips.includes(`${skill}.zip`)) problems.push(`skill sem ZIP: ${skill}`);
  for (const zipName of zips) {
    const skill = zipName.slice(0, -4);
    if (!skills.includes(skill)) {
      problems.push(`ZIP sem skill: ${zipName}`);
      continue;
    }
    const zipped = new Map();
    for (const { name, data } of readZip(fs.readFileSync(path.join(distDir, zipName)))) {
      if (!name.startsWith(`${skill}/`)) problems.push(`${zipName}: entrada fora da pasta da skill: ${name}`);
      else zipped.set(name.slice(skill.length + 1), data);
    }
    const onDisk = listFiles(path.join(skillsDir, skill));
    for (const rel of onDisk) {
      if (!zipped.has(rel)) problems.push(`${zipName}: arquivo a menos: ${rel}`);
      else if (!zipped.get(rel).equals(fs.readFileSync(path.join(skillsDir, skill, rel)))) {
        problems.push(`${zipName}: conteúdo diferente: ${rel}`);
      }
    }
    for (const rel of zipped.keys()) if (!onDisk.includes(rel)) problems.push(`${zipName}: arquivo a mais: ${rel}`);
  }
  return problems;
}

test('build gera um ZIP por skill com a pasta da skill na raiz', (t) => {
  const out = makeTmpDir(t);
  const results = buildDist({ outDir: out });
  const skills = listSkills();
  assert.equal(skills.length, 9);
  assert.deepEqual(results.map((r) => r.skill), skills);
  for (const skill of skills) {
    const names = readZip(fs.readFileSync(path.join(out, `${skill}.zip`))).map((e) => e.name);
    assert.ok(names.length > 0);
    assert.ok(names.every((n) => n.startsWith(`${skill}/`)), `${skill}.zip fora da estrutura v1`);
    assert.deepEqual(names, [...names].sort(), `${skill}.zip com entradas fora de ordem`);
  }
});

test('build em --out preserva arquivos e ZIPs não relacionados', (t) => {
  const out = makeTmpDir(t);
  fs.writeFileSync(path.join(out, 'pessoal.zip'), 'arquivo pessoal');
  fs.writeFileSync(path.join(out, 'notas.txt'), 'notas');
  const result = spawnSync(process.execPath, [BUILD_SCRIPT, '--out', out], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(out, 'pessoal.zip'), 'utf8'), 'arquivo pessoal');
  assert.equal(fs.readFileSync(path.join(out, 'notas.txt'), 'utf8'), 'notas');
});

test('build é determinístico: duas execuções geram o mesmo SHA-256', (t) => {
  const a = makeTmpDir(t);
  const b = makeTmpDir(t);
  for (const out of [a, b]) {
    const r = spawnSync(process.execPath, [BUILD_SCRIPT, '--out', out], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  }
  const hashes = (dir) => Object.fromEntries(fs.readdirSync(dir).sort().map((n) => [n, sha256File(path.join(dir, n))]));
  assert.equal(Object.keys(hashes(a)).length, listSkills().length);
  assert.deepEqual(hashes(a), hashes(b));
});

test('cenário 7: ZIPs do build batem com content/skills/ byte a byte', (t) => {
  const out = makeTmpDir(t);
  buildDist({ outDir: out });
  assert.deepEqual(compareDist(out, SKILLS_DIR), []);
});

test('cenário 7: dist/ do pacote, se existir, está em sincronia com content/skills/', { skip: !fs.existsSync(REPO_DIST) && 'dist/ ainda não gerado (npm run build)' }, () => {
  assert.deepEqual(compareDist(REPO_DIST, SKILLS_DIR), []);
});

test('cenário 7: comparação detecta arquivo a mais, a menos, diferente e skill sem ZIP', (t) => {
  const root = makeTmpDir(t);
  const skills = path.join(root, 'skills');
  const dist = path.join(root, 'dist');
  for (const s of ['alpha', 'beta', 'gamma']) {
    fs.mkdirSync(path.join(skills, s), { recursive: true });
    fs.writeFileSync(path.join(skills, s, 'SKILL.md'), `skill ${s}\n`);
  }
  fs.writeFileSync(path.join(skills, 'alpha', 'extra.md'), 'só no disco\n');
  fs.mkdirSync(dist);
  const zip = (entries) => createZip(entries.map(([name, text]) => ({ name, data: Buffer.from(text) })));
  fs.writeFileSync(path.join(dist, 'alpha.zip'), zip([['alpha/SKILL.md', 'skill alpha\n']]));
  fs.writeFileSync(path.join(dist, 'beta.zip'), zip([['beta/SKILL.md', 'alterado\n'], ['beta/sobra.md', 'x']]));
  assert.deepEqual(compareDist(dist, skills).sort(), [
    'alpha.zip: arquivo a menos: extra.md',
    'beta.zip: arquivo a mais: sobra.md',
    'beta.zip: conteúdo diferente: SKILL.md',
    'skill sem ZIP: gamma',
  ]);
});

const V1_DIST = path.join(V1_ROOT, 'dist');
test('leitor de ZIP lê os artefatos do v1 (sanidade contra ZIPs externos)', { skip: !fs.existsSync(V1_DIST) && 'dist/ do v1 ausente' }, () => {
  const v1Dist = V1_DIST;
  assert.deepEqual(compareDist(v1Dist, path.join(V1_ROOT, 'skills')), []);
});
