#!/usr/bin/env node
'use strict';

/**
 * Builds one deterministic ZIP per skill: content/skills/{skill}/ -> dist/{skill}.zip,
 * with the skill folder at the ZIP root (same layout as the v1 dist/ ZIPs).
 *
 * Usage: node scripts/build-dist.js [--out <dir>]
 */

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { createZip } = require('./lib/zip');
const { listFiles, sha256 } = require('./lib/fs-utils');

const PKG_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(PKG_ROOT, 'content', 'skills');

function listSkills(skillsDir = SKILLS_DIR) {
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function buildSkillZip(skill, skillsDir = SKILLS_DIR) {
  const skillDir = path.join(skillsDir, skill);
  const entries = listFiles(skillDir).map((rel) => ({
    name: `${skill}/${rel}`,
    data: fs.readFileSync(path.join(skillDir, rel)),
  }));
  if (entries.length === 0) throw new Error(`Skill without files: ${skill}`);
  return createZip(entries);
}

/**
 * @param {{outDir?: string, skillsDir?: string}} [options]
 * @returns {{skill: string, file: string, sha256: string}[]}
 */
function buildDist({ outDir = path.join(PKG_ROOT, 'dist'), skillsDir = SKILLS_DIR } = {}) {
  // Build everything in memory first: a failure leaves an existing outDir untouched.
  const built = listSkills(skillsDir).map((skill) => ({ skill, zip: buildSkillZip(skill, skillsDir) }));
  fs.mkdirSync(outDir, { recursive: true });
  // Only write the named artifacts for current skills; unrelated files stay intact.
  return built.map(({ skill, zip }) => {
    const file = path.join(outDir, `${skill}.zip`);
    fs.writeFileSync(file, zip);
    return { skill, file, sha256: sha256(zip) };
  });
}

if (require.main === module) {
  try {
    const { values } = parseArgs({ options: { out: { type: 'string' } } });
    const outDir = values.out ? path.resolve(values.out) : undefined;
    const results = buildDist({ outDir });
    for (const r of results) console.log(`${r.sha256}  ${path.relative(process.cwd(), r.file)}`);
    console.log(`${results.length} ZIPs gerados.`);
  } catch (error) {
    console.error(`Falha no build de dist/: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { buildDist, buildSkillZip, listSkills, SKILLS_DIR };
