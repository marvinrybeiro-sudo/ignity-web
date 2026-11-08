#!/usr/bin/env node
'use strict';

// AC 1a: the Node version check runs first. Keep this file in ES5 syntax so an
// old Node can parse it and print the pt-BR message instead of a SyntaxError.
var nodeCheck = require('../src/lib/node-check');
var result = nodeCheck.checkNodeVersion(process.versions.node);
if (!result.ok) {
  process.stderr.write(result.message + '\n');
  process.exit(1);
}

Promise.resolve(require('../src/cli').main(process.argv.slice(2))).then(function (code) { process.exitCode = code; });
