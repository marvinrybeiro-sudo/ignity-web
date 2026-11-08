'use strict';

/** Argument parsing and command routing (AC 1, 2). Loaded by bin/ignity.js after the Node check. */

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { CLIENTS } = require('./lib/paths');
const { CliError, createOutput } = require('./lib/log');
const { version } = require('../package.json');

const COMMANDS = {
  init: () => require('./commands/init').init,
  update: () => require('./commands/update').update,
  doctor: () => require('./commands/doctor').doctor,
  status: () => require('./commands/status').status,
  uninstall: () => require('./commands/uninstall').uninstall,
};

const HELP = `ignity ${version} — framework agêntico para sites WordPress + Elementor (Claude Code e Codex)

Uso: npx ignity-web <comando> [opções]

Comandos:
  init        instala skills, guia, templates de project/ (só os ausentes) e o bloco do CLAUDE.md/AGENTS.md
  update      atualiza skills, guia e bloco dos adapters; migra instalações v1; nunca toca project/
  doctor      diagnostica a instalação (Node, manifesto, integridade, skills, templates, MCP, plano Elementor)
  status      mostra versão, cliente, última atualização e o resumo de project/STATE.md
  uninstall   remove só o que o Ignity instalou e não foi alterado; nunca remove project/

Opções:
  --dir <caminho>               pasta do projeto (padrão: diretório atual)
  --client claude|codex|both    cliente (padrão: detectado; sem sinais, both)
  --dry-run                     só lista o que seria feito (PREVER CRIAR/ATUALIZAR/REMOVER)
  --yes                         init: não faz perguntas
  --site-url <url> --env staging|produção --figma <url> --assets <pasta> --scope <texto>
  --force                       uninstall: remove também arquivos alterados (com backup)
  -h, --help                    mostra esta ajuda
  -v, --version                 mostra a versão

Requisitos: Node.js 22+, Claude Code e/ou Codex, Elementor Pro Advanced ou superior.`;

const OPTIONS = {
  yes: { type: 'boolean', default: false },
  'site-url': { type: 'string' },
  env: { type: 'string' },
  figma: { type: 'string' },
  assets: { type: 'string' },
  scope: { type: 'string' },
  dir: { type: 'string' },
  client: { type: 'string' },
  'dry-run': { type: 'boolean', default: false },
  force: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
  version: { type: 'boolean', short: 'v', default: false },
};

function resolveDir(dir, cwd) {
  const abs = path.resolve(cwd, dir || '.');
  let stat;
  try {
    stat = fs.statSync(abs);
  } catch {
    throw new CliError(`A pasta ${abs} não existe. Crie-a ou passe outra com --dir.`);
  }
  if (!stat.isDirectory()) throw new CliError(`${abs} não é uma pasta. Passe uma pasta com --dir.`);
  return fs.realpathSync(abs);
}

/**
 * @param {string[]} argv arguments after the script name
 * @param {{out?: object, cwd?: string}} [io]
 * @returns {number} exit code
 */
function main(argv, io = {}) {
  const out = io.out || createOutput();
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    out.error(`Erro: ${error.message}\n`);
    out.error(HELP);
    return 1;
  }
  const { values, positionals } = parsed;
  if (values.version) {
    out.line(version);
    return 0;
  }
  if (values.help) {
    out.line(HELP);
    return 0;
  }
  const [command, ...extra] = positionals;
  if (!command || !COMMANDS[command] || extra.length) {
    out.error(command ? `Erro: comando desconhecido: ${[command, ...extra].join(' ')}\n` : 'Erro: informe um comando.\n');
    out.error(HELP);
    return 1;
  }
  if (values.client !== undefined && !CLIENTS.includes(values.client)) {
    out.error(`Erro: --client deve ser ${CLIENTS.join(', ')}.`);
    return 1;
  }

  try {
    const ctx = {
      root: resolveDir(values.dir, io.cwd || process.cwd()),
      client: values.client,
      dryRun: values['dry-run'],
      force: values.force,
      out,
      flags: values,
    };
    const result = COMMANDS[command]()(ctx);
    if (result && typeof result.then === "function") return result.catch(error => { out.error(`Erro: ${error.message}`); return 1; });
    return result;
  } catch (error) {
    out.error(`Erro: ${error.message}`);
    if (process.env.IGNITY_DEBUG === '1' && error.stack) out.error(error.stack);
    return error instanceof CliError ? error.exitCode : 1;
  }
}

module.exports = { main, HELP };
