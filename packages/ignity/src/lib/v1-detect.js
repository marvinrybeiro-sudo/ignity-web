'use strict';

/** AC 13 and AC 13a: detects a v1 installation (instalar.py) without `.ignity/manifest.json`. */

const fs = require('node:fs');
const path = require('node:path');
const { V1_FRAMEWORK_PATH } = require('./paths');

const V1_DATA = require('../data/v1-hashes.json');
const V1_SKILL_SIGNALS = ['.claude/skills/web-orchestrator/SKILL.md', '.agents/skills/web-orchestrator/SKILL.md'];

/**
 * @param {string} root
 * @returns {{detected: boolean, skillSignals: string[], frameworkSignal: boolean, describe: () => string[]}}
 */
function detectV1(root) {
  const skillSignals = V1_SKILL_SIGNALS.filter((rel) => fs.existsSync(path.join(root, ...rel.split('/'))));
  const frameworkSignal = fs.existsSync(path.join(root, ...V1_FRAMEWORK_PATH.split('/')));
  return {
    detected: skillSignals.length > 0 || frameworkSignal,
    skillSignals,
    frameworkSignal,
    describe() {
      const lines = [];
      lines.push(
        skillSignals.length
          ? `sinal encontrado: ${skillSignals.join(', ')}`
          : 'sinal ausente: {.claude|.agents}/skills/web-orchestrator/SKILL.md',
      );
      lines.push(frameworkSignal ? `sinal encontrado: ${V1_FRAMEWORK_PATH}` : `sinal ausente: ${V1_FRAMEWORK_PATH}`);
      return lines;
    },
  };
}

/** SHA-256 of each file the v1 installer wrote, by installed path. */
function v1Hashes() {
  return new Map(Object.entries(V1_DATA.files));
}

/** Original v1 adapter text (`CLAUDE.md` / `AGENTS.md`). */
function v1AdapterText(name) {
  return V1_DATA.adapters[name] ? V1_DATA.adapters[name].text : null;
}

module.exports = { detectV1, v1Hashes, v1AdapterText, V1_SKILL_SIGNALS, V1_DATA };
