'use strict';

const { sync } = require('../lib/sync');

/**
 * AC 11-14: updates skills, `.ignity/framework/` and adapter blocks; migrates v1.
 * Never creates, changes or removes anything in project/ (enforced by the writer guard).
 */
function update(ctx) {
  return sync(ctx, { mode: 'update' });
}

module.exports = { update };
