'use strict';

/**
 * AC 1a: runtime Node.js version check.
 *
 * This file is required by bin/ignity.js before anything else, so it must parse
 * on old Node versions: ES5 syntax only (var, function, string concatenation).
 */

var REQUIRED_MAJOR = 22;

/**
 * @param {string} versionString e.g. "22.1.0" or "v20.11.0"
 * @returns {{ok: boolean, found: string, major: number, required: number, message: string}}
 */
function checkNodeVersion(versionString) {
  var found = String(versionString || '').replace(/^v/, '');
  var major = parseInt(found.split('.')[0], 10);
  var ok = !isNaN(major) && major >= REQUIRED_MAJOR;
  var message = ok
    ? 'Node.js ' + found + ' (mínimo exigido: ' + REQUIRED_MAJOR + ').'
    : 'O Ignity precisa do Node.js ' + REQUIRED_MAJOR + ' ou mais novo. Versão encontrada: ' +
      (found || 'desconhecida') + '. Mínima exigida: ' + REQUIRED_MAJOR + '.\n' +
      'Próximo passo: instale o Node 22 LTS ou mais novo em https://nodejs.org/ e rode o comando de novo.';
  return { ok: ok, found: found, major: major, required: REQUIRED_MAJOR, message: message };
}

module.exports = { checkNodeVersion: checkNodeVersion, REQUIRED_MAJOR: REQUIRED_MAJOR };
