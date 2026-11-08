#!/usr/bin/env node
'use strict';

/**
 * Generates test/fixtures/v1-manifest.json: every file that the v1 installer
 * (framework-agentico-web/scripts/instalar.py) installs in `--client both` mode,
 * with destination path, source path (relative to the v1 kit) and SHA-256.
 *
 * Mirrors the pairs built by instalar.py (lines 18-29):
 *   skills/**            -> {.agents|.claude}/skills/**
 *   adapters/AGENTS.md   -> AGENTS.md          (codex)
 *   adapters/CLAUDE.md   -> CLAUDE.md          (claude)
 *   templates/*          -> project/*
 *   FRAMEWORK.md         -> project/framework/FRAMEWORK.md
 *
 * Output has no timestamps and is sorted, so re-running does not change the file.
 *
 * Usage: node scripts/snapshot-v1.js [--v1 <dir>] [--out <file>]
 */

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { listFiles, sha256File } = require('./lib/fs-utils');

const PKG_ROOT = path.resolve(__dirname, '..');
const DEFAULT_V1 = path.resolve(PKG_ROOT, '..', '..', 'framework-agentico-web');
const DEFAULT_OUT = path.join(PKG_ROOT, 'test', 'fixtures', 'v1-manifest.json');

const CLIENTS = [
  { client: 'codex', folder: '.agents', adapter: 'AGENTS.md' },
  { client: 'claude', folder: '.claude', adapter: 'CLAUDE.md' },
];

function v1Pairs(v1Root) {
  const pairs = [];
  for (const { folder, adapter } of CLIENTS) {
    for (const rel of listFiles(path.join(v1Root, 'skills'))) {
      pairs.push({ source: `skills/${rel}`, path: `${folder}/skills/${rel}` });
    }
    pairs.push({ source: `adapters/${adapter}`, path: adapter });
  }
  for (const dirent of fs.readdirSync(path.join(v1Root, 'templates'), { withFileTypes: true })) {
    if (dirent.isFile()) pairs.push({ source: `templates/${dirent.name}`, path: `project/${dirent.name}` });
  }
  pairs.push({ source: 'FRAMEWORK.md', path: 'project/framework/FRAMEWORK.md' });
  return pairs;
}

function buildManifest(v1Root = DEFAULT_V1) {
  const files = v1Pairs(v1Root)
    .map((p) => ({ path: p.path, source: p.source, sha256: sha256File(path.join(v1Root, p.source)) }))
    .sort((a, b) => Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)));
  return {
    description: 'Arquivos instalados pelo instalar.py v1 no modo both (gerado por scripts/snapshot-v1.js).',
    installer: 'framework-agentico-web/scripts/instalar.py',
    mode: 'both',
    count: files.length,
    files,
  };
}

function serialize(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

if (require.main === module) {
  try {
    const { values } = parseArgs({ options: { v1: { type: 'string' }, out: { type: 'string' } } });
    const v1Root = values.v1 ? path.resolve(values.v1) : DEFAULT_V1;
    const out = values.out ? path.resolve(values.out) : DEFAULT_OUT;
    const manifest = buildManifest(v1Root);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, serialize(manifest));
    console.log(`${manifest.count} arquivos gravados em ${path.relative(process.cwd(), out)}`);
  } catch (error) {
    console.error(`Falha ao gerar o snapshot do v1: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { buildManifest, serialize, v1Pairs, DEFAULT_V1, DEFAULT_OUT };
