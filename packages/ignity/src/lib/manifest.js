'use strict';

/**
 * AC 4 and AC 5: `.ignity/manifest.json`. Holds only versions, client, dates,
 * relative paths and hashes — never environment values, tokens or URLs (Q-04).
 */

const fs = require('node:fs');
const { MANIFEST_PATH, CLIENTS, isSafeRelative, resolveInside } = require('./paths');
const { atomicWriteFile, sha256, sha256File } = require('./files');

const HEX64 = /^[0-9a-f]{64}$/;

/** @returns {string[]} validation problems (empty when valid) */
function validateManifest(data) {
  const problems = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['o manifesto não é um objeto JSON'];
  if (typeof data.ignityVersion !== 'string' || !data.ignityVersion) problems.push('ignityVersion ausente');
  if (!CLIENTS.includes(data.client)) problems.push(`client inválido (use ${CLIENTS.join(', ')})`);
  for (const key of ['installedAt', 'updatedAt']) {
    if (typeof data[key] !== 'string' || Number.isNaN(Date.parse(data[key]))) problems.push(`${key} inválido`);
  }
  if (!Array.isArray(data.files)) return [...problems, 'files[] ausente'];
  const seen = new Set();
  data.files.forEach((f, i) => {
    const label = `files[${i}]`;
    if (!f || typeof f !== 'object') return problems.push(`${label} não é objeto`);
    if (!isSafeRelative(f.path)) problems.push(`${label}: caminho inseguro`);
    else if (seen.has(f.path)) problems.push(`${label}: caminho duplicado ${f.path}`);
    else seen.add(f.path);
    if (f.owner !== 'ignity') problems.push(`${label}: owner deve ser "ignity"`);
    if (typeof f.created !== 'boolean') problems.push(`${label}: created deve ser booleano`);
    if (f.kind === 'merged-block') {
      if (!HEX64.test(f.blockSha256 || '')) problems.push(`${label}: blockSha256 inválido`);
    } else if (f.kind !== undefined) problems.push(`${label}: kind desconhecido`);
    else if (!HEX64.test(f.sha256 || '')) problems.push(`${label}: sha256 inválido`);
  });
  return problems;
}

/**
 * @returns {object|null} parsed manifest, or null when it does not exist
 * @throws when the manifest exists but is unreadable or invalid
 */
function readManifest(root) {
  const file = resolveInside(root, MANIFEST_PATH);
  if (!fs.existsSync(file)) return null;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    // The parser error is not echoed: it may quote file content.
    throw new Error(`${MANIFEST_PATH} não é um JSON válido.`);
  }
  const problems = validateManifest(data);
  if (problems.length) throw new Error(`${MANIFEST_PATH} inválido: ${problems.join('; ')}.`);
  return data;
}

function serializeManifest(data) {
  const files = [...data.files].sort((a, b) => Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)));
  return `${JSON.stringify({ ...data, files }, null, 2)}\n`;
}

function writeManifest(root, data) {
  const problems = validateManifest(data);
  if (problems.length) throw new Error(`Manifesto gerado inválido: ${problems.join('; ')}.`);
  atomicWriteFile(resolveInside(root, MANIFEST_PATH), serializeManifest(data));
}

module.exports = { validateManifest, readManifest, writeManifest, serializeManifest, sha256, sha256File };
