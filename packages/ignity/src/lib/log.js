'use strict';

/**
 * Output helper. Every line the CLI prints goes through here; callers only pass
 * paths, counts and fixed pt-BR messages — never environment values or config contents (Q-04).
 */

class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}

function createOutput({ stdout = process.stdout, stderr = process.stderr } = {}) {
  const warnings = [];
  return {
    warnings,
    line(text = '') {
      stdout.write(`${text}\n`);
    },
    warn(text) {
      warnings.push(text);
      stdout.write(`AVISO: ${text}\n`);
    },
    error(text) {
      stderr.write(`${text}\n`);
    },
  };
}

/** Collects output in memory (unit tests). */
function createMemoryOutput() {
  const chunks = { stdout: '', stderr: '' };
  const out = createOutput({
    stdout: { write: (s) => (chunks.stdout += s) },
    stderr: { write: (s) => (chunks.stderr += s) },
  });
  out.text = chunks;
  return out;
}

module.exports = { CliError, createOutput, createMemoryOutput };
