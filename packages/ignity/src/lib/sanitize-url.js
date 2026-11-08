'use strict';
const { CliError } = require('./log');
function sanitizeUrl(value, figma = false) {
  if (!value || value === 'desconhecido') return 'desconhecido';
  let url;
  try { url = new URL(value); } catch { throw new CliError('Informe uma URL http ou https válida, sem credenciais.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new CliError('Informe uma URL http ou https sem credenciais embutidas.');
  if (figma && !['figma.com', 'www.figma.com'].includes(url.hostname)) throw new CliError('O link do Figma deve usar figma.com ou www.figma.com.');
  const node = figma && url.searchParams.get('node-id');
  url.search = ''; url.hash = '';
  if (node) url.searchParams.set('node-id', node);
  return url.toString();
}
module.exports = { sanitizeUrl };
