'use strict';

/**
 * Shared engine of `init` and `update`: computes the package layout for a client,
 * reconciles it with what is on disk (v2 manifest or v1 hashes as baseline),
 * merges the adapter blocks and rewrites the manifest.
 */

const fs = require('node:fs');
const path = require('node:path');
const {
  SKILLS_DIR,
  TEMPLATES_DIR,
  ADAPTERS_DIR,
  FRAMEWORK_SOURCE,
  FRAMEWORK_PATH,
  MANIFEST_PATH,
  V1_FRAMEWORK_PATH,
  CLIENT_FOLDERS,
  CLIENT_ADAPTERS,
  resolveInside,
} = require('./paths');
const { listFiles, sha256, sha256File, readIfExists } = require('./files');
const { readManifest, writeManifest, serializeManifest } = require('./manifest');
const merger = require('./merger');
const { createBackup } = require('./backup');
const { createWriter } = require('./writer');
const { detectClient } = require('./client-detect');
const { detectV1, v1Hashes, v1AdapterText } = require('./v1-detect');
const { CliError } = require('./log');
const { version: PKG_VERSION } = require('../../package.json');

/** Files the package installs for `client` (skills + framework guide), excluding adapters and templates. */
function desiredFiles(client) {
  const skills = listFiles(SKILLS_DIR);
  const out = [];
  for (const folder of CLIENT_FOLDERS[client]) {
    for (const rel of skills) out.push({ path: `${folder}/skills/${rel}`, source: path.join(SKILLS_DIR, rel) });
  }
  out.push({ path: FRAMEWORK_PATH, source: FRAMEWORK_SOURCE });
  return out;
}

function desiredAdapters(client) {
  return CLIENT_ADAPTERS[client].map((name) => ({ path: name, source: path.join(ADAPTERS_DIR, name) }));
}

/** Templates from the package that are missing in project/. */
function missingTemplates(root) {
  return listFiles(TEMPLATES_DIR).filter((tpl) => !fs.existsSync(resolveInside(root, `project/${tpl}`)));
}

function templateCopyHint(tpl, root) {
  const quote = (value) => `'${value.replace(/'/g, "'\\''")}'`;
  return `cp ${quote(path.join(TEMPLATES_DIR, tpl))} ${quote(path.join(root, 'project', tpl))}`;
}

/**
 * @param {{root: string, dryRun: boolean, client?: string, out: object}} ctx
 * @param {{mode: 'init'|'update'}} options
 * @returns {number} exit code
 */
function sync(ctx, { mode }) {
  const { root, dryRun, out } = ctx;
  const existing = readManifest(root);
  const v1 = existing ? null : detectV1(root);
  const migrating = Boolean(v1 && v1.detected);

  if (mode === 'update' && !existing && !migrating) {
    throw new CliError(
      'Nenhuma instalação do Ignity encontrada nesta pasta (sem .ignity/manifest.json e sem sinais do v1). ' +
        'Para instalar, rode: npx ignity-web init',
    );
  }

  const client = ctx.client || (existing && existing.client) || detectClient(root);
  const previous = new Map(((existing && existing.files) || []).map((f) => [f.path, f]));
  // Different client adapters cannot safely share one physical file: each has
  // a different block, and updating or removing either would affect the other.
  // Check before creating skills, backups, or any other files.
  const adapters = new Set(desiredAdapters(client).map((a) => a.path));
  for (const entry of previous.values()) if (entry.kind === 'merged-block') adapters.add(entry.path);
  const seenAdapters = new Map();
  for (const rel of adapters) {
    const abs = resolveInside(root, rel);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    const identity = `${stat.dev}:${stat.ino}`;
    if (seenAdapters.has(identity)) {
      throw new CliError(`${seenAdapters.get(identity)} e ${rel} apontam para o mesmo arquivo. Separe os arquivos antes de executar o Ignity novamente.`);
    }
    seenAdapters.set(identity, rel);
  }
  const baseline = migrating ? v1Hashes() : new Map([...previous.values()].filter((f) => !f.kind).map((f) => [f.path, f.sha256]));

  out.line(`Ignity ${PKG_VERSION} — ${mode}${dryRun ? ' (simulação: nada será gravado)' : ''}`);
  out.line(`Pasta: ${root}`);
  out.line(`Cliente: ${client}${ctx.client ? '' : existing ? ' (do manifesto)' : ' (detectado)'}`);

  if (migrating) {
    out.line('Instalação v1 detectada (sem .ignity/manifest.json). Migrando para o layout v2.');
    for (const l of v1.describe()) out.line(`  ${l}`);
    if (!v1.skillSignals.length) {
      out.warn(`skills v1 não encontradas; as skills serão instaladas do zero em ${CLIENT_FOLDERS[client].join(' e ')}.`);
    }
  }

  const writer = createWriter({ root, dryRun, out, allowProjectCreate: mode === 'init' });
  const backup = createBackup({ root, dryRun, out });
  const entries = [];
  const desired = desiredFiles(client);
  const desiredPaths = new Set(desired.map((d) => d.path));

  // Skills and framework guide.
  for (const d of desired) {
    const data = fs.readFileSync(d.source);
    const hash = sha256(data);
    const abs = resolveInside(root, d.path);
    const prev = previous.get(d.path);
    let created;
    if (!fs.existsSync(abs)) {
      writer.create(d.path, data);
      created = prev ? prev.created : true;
    } else {
      const current = sha256File(abs);
      const known = baseline.get(d.path);
      created = prev ? prev.created : Boolean(known);
      if (current !== hash) {
        if (known && current === known) {
          backup.save(d.path);
          writer.update(d.path, data);
        } else {
          const copy = backup.save(d.path);
          out.warn(`${d.path} foi alterado fora do Ignity; cópia salva em ${copy} e arquivo substituído pela versão do pacote.`);
          writer.update(d.path, data);
        }
      }
    }
    entries.push({ path: d.path, sha256: hash, owner: 'ignity', created });
  }

  // Files from a previous manifest that the package no longer installs (e.g. client narrowed).
  for (const prev of previous.values()) {
    if (prev.kind || desiredPaths.has(prev.path)) continue;
    const abs = resolveInside(root, prev.path);
    if (!fs.existsSync(abs)) continue;
    if (sha256File(abs) === prev.sha256) writer.remove(prev.path, 'não faz mais parte da instalação');
    else out.warn(`${prev.path} não faz mais parte da instalação, mas foi alterado; mantido no lugar.`);
  }

  // Adapter blocks.
  const desiredAdapterPaths = new Set();
  for (const a of desiredAdapters(client)) {
    desiredAdapterPaths.add(a.path);
    const body = fs.readFileSync(a.source, 'utf8');
    const prev = previous.get(a.path);
    const text = readIfExists(resolveInside(root, a.path), 'utf8');
    let created = prev ? prev.created : false;
    let next;
    let note;
    if (text === null) {
      next = merger.upsertBlock(null, body);
      created = true;
    } else if (merger.hasBlock(text)) {
      next = merger.upsertBlock(text, body);
    } else if (migrating && sha256(text) === (v1Hashes().get(a.path) || '')) {
      next = merger.upsertBlock(null, body);
      created = true;
      note = 'adapter v1 trocado pelo bloco com marcadores';
    } else if (migrating && v1AdapterText(a.path) && merger.replaceTextWithBlock(text, v1AdapterText(a.path), body) !== null) {
      next = merger.replaceTextWithBlock(text, v1AdapterText(a.path), body);
      note = 'trecho v1 trocado pelo bloco com marcadores';
    } else {
      next = merger.upsertBlock(text, body);
      note = 'bloco anexado ao final; conteúdo existente preservado';
      if (migrating) out.warn(`${a.path} não contém o texto do adapter v1; o bloco do Ignity foi anexado ao final. Revise se há instruções duplicadas.`);
    }
    if (text === null) writer.create(a.path, next);
    else if (next !== text) {
      backup.save(a.path);
      writer.update(a.path, next, note);
    }
    entries.push({ path: a.path, kind: 'merged-block', owner: 'ignity', created, blockSha256: sha256(merger.normalizeBody(body, '\n')) });
  }

  // Adapter blocks of a client that is no longer installed.
  for (const prev of previous.values()) {
    if (prev.kind !== 'merged-block' || desiredAdapterPaths.has(prev.path)) continue;
    removeAdapterBlock({ root, rel: prev.path, created: prev.created, writer, backup });
  }

  // Templates in project/.
  if (mode === 'init') {
    for (const tpl of listFiles(TEMPLATES_DIR)) {
      const rel = `project/${tpl}`;
      if (!fs.existsSync(resolveInside(root, rel))) writer.create(rel, tpl === 'BRIEF.md' && ctx.brief ? ctx.brief : fs.readFileSync(path.join(TEMPLATES_DIR, tpl)));
    }
  } else {
    for (const tpl of missingTemplates(root)) {
      out.warn(`template project/${tpl} ausente. O update não toca project/; para copiá-lo: ${templateCopyHint(tpl, root)}`);
    }
  }

  if (fs.existsSync(resolveInside(root, V1_FRAMEWORK_PATH))) {
    out.line(`INFO: ${V1_FRAMEWORK_PATH} é da instalação v1 e ficou onde está (obsoleto). O guia atual está em ${FRAMEWORK_PATH}.`);
  }

  // Manifest (rewritten only when something changed, so a no-op run leaves no diff).
  const now = new Date().toISOString();
  const manifest = {
    ignityVersion: PKG_VERSION,
    client,
    installedAt: (existing && existing.installedAt) || now,
    updatedAt: now,
    files: entries,
  };
  const unchanged =
    existing &&
    writer.changes === 0 &&
    serializeManifest({ ...manifest, updatedAt: existing.updatedAt }) === serializeManifest(existing);
  if (!unchanged) {
    if (dryRun) out.line(`${existing ? 'PREVER ATUALIZAR' : 'PREVER CRIAR'} ${MANIFEST_PATH}`);
    else {
      writeManifest(root, manifest);
      out.line(`${existing ? 'ATUALIZADO' : 'CRIADO'} ${MANIFEST_PATH}`);
    }
  }

  out.line('');
  if (writer.changes === 0 && unchanged) out.line('Nada a fazer: a instalação já está na versão do pacote.');
  if (backup.count > 0 && !dryRun) out.line(`Backups em ${backup.dir}/`);
  if (out.warnings.length) out.line(`${out.warnings.length} aviso(s) acima.`);
  return 0;
}

/** Removes the Ignity block from an adapter; deletes the file if Ignity created it and it became empty. */
function removeAdapterBlock({ root, rel, created, writer, backup, blockSha256 }) {
  const text = readIfExists(resolveInside(root, rel), 'utf8');
  if (text === null || !merger.hasBlock(text)) return false;
  const next = merger.removeBlock(text);
  if (created && next.trim() === '') {
    if (blockSha256 && sha256(merger.extractBody(text)) !== blockSha256) backup.save(rel);
    writer.remove(rel, 'criado pelo Ignity e vazio sem o bloco');
  } else {
    backup.save(rel);
    writer.update(rel, next, 'bloco do Ignity removido');
  }
  return true;
}

module.exports = { sync, desiredFiles, desiredAdapters, missingTemplates, templateCopyHint, removeAdapterBlock, PKG_VERSION };
