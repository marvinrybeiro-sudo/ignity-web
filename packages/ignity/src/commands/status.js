'use strict';

const fs = require('node:fs');
const { resolveInside } = require('../lib/paths');
const { readManifest } = require('../lib/manifest');
const { detectV1 } = require('../lib/v1-detect');
const { PKG_VERSION } = require('../lib/sync');

/** Text under a `## {title}` heading, until the next `## `. */
function section(text, title) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${title}`.toLowerCase());
  if (start < 0) return null;
  const body = [];
  for (const l of lines.slice(start + 1)) {
    if (/^##\s/.test(l)) break;
    body.push(l);
  }
  return body;
}

/** Tolerant reader of the v1 STATE.md (Markdown): active goal and the Etapas table. */
function parseState(text) {
  const goalLines = section(text, 'Objetivo ativo');
  const goal = goalLines ? goalLines.map((l) => l.trim()).filter(Boolean).join(' ') : null;
  const stages = [];
  for (const l of section(text, 'Etapas') || []) {
    if (!l.trim().startsWith('|')) continue;
    const cells = l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.length < 2 || /^:?-+:?$/.test(cells[0]) || cells[0].toLowerCase() === 'etapa') continue;
    stages.push({ stage: cells[0], state: cells[1] || '' });
  }
  return { goal, stages };
}

/** AC 18: read-only summary. */
function status(ctx) {
  const { root, out } = ctx;
  const manifest = readManifest(root);
  out.line(`Pacote: ignity ${PKG_VERSION}`);
  if (manifest) {
    out.line(`Instalado: ${manifest.ignityVersion}${manifest.ignityVersion === PKG_VERSION ? '' : ' (rode `npx ignity-web update`)'}`);
    out.line(`Cliente: ${manifest.client}`);
    out.line(`Última atualização: ${manifest.updatedAt}`);
  } else if (detectV1(root).detected) {
    out.line('Instalado: v1 (sem manifesto). Rode `npx ignity-web update` para migrar.');
  } else {
    out.line('Instalado: não (rode `npx ignity-web init`).');
  }

  const stateFile = resolveInside(root, 'project/STATE.md');
  if (!fs.existsSync(stateFile)) {
    out.line('project/STATE.md não encontrado. Para começar, carregue /web-orchestrator no seu cliente.');
    return 0;
  }
  const { goal, stages } = parseState(fs.readFileSync(stateFile, 'utf8'));
  out.line('');
  out.line(`Objetivo ativo: ${goal || '(não preenchido)'}`);
  if (stages.length) {
    out.line('Etapas:');
    const width = Math.max(...stages.map((s) => s.stage.length));
    for (const s of stages) out.line(`  ${s.stage.padEnd(width)}  ${s.state}`);
  }
  return 0;
}

module.exports = { status, parseState };
