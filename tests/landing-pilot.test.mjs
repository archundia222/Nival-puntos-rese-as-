import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('public landing keeps legal links and contextual WhatsApp CTAs, direct registration and discreet admin access on the configured Nival WhatsApp URL',()=>{
 const s=readFileSync('app/page.tsx','utf8');
 assert.ok(s.includes("https://wa.me/52"));
 assert.ok(s.includes('const waContact=wa;'));
 assert.equal((s.match(/href="\/acceso\?modo=registro"/g)||[]).length,4);
 assert.ok(s.includes('Acceso de administradores'));assert.ok(s.includes('href="/acceso-administrador"'));
 assert.ok(s.includes('Nombre del negocio: ____'));assert.ok(s.includes('contratación y la activación'));
 assert.ok(readFileSync('app/acceso/page.tsx','utf8').includes("modo==='registro'?'register':'login'"));
 assert.equal((s.match(/href=\{wa(?:Contact)?\}/g)||[]).length,4);
 assert.ok(s.includes('Que te encuentren.'));assert.ok(s.includes('Que vuelvan.'));
 assert.ok(s.includes('href="/terminos"'));assert.ok(s.includes('href="/privacidad"'));
 assert.ok(!s.includes('href="/panel">Cotizar o activar por WhatsApp'));
});

test('hero offers only registration and demo; both menus expose contact and administrator',()=>{
 const s=readFileSync('app/page.tsx','utf8');
 const hero=s.split('<div className="nxActions">')[1].split('<div className="nxQuick">')[0];
 assert.equal((hero.match(/<a /g)||[]).length,2);
 assert.ok(hero.includes('href="/acceso?modo=registro"'));assert.ok(hero.includes('href="/demo"'));assert.ok(!hero.includes('href={wa}'));
 const header=s.split('<header className="nxHeader">')[1].split('</header>')[0];
 assert.equal((header.match(/>Pedir informes por WhatsApp<\/a>/g)||[]).length,2);
 assert.equal((header.match(/href="\/acceso-administrador">Administrador<\/a>/g)||[]).length,2);
 assert.equal((header.match(/href="\/acceso">Iniciar sesión<\/a>/g)||[]).length,0);
 const access=readFileSync('app/acceso/page.tsx','utf8');
 assert.ok(access.includes("modo==='registro'?'Crear tu cuenta':'Iniciar sesión'"));
});
