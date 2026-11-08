'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { sanitizeUrl } = require('../src/lib/sanitize-url');
const BIN = path.resolve(__dirname, '../bin/ignity.js');
function setup(t) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wizard-')); t.after(() => fs.rmSync(root, { recursive:true, force:true })); return {root, cli: args => spawnSync(process.execPath,[BIN,'init','--dir',root,...args],{encoding:'utf8',timeout:5000})}; }
test('URLs recusam credenciais e preservam só node-id no Figma', () => {
 assert.throws(()=>sanitizeUrl('https://user:pass@site.test/'),/credenciais/);
 assert.throws(()=>sanitizeUrl('ftp://site.test/'),/http/);
 assert.throws(()=>sanitizeUrl('https://evil.test/',true),/figma.com/);
 assert.equal(sanitizeUrl('https://site.test/path?secret=x#hash'),'https://site.test/path');
 assert.equal(sanitizeUrl('https://figma.com/design/x?node-id=1-2&token=secret#h',true),'https://figma.com/design/x?node-id=1-2');
});
test('init com flags grava BRIEF, sem segredos em saída/manifesto, e preserva existente', t=>{
 const {root,cli}=setup(t); const sentinel='wizard-sentinel-token';
 const r=cli(['--yes','--site-url',`https://site.test/?token=${sentinel}`,'--env','produção','--figma',`https://figma.com/design/x?node-id=1-2&token=${sentinel}`,'--assets','./assets','--scope','Landing page']);
 assert.equal(r.status,0,r.stderr); const brief=fs.readFileSync(path.join(root,'project/BRIEF.md'),'utf8');
 assert.match(brief,/Landing page/); assert.match(brief,/não — rascunho por padrão/); assert.match(brief,/Ambiente: produção/);
 assert.equal((r.stdout+r.stderr+brief+fs.readFileSync(path.join(root,'.ignity/manifest.json'),'utf8')).includes(sentinel),false);
 assert.equal(cli(['--site-url','invalid']).status,0); assert.equal(fs.readFileSync(path.join(root,'project/BRIEF.md'),'utf8'),brief);
});
test('sem TTY não pergunta e usa desconhecido; URL inválida falha antes de instalar',t=>{
 const {root,cli}=setup(t); const bad=cli(['--site-url','https://u:p@site.test/']); assert.equal(bad.status,1); assert.equal(fs.existsSync(path.join(root,'.ignity')),false);
 const r=cli([]); assert.equal(r.status,0,r.stderr); assert.match(fs.readFileSync(path.join(root,'project/BRIEF.md'),'utf8'),/URL do site: desconhecido/);
 assert.equal(fs.existsSync(path.join(root,'assets')),false);
});
