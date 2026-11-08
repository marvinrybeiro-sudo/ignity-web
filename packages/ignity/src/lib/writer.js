'use strict';

/**
 * Single choke point for every write/remove the CLI makes (AC 2, AC 11).
 * - `--dry-run`: prints PREVER CRIAR / ATUALIZAR / REMOVER and touches nothing.
 * - project/ guard: only `init` may create a missing file there; nothing else, ever.
 * - every path is resolved inside the target dir (path traversal / symlink guard).
 */

const fs = require('node:fs');
const path = require('node:path');
const { resolveInside, isProjectPath, resolvesToProject } = require('./paths');
const { atomicWriteFile } = require('./files');

const LABELS = {
  create: ['PREVER CRIAR', 'CRIADO'],
  update: ['PREVER ATUALIZAR', 'ATUALIZADO'],
  remove: ['PREVER REMOVER', 'REMOVIDO'],
};

/**
 * @param {{root: string, dryRun: boolean, out: object, allowProjectCreate?: boolean}} options
 */
function createWriter({ root, dryRun, out, allowProjectCreate = false }) {
  let changes = 0;

  function guard(op, rel) {
    const abs = resolveInside(root, rel);
    if (isProjectPath(rel) || resolvesToProject(root, abs)) {
      const allowed = isProjectPath(rel) && op === 'create' && allowProjectCreate && !fs.existsSync(abs);
      if (!allowed) throw new Error(`Operação recusada: o Ignity não altera nem remove nada em project/ (${rel}).`);
    }
    return abs;
  }

  function report(op, rel, note) {
    const label = LABELS[op][dryRun ? 0 : 1];
    out.line(`${label} ${rel}${note ? ` (${note})` : ''}`);
    changes++;
  }

  return {
    get changes() {
      return changes;
    },
    create(rel, data, note) {
      const abs = guard('create', rel);
      if (!dryRun) atomicWriteFile(abs, data);
      report('create', rel, note);
    },
    update(rel, data, note) {
      const abs = guard('update', rel);
      if (!dryRun) atomicWriteFile(abs, data);
      report('update', rel, note);
    },
    remove(rel, note) {
      const abs = guard('remove', rel);
      if (!dryRun) {
        fs.rmSync(abs, { force: true });
        pruneEmptyDirs(root, path.dirname(abs));
      }
      report('remove', rel, note);
    },
  };
}

/** Removes empty parent dirs, stopping below the first level (`.claude/`, `.agents/`, `.ignity/` stay). */
function pruneEmptyDirs(root, dir) {
  let current = dir;
  while (current !== root && path.dirname(current) !== root) {
    try {
      if (fs.readdirSync(current).length > 0) return;
      fs.rmdirSync(current);
    } catch {
      return;
    }
    current = path.dirname(current);
  }
}

module.exports = { createWriter, pruneEmptyDirs };
