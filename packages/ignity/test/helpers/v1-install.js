'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { sha256 } = require('../../scripts/lib/fs-utils');

const PKG_ROOT = path.resolve(__dirname, '..', '..');
const V1_ROOT = path.resolve(PKG_ROOT, '..', '..', 'framework-agentico-web');
const FIXTURE = path.join(PKG_ROOT, 'test', 'fixtures', 'v1-manifest.json');

function loadV1Manifest() {
  return JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
}

/**
 * Materializes a v1 installation (as `instalar.py --client both` would leave it)
 * inside `dest`, copying each file listed in the fixture from the frozen v1 kit
 * and checking its SHA-256 against the fixture.
 *
 * @param {string} dest temp directory
 * @param {{v1Root?: string}} [options]
 * @returns {string[]} installed relative paths
 */
function materializeV1Install(dest, { v1Root = V1_ROOT } = {}) {
  const manifest = loadV1Manifest();
  for (const entry of manifest.files) {
    const data = fs.readFileSync(path.join(v1Root, entry.source));
    if (sha256(data) !== entry.sha256) {
      throw new Error(`v1 source diverges from fixture: ${entry.source} (rerun scripts/snapshot-v1.js?)`);
    }
    const target = path.join(dest, ...entry.path.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  }
  return manifest.files.map((f) => f.path);
}

module.exports = { materializeV1Install, loadV1Manifest, V1_ROOT, FIXTURE };
