import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('public landing keeps legal links and contextual WhatsApp CTAs, direct registration and discreet admin access on the configured Nival WhatsApp URL',()=>{
 const s=readFileSync('app/page.tsx','utf8');
 assert.ok(s.includes("https://wa.me/52"));
 assert.ok(s.includes('const waContact=wa;'));
 assert.equal((s.match(/href="\/acceso\?modo=registro"/g)||[]).length,3);
 assert.ok(s.includes('Acceso de administradores'));assert.ok(s.includes('href="/admin"'));
 assert.ok(s.includes('Nombre del negocio: ____'));assert.ok(s.includes('contratación y la activación'));
 assert.ok(readFileSync('app/acceso/page.tsx','utf8').includes("modo==='registro'?'register':'login'"));
 assert.equal((s.match(/href=\{wa(?:Contact)?\}/g)||[]).length,6);
 assert.ok(s.includes('Que te encuentren.'));assert.ok(s.includes('Que vuelvan.'));
 assert.ok(s.includes('href="/terminos"'));assert.ok(s.includes('href="/privacidad"'));
 assert.ok(!s.includes('href="/panel">Cotizar o activar por WhatsApp'));
});
