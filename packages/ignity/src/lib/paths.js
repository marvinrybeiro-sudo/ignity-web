'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PKG_ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(PKG_ROOT, 'content');
const SKILLS_DIR = path.join(CONTENT_DIR, 'skills');
const TEMPLATES_DIR = path.join(CONTENT_DIR, 'templates');
const ADAPTERS_DIR = path.join(CONTENT_DIR, 'adapters');
const FRAMEWORK_SOURCE = path.join(CONTENT_DIR, 'framework', 'FRAMEWORK.md');

const IGNITY_DIR = '.ignity';
const MANIFEST_PATH = '.ignity/manifest.json';
const FRAMEWORK_PATH = '.ignity/framework/FRAMEWORK.md';
const BACKUPS_DIR = '.ignity/backups';
const PROJECT_DIR = 'project';
const V1_FRAMEWORK_PATH = 'project/framework/FRAMEWORK.md';

const CLIENTS = ['claude', 'codex', 'both'];
const CLIENT_FOLDERS = { claude: ['.claude'], codex: ['.agents'], both: ['.claude', '.agents'] };
const CLIENT_ADAPTERS = { claude: ['CLAUDE.md'], codex: ['AGENTS.md'], both: ['CLAUDE.md', 'AGENTS.md'] };

/** A manifest/relative path is safe when it is POSIX, relative and has no `..`, `.` or empty segments. */
function isSafeRelative(rel) {
  if (typeof rel !== 'string' || rel === '' || rel.includes('\\') || rel.includes('\0')) return false;
  if (rel.startsWith('/') || /^[A-Za-z]:/.test(rel)) return false;
  return rel.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}

function isInside(root, abs) {
  return abs === root || abs.startsWith(root + path.sep);
}

/**
 * Resolves `rel` inside `root` (which must already be a real path). Throws on path
 * traversal and when an existing ancestor is a symlink that escapes `root`.
 */
function resolveInside(root, rel) {
  if (!isSafeRelative(rel)) throw new Error(`Caminho inseguro recusado: ${JSON.stringify(rel)}`);
  const abs = path.resolve(root, ...rel.split('/'));
  if (!isInside(root, abs)) throw new Error(`Caminho fora da pasta do projeto recusado: ${rel}`);
  let probe = abs;
  while (probe !== root && !fs.existsSync(probe)) probe = path.dirname(probe);
  if (!isInside(root, fs.realpathSync(probe))) {
    throw new Error(`Caminho que aponta para fora da pasta do projeto (link simbólico) recusado: ${rel}`);
  }
  return abs;
}

function isProjectPath(rel) {
  return rel === PROJECT_DIR || rel.startsWith(`${PROJECT_DIR}/`);
}

// Resolve existing ancestors so aliases into project/ cannot bypass its guard,
// including when the final file does not exist yet.
function canonicalPath(abs) {
  let probe = abs;
  while (!fs.existsSync(probe)) {
    const parent = path.dirname(probe);
    if (parent === probe) break;
    probe = parent;
  }
  return path.resolve(fs.realpathSync(probe), path.relative(probe, abs));
}

function resolvesToProject(root, abs) {
  return isInside(canonicalPath(path.join(root, PROJECT_DIR)), canonicalPath(abs));
}

module.exports = {
  PKG_ROOT,
  CONTENT_DIR,
  SKILLS_DIR,
  TEMPLATES_DIR,
  ADAPTERS_DIR,
  FRAMEWORK_SOURCE,
  IGNITY_DIR,
  MANIFEST_PATH,
  FRAMEWORK_PATH,
  BACKUPS_DIR,
  PROJECT_DIR,
  V1_FRAMEWORK_PATH,
  CLIENTS,
  CLIENT_FOLDERS,
  CLIENT_ADAPTERS,
  isSafeRelative,
  resolveInside,
  isProjectPath,
  resolvesToProject,
};
