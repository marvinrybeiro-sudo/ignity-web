'use strict';

/** Story 1.2 AC 8 and AC 10: adapter block merger. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { START, END, upsertBlock, removeBlock, replaceTextWithBlock, extractBody, hasBlock } = require('../src/lib/merger');

const BODY = '# Orientações\n\nLinha 1.\n';

test('arquivo inexistente: só o bloco', () => {
  assert.equal(upsertBlock(null, BODY), `${START}\n# Orientações\n\nLinha 1.\n${END}\n`);
});

test('sem marcadores: bloco anexado após linha em branco, original intacto byte a byte', () => {
  const own = '# Meu\n\nRegra.\n';
  const merged = upsertBlock(own, BODY);
  assert.ok(merged.startsWith(own));
  assert.equal(merged.slice(own.length, own.length + 1 + START.length), `\n${START}`);
  const noFinalNewline = upsertBlock('# Meu', BODY);
  assert.ok(noFinalNewline.startsWith(`# Meu\n\n${START}`));
});

test('com marcadores: só o trecho entre eles muda', () => {
  const text = `antes\n${START}\nvelho\n${END}\ndepois\n`;
  const merged = upsertBlock(text, BODY);
  assert.equal(merged, `antes\n${START}\n# Orientações\n\nLinha 1.\n${END}\ndepois\n`);
  assert.equal(extractBody(merged), '# Orientações\n\nLinha 1.');
});

test('idempotência: segunda aplicação não muda nada', () => {
  for (const start of [null, '# Meu\n', '# Meu\r\nRegra\r\n']) {
    const once = upsertBlock(start, BODY);
    assert.equal(upsertBlock(once, BODY), once);
  }
});

test('CRLF: final de linha original preservado no bloco e no resto', () => {
  const own = '# Meu\r\n\r\nRegra.\r\n';
  const merged = upsertBlock(own, BODY);
  assert.ok(merged.startsWith(own));
  assert.equal(merged.replace(/\r\n/g, '').includes('\n'), false, 'LF solto em arquivo CRLF');
  assert.equal(removeBlock(merged), own);
});

test('remover bloco devolve o original quando o bloco foi anexado', () => {
  const own = '# Meu\n\nRegra.\n';
  assert.equal(removeBlock(upsertBlock(own, BODY)), own);
  assert.equal(removeBlock(upsertBlock(null, BODY)).trim(), '');
  assert.equal(removeBlock('sem bloco\n'), 'sem bloco\n');
});

test('marcadores malformados são recusados com instrução', () => {
  assert.throws(() => upsertBlock(`${START}\nsem fim\n`, BODY), /malformados/);
  assert.throws(() => upsertBlock(`${END}\n${START}\n`, BODY), /malformados/);
  assert.throws(() => upsertBlock(`${START}\n${END}\n${START}\n${END}\n`, BODY), /malformados/);
  assert.equal(hasBlock('nada'), false);
});

test('replaceTextWithBlock troca só o trecho v1 (LF ou CRLF)', () => {
  const v1 = 'texto v1\nlinha 2\n';
  assert.equal(replaceTextWithBlock(`topo\n${v1}fim\n`, v1, BODY), `topo\n${START}\n# Orientações\n\nLinha 1.\n${END}\nfim\n`);
  const crlf = `topo\r\n${v1.replace(/\n/g, '\r\n')}fim\r\n`;
  assert.ok(replaceTextWithBlock(crlf, v1, BODY).startsWith(`topo\r\n${START}\r\n`));
  assert.equal(replaceTextWithBlock('outro\n', v1, BODY), null);
});
