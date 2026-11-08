'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PKG_ROOT = path.resolve(__dirname, '..', '..');
const CLI_PATH = path.join(PKG_ROOT, 'bin', 'ignity.js');

function cliExists() {
  return fs.existsSync(CLI_PATH);
}

/**
 * Runs `node bin/ignity.js <args>` with `cwd` set to a temp project dir and a
 * controlled environment: only PATH is inherited, HOME points to `home`
 * (a temp dir) so the CLI never reads the developer's real configuration.
 *
 * @param {string[]} args
 * @param {{cwd: string, home: string, env?: Record<string, string>, timeout?: number}} options
 * @returns {{code: number|null, signal: string|null, stdout: string, stderr: string}}
 */
function runCli(args, { cwd, home, env = {}, timeout = 30000 }) {
  if (!cwd || !home) throw new Error('runCli requires cwd and home (temp dirs)');
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd,
    encoding: 'utf8',
    timeout,
    env: {
      PATH: process.env.PATH || '',
      HOME: home,
      USERPROFILE: home,
      NO_COLOR: '1',
      ...env,
    },
  });
  if (result.error) throw result.error;
  return { code: result.status, signal: result.signal, stdout: result.stdout, stderr: result.stderr };
}

module.exports = { runCli, cliExists, CLI_PATH, PKG_ROOT };
