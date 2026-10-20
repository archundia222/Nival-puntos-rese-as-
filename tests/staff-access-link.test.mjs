import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('the employee QR opens a direct session using the matching active staff identity',()=>{
 const access=read('lib/points/staff-access.tsx');
 const route=read('app/staff/entrar/route.ts');
 assert.ok(access.includes("'/staff/entrar?negocio='"));
 assert.ok(access.includes('No hace falta escribir el PIN'));
 assert.ok(route.includes('pin_identity($1,$2)'));
 assert.ok(route.includes('issue_staff_session($1,$2,$3)'));
 assert.ok(route.includes("signedHint('staff', secret())"));
 assert.ok(route.includes("new URL('/staff', request.url)"));
 assert.ok(route.includes("'Cache-Control', 'no-store, private'"));
});

test('staff login stays available as a manual fallback when the link is unavailable',()=>{
 const page=read('app/staff/acceso/page.tsx');
 assert.ok(page.includes('Entra escaneando el QR o abriendo el enlace personal'));
 assert.ok(page.includes('name="pin"'));
 assert.ok(page.includes('Ese enlace no es válido'));
});
