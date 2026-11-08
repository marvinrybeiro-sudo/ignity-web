'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { sync } = require('../lib/sync');
const { detectClient } = require('../lib/client-detect');
const { answers, ask } = require('../lib/prompt');
const { doctor } = require('./doctor');
const ELEMENTOR_REQUIREMENT = 'Requisito: Elementor Pro Advanced ou superior (Advanced Solo em diante); o plano Essential não tem Custom Code, usado pelo runtime da Ignity Motion.';
const NO_SITE_ACTION = 'A conexão MCP é configurada separadamente no cliente. O CLI não agiu no site.';
function finish(ctx, values) {
  if (values) {
    const template = fs.readFileSync(path.resolve(__dirname, '../../content/templates/BRIEF.md'), 'utf8');
    ctx.brief = template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key]);
    if (!fs.existsSync(path.resolve(ctx.root, values.assets))) ctx.out.warn('pasta não encontrada, crie e exporte os assets do Figma nela');
  }
  const code = sync(ctx, { mode: 'init' });
  if (!ctx.dryRun) {
    doctor({ ...ctx, out: { line: text => { if (/^\[(WARN|FAIL)\]/.test(text)) ctx.out.line(text); } } });
    ctx.out.line(ELEMENTOR_REQUIREMENT);
    ctx.out.line(NO_SITE_ACTION);
    ctx.out.line(`Próximo passo: abra ${ctx.client === 'codex' ? 'o Codex e carregue a skill web-orchestrator' : ctx.client === 'both' ? 'o Claude Code e digite /web-orchestrator, ou carregue a skill web-orchestrator no Codex' : 'o Claude Code e digite /web-orchestrator'}`);
  }
  return code;
}
function init(ctx) {
  ctx.client = ctx.client || detectClient(ctx.root);
  ctx.out.line(`Detectado: ${ctx.client === 'claude' ? 'Claude Code (.claude/)' : ctx.client === 'codex' ? 'Codex (.agents/)' : 'Claude Code e Codex'} · ${['CLAUDE.md', 'AGENTS.md'].filter(f => fs.existsSync(path.join(ctx.root, f))).map(f => `${f} existente → mesclado`).join(' · ')}`);
  if (fs.existsSync(path.join(ctx.root, 'project/BRIEF.md'))) {
    ctx.out.line('BRIEF existente preservado');
    return finish(ctx);
  }
  const flags = ctx.flags || {};
  if (!ctx.dryRun && !flags.yes && process.stdin.isTTY && process.stdout.isTTY) return ask(flags, ctx.out).then(values => finish(ctx, values));
  return finish(ctx, answers(flags));
}
module.exports = { init, ELEMENTOR_REQUIREMENT, NO_SITE_ACTION };
