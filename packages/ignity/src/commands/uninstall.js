'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { MANIFEST_PATH, IGNITY_DIR, BACKUPS_DIR, resolveInside, isProjectPath } = require('../lib/paths');
const { sha256File } = require('../lib/files');
const { readManifest } = require('../lib/manifest');
const { createBackup } = require('../lib/backup');
const { createWriter } = require('../lib/writer');
const { removeAdapterBlock } = require('../lib/sync');
const { detectV1 } = require('../lib/v1-detect');
const { CliError } = require('../lib/log');

/** AC 15: removes only what the manifest lists and is still unchanged. Never touches project/. */
function uninstall(ctx) {
  const { root, dryRun, force, out } = ctx;
  const manifest = readManifest(root);
  if (!manifest) {
    const hint = detectV1(root).detected
      ? ' Há sinais de uma instalação v1: rode `npx ignity-web update` para migrar e depois `npx ignity-web uninstall`.'
      : '';
    throw new CliError(`Nada a remover: ${MANIFEST_PATH} não encontrado nesta pasta.${hint}`);
  }

  out.line(`Ignity — uninstall${dryRun ? ' (simulação: nada será removido)' : ''}`);
  const writer = createWriter({ root, dryRun, out });
  const backup = createBackup({ root, dryRun, out });
  const kept = [];

  for (const f of manifest.files) {
    if (isProjectPath(f.path)) continue;
    if (f.kind === 'merged-block') {
      removeAdapterBlock({ root, rel: f.path, created: f.created, writer, backup, blockSha256: f.blockSha256 });
      continue;
    }
    const abs = resolveInside(root, f.path);
    if (!fs.existsSync(abs)) continue;
    if (sha256File(abs) === f.sha256) writer.remove(f.path);
    else if (force) {
      backup.save(f.path);
      writer.remove(f.path, 'alterado; removido por --force');
    } else {
      kept.push(f.path);
      out.warn(`${f.path} foi alterado depois da instalação e foi mantido. Use --force para removê-lo (com backup).`);
    }
  }

  // .ignity/ last; backups are preserved.
  const ignityAbs = resolveInside(root, IGNITY_DIR);
  if (fs.existsSync(ignityAbs)) {
    if (dryRun) out.line(`PREVER REMOVER ${MANIFEST_PATH}`);
    else {
      fs.rmSync(resolveInside(root, MANIFEST_PATH), { force: true });
      out.line(`REMOVIDO ${MANIFEST_PATH}`);
    }
    const backupsAbs = resolveInside(root, BACKUPS_DIR);
    const hasBackups = fs.existsSync(backupsAbs) && fs.readdirSync(backupsAbs).length > 0;
    if (hasBackups || (dryRun && backup.count > 0)) {
      out.line(`Backups mantidos em ${path.posix.join(BACKUPS_DIR)}/`);
    }
    if (!dryRun && fs.readdirSync(ignityAbs).length === 0) {
      fs.rmdirSync(ignityAbs);
    } else if (!dryRun && !hasBackups) {
      out.line('Arquivos restantes em .ignity/ foram mantidos.');
    }
  }

  out.line('');
  out.line('project/ não foi tocado.');
  if (kept.length) out.line(`${kept.length} arquivo(s) alterado(s) mantido(s).`);
  return 0;
}

module.exports = { uninstall };
