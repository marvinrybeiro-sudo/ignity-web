'use strict';
const readline = require('node:readline/promises');
const { sanitizeUrl } = require('./sanitize-url');
const { CliError } = require('./log');
function environment(value) {
  value = value || 'staging';
  if (!['staging', 'produção', 'producao', 'production'].includes(value)) throw new CliError('Ambiente deve ser produção ou staging.');
  return value === 'staging' ? value : 'produção';
}
function clean(value) { return (value || 'desconhecido').replace(/[\r\n\x00-\x1f\x7f]/g, ' '); }
function answers(flags = {}) {
  return { site: sanitizeUrl(flags['site-url']), env: environment(flags.env), figma: sanitizeUrl(flags.figma, true), assets: clean(flags.assets || './assets'), scope: clean(flags.scope) };
}
async function ask(flags, out) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  async function question(label, initial, validate) {
    if (initial !== undefined) return validate(initial);
    for (;;) {
      try { return validate(await rl.question(label)); } catch (e) { out.warn(e.message); }
    }
  }
  try {
    const site = await question('URL do site WordPress (ambiente entre parênteses, padrão staging): ', flags['site-url'], value => {
      const match = value.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
      return { site: sanitizeUrl(match ? match[1].trim() : value), env: environment(flags.env || (match && match[2])) };
    });
    return { ...site, figma: await question('Link do Figma: ', flags.figma, v => sanitizeUrl(v, true)), assets: await question('Pasta dos assets [./assets]: ', flags.assets, v => clean(v || './assets')), scope: await question('O que construir agora: ', flags.scope, clean) };
  } finally { rl.close(); }
}
module.exports = { answers, ask };
