import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';

const skip=new Set(['.git','node_modules','.next']);
const exts=/\.(?:ts|tsx|js|mjs|cjs|json|md|sql|yml|yaml|example)$/;
const patterns=[
 /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
 /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/i,
 /\bghp_[A-Za-z0-9]{20,}\b/,
 /\bsk_live_[A-Za-z0-9_-]{12,}\b/,
 /(?:SESSION_SECRET|R2_SECRET_ACCESS_KEY|GOOGLE_WALLET_PRIVATE_KEY|NEON_AUTH_COOKIE_SECRET)[ \t]*=[ \t]*[^\s#]{12,}/,
];
function files(dir='.'){return readdirSync(dir).flatMap(n=>{if(skip.has(n))return[];const p=join(dir,n),s=statSync(p);return s.isDirectory()?files(p):exts.test(p)?[p]:[];});}
function hitsIn(text){return patterns.filter(pattern=>pattern.test(text));}

test('secret scanner detects representative fake credentials',()=>{
 const fake=[
  ['-----BEGIN',' PRIVATE KEY-----'].join(''),
  ['postgresql://demo:', 'fake-password-123', '@db.example.invalid/app'].join(''),
  ['ghp_1234567890','abcdefghijklmnopqrstuv'].join(''),
  ['sk_live_','fake_key_123456789'].join(''),
  ['SESSION_SECRET=','fake-session-secret-1234567890'].join(''),
  ['R2_SECRET_ACCESS_KEY=','fake-r2-secret-1234567890'].join(''),
  ['GOOGLE_WALLET_PRIVATE_KEY=','fake-wallet-private-key-123456'].join(''),
  ['NEON_AUTH_COOKIE_SECRET=','fake-neon-cookie-secret-123456'].join(''),
 ];
 for(const value of fake)assert.ok(hitsIn(value).length>0,'expected scanner to detect '+value.split('=')[0]);
});

test('empty env assignments and explanatory lines are not treated as secrets',()=>{
 const example='NEON_AUTH_COOKIE_SECRET=\n# Secretos distintos, aleatorios, de 32 caracteres como mínimo.\nSESSION_SECRET=\n';
 assert.deepEqual(hitsIn(example),[]);
});

test('repository tree contains no common committed secret material',()=>{
 const hits=[];
 for(const f of files()){
  if(f.endsWith('tests/repository-secrets.test.mjs'))continue;
  const s=readFileSync(f,'utf8');
  for(const pattern of patterns)if(pattern.test(s))hits.push(f+':'+pattern);
 }
 assert.deepEqual(hits,[]);
});
