'use strict';

/**
 * AC 16, 17, 17a: diagnostics. Each check is `{id, run(ctx) -> {level, message, fix}}`
 * so later epics (G4) can plug more checks in. Only local files are read; the CLI
 * never contacts the site. Exit 1 only when some check is FAIL.
 */

const fs = require('node:fs');
const { checkNodeVersion } = require('../lib/node-check');
const { FRAMEWORK_PATH, V1_FRAMEWORK_PATH, CLIENT_FOLDERS, SKILLS_DIR, MANIFEST_PATH, resolveInside } = require('../lib/paths');
const { listFiles, sha256File, sha256, readIfExists } = require('../lib/files');
const { readManifest } = require('../lib/manifest');
const { extractBody } = require('../lib/merger');
const { detectV1 } = require('../lib/v1-detect');
const { detectClient } = require('../lib/client-detect');
const { readMcpServerNames } = require('../lib/mcp-config');
const { missingTemplates, templateCopyHint } = require('../lib/sync');

const LEVELS = ['OK', 'INFO', 'WARN', 'FAIL'];

const ELEMENTOR_PLAN_REQUIREMENT =
  'Requer Elementor Pro Advanced ou superior (Advanced Solo em diante). O plano Essential não tem Custom Code, usado pelo runtime da Ignity Motion.';

const nodeCheck = {
  id: 'node',
  run(ctx) {
    const r = checkNodeVersion(ctx.nodeVersion || process.versions.node);
    return r.ok
      ? { level: 'OK', message: `Node.js ${r.found} (mínimo ${r.required}).` }
      : {
          level: 'FAIL',
          message: `Node.js ${r.found || 'desconhecido'} abaixo do mínimo ${r.required}.`,
          fix: 'Instale o Node 22 LTS ou mais novo em https://nodejs.org/ e rode o comando de novo.',
        };
  },
};

const manifestCheck = {
  id: 'manifest',
  run(ctx) {
    if (ctx.manifestError) {
      return {
        level: 'FAIL',
        message: ctx.manifestError,
        fix: 'Restaure o arquivo a partir de um backup ou apague-o e rode `npx ignity-web update` (instalações v1 são migradas).',
      };
    }
    if (ctx.manifest) return { level: 'OK', message: `${MANIFEST_PATH} válido (Ignity ${ctx.manifest.ignityVersion}, cliente ${ctx.manifest.client}).` };
    if (ctx.v1.detected) {
      return { level: 'WARN', message: 'Instalação v1 sem manifesto.', fix: 'Rode `npx ignity-web update` para migrar para o layout v2 (project/ não é tocado).' };
    }
    return { level: 'FAIL', message: `${MANIFEST_PATH} não encontrado.`, fix: 'Rode `npx ignity-web init` nesta pasta.' };
  },
};

const integrityCheck = {
  id: 'integrity',
  run(ctx) {
    if (!ctx.manifest) return { level: 'INFO', message: 'Sem manifesto: integridade não verificada.' };
    const changed = [];
    const missing = [];
    for (const f of ctx.manifest.files) {
      const abs = resolveInside(ctx.root, f.path);
      if (f.kind === 'merged-block') {
        const body = extractBody(readIfExists(abs, 'utf8'));
        if (body === null) missing.push(`${f.path} (bloco)`);
        else if (sha256(body) !== f.blockSha256) changed.push(`${f.path} (bloco)`);
      } else if (!fs.existsSync(abs)) missing.push(f.path);
      else if (sha256File(abs) !== f.sha256) changed.push(f.path);
    }
    if (!changed.length && !missing.length) return { level: 'OK', message: `${ctx.manifest.files.length} arquivo(s) do manifesto íntegros.` };
    const parts = [];
    if (changed.length) parts.push(`alterados: ${changed.join(', ')}`);
    if (missing.length) parts.push(`ausentes: ${missing.join(', ')}`);
    return { level: 'WARN', message: `Arquivos do Ignity divergem do manifesto (${parts.join('; ')}).`, fix: 'Rode `npx ignity-web update` (arquivos alterados vão para .ignity/backups/ antes da troca).' };
  },
};

const skillsCheck = {
  id: 'skills',
  run(ctx) {
    const expected = [...new Set(listFiles(SKILLS_DIR).map((rel) => rel.split('/')[0]))];
    const lines = [];
    let missingAny = false;
    for (const folder of CLIENT_FOLDERS[ctx.client]) {
      const found = expected.filter((s) => fs.existsSync(resolveInside(ctx.root, `${folder}/skills/${s}/SKILL.md`)));
      if (found.length < expected.length) missingAny = true;
      lines.push(`${folder}/skills: ${found.length}/${expected.length}`);
    }
    return missingAny
      ? { level: 'WARN', message: `Skills incompletas (${lines.join('; ')}).`, fix: 'Rode `npx ignity-web update` para reinstalar as skills.' }
      : { level: 'OK', message: `Skills encontradas (${lines.join('; ')}).` };
  },
};

const templatesCheck = {
  id: 'templates',
  run(ctx) {
    const missing = missingTemplates(ctx.root);
    if (!missing.length) return { level: 'OK', message: 'Templates de project/ presentes.' };
    return {
      level: 'WARN',
      message: `Templates ausentes em project/: ${missing.join(', ')}.`,
      fix: `O update não toca project/. Para copiar: ${missing.map((tpl) => templateCopyHint(tpl, ctx.root)).join(' ; ')} (ou rode \`npx ignity-web init\`, que só cria templates ausentes).`,
    };
  },
};

const obsoleteFrameworkCheck = {
  id: 'v1-framework',
  run(ctx) {
    if (!fs.existsSync(resolveInside(ctx.root, V1_FRAMEWORK_PATH))) return { level: 'OK', message: `Sem ${V1_FRAMEWORK_PATH} obsoleto.` };
    return {
      level: 'INFO',
      message: `${V1_FRAMEWORK_PATH} é da instalação v1 e está obsoleto; o guia atual fica em ${FRAMEWORK_PATH}.`,
      fix: 'Pode manter ou apagar o arquivo; o Ignity não remove nada de project/.',
    };
  },
};

function mcpCheck(id, label, pattern) {
  return {
    id,
    run(ctx) {
      const sources = readMcpServerNames(ctx.root, ctx.client, ctx.home);
      const hit = sources.find((s) => s.names.some((n) => pattern.test(n)));
      if (hit) return { level: 'OK', message: `Servidor MCP do ${label} declarado em ${hit.label}.` };
      const read = sources.filter((s) => s.readable).map((s) => `${s.label}: ${s.names.length} servidor(es)`);
      const unreadable = sources.filter((s) => s.exists && !s.readable).map((s) => s.label);
      const seen = read.length ? ` Lidos: ${read.join('; ')}.` : ' Nenhuma configuração MCP encontrada.';
      const bad = unreadable.length ? ` Não foi possível ler: ${unreadable.join(', ')}.` : '';
      return {
        level: 'WARN',
        message: `Servidor MCP do ${label} não declarado.${seen}${bad}`,
        fix: `Declare o servidor MCP do ${label} na configuração do cliente (${sources.map((s) => s.label).join(', ')}), com um nome que contenha "${label.toLowerCase()}". O Ignity não configura MCP nem acessa o site.`,
      };
    },
  };
}

/**
 * A9: Elementor Pro plan. Without verified evidence it is always INFO (never OK).
 * `ctx.elementorEvidence` = `{customCodeAvailable: boolean}` is the contract for a future source (G4).
 */
const elementorProPlanCheck = {
  id: 'elementor-pro-plan',
  run(ctx = {}) {
    const evidence = ctx.elementorEvidence;
    if (evidence && typeof evidence.customCodeAvailable === 'boolean') {
      return evidence.customCodeAvailable
        ? { level: 'OK', message: `${ELEMENTOR_PLAN_REQUIREMENT} Custom Code disponível.` }
        : { level: 'FAIL', message: `${ELEMENTOR_PLAN_REQUIREMENT} Custom Code indisponível.`, fix: 'Faça upgrade para Elementor Pro Advanced ou superior.' };
    }
    return {
      level: 'INFO',
      message: ELEMENTOR_PLAN_REQUIREMENT,
      fix: 'Confira o plano da sua licença na conta Elementor; se for Essential, faça upgrade para Advanced ou superior.',
    };
  },
};

const DEFAULT_CHECKS = [
  nodeCheck,
  manifestCheck,
  integrityCheck,
  skillsCheck,
  templatesCheck,
  obsoleteFrameworkCheck,
  mcpCheck('mcp-elementor', 'Elementor', /elementor/i),
  mcpCheck('mcp-figma', 'Figma', /figma/i),
  elementorProPlanCheck,
];

/** Runs checks; a throwing check becomes FAIL without echoing internal details. */
function runChecks(checks, ctx) {
  return checks.map((check) => {
    try {
      const r = check.run(ctx);
      if (!r || !LEVELS.includes(r.level)) throw new Error('resultado inválido');
      return { id: check.id, ...r };
    } catch (error) {
      return { id: check.id, level: 'FAIL', message: `Check falhou: ${error.message}`, fix: 'Rode com IGNITY_DEBUG=1 para detalhes.' };
    }
  });
}

function buildContext(ctx) {
  let manifest = null;
  let manifestError = null;
  try {
    manifest = readManifest(ctx.root);
  } catch (error) {
    manifestError = error.message;
  }
  const client = ctx.client || (manifest && manifest.client) || detectClient(ctx.root);
  return { ...ctx, manifest, manifestError, client, v1: detectV1(ctx.root) };
}

function doctor(ctx, checks = DEFAULT_CHECKS) {
  const full = buildContext(ctx);
  const results = runChecks(checks, full);
  full.out.line(`Ignity doctor — ${full.root} (cliente: ${full.client})`);
  for (const r of results) {
    full.out.line(`[${r.level}] ${r.id}: ${r.message}`);
    if (r.fix && r.level !== 'OK') full.out.line(`       → ${r.fix}`);
  }
  const count = (lvl) => results.filter((r) => r.level === lvl).length;
  full.out.line('');
  full.out.line(`Resumo: ${count('OK')} OK, ${count('INFO')} INFO, ${count('WARN')} WARN, ${count('FAIL')} FAIL.`);
  return count('FAIL') > 0 ? 1 : 0;
}

module.exports = { doctor, runChecks, DEFAULT_CHECKS, elementorProPlanCheck, nodeCheck, mcpCheck, ELEMENTOR_PLAN_REQUIREMENT };
