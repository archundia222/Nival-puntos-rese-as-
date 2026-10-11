import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync('app/page.tsx','utf8'),css=readFileSync('app/landing-reference.css','utf8');
test('public offer shows the three requested 30-day plans and quotas',()=>{
 for(const x of ['price: 299','price: 399','price: 549','Hasta 30 respuestas a reseñas','Hasta 100 respuestas a reseñas','Comparación con negocios similares'])assert.ok(page.includes(x),x);
 assert.match(page,/periodo dura 30 días/);
});
test('public offer includes both add-ons and only the plan-specific closing PDF promise',()=>{
 for(const x of ['Nival Pay','Nival Reseñas','tarjetas NFC con QR','resumen PDF','día 30'])assert.ok(page.toLowerCase().includes(x.toLowerCase()),x);
 for(const x of ['historial de recomendaciones','recomendaciones extra','WhatsAppFab','refFaq','refHow'])assert.ok(!page.includes(x),x);
});
test('offer uses responsive Nival palette and preserves account access paths',()=>{
 assert.ok(page.includes('/acceso?modo=registro'));
 assert.ok(page.includes('/staff/acceso'));
 assert.ok(page.includes('/acceso-administrador'));
 assert.match(css,/\.nivalOffer/);assert.match(css,/--dark:#0f2a1f/i);assert.match(css,/@media\s*\(max-width:\s*760px\)/);
});
