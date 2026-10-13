import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync('app/page.tsx','utf8');
const css=readFileSync('app/landing-reference.css','utf8');
const menu=readFileSync('app/landing-interactions.tsx','utf8');

test('landing presents the three plans, response limits, comparison, and shared inclusions',()=>{
  for(const x of ["name: 'Puntos', price: '$299'","name: 'Esencial', price: '$399'","name: 'Plus', price: '$549'","30 respuestas por periodo de 30 días","100 respuestas por periodo de 30 días","Comparación con negocios similares de tu zona","Hasta 10 incluidas","Incluido al cierre de cada periodo de 30 días"]){
    assert.ok(page.includes(x),x);
  }
});

test('landing uses the requested story, WhatsApp CTA, and Nival-specific product examples',()=>{
  for(const x of ['Que te','Que vuelvan','Cotizar por WhatsApp','nvHeroPhone','nvCounterStand','nvPointPhone','nvGoogleCard','nvSegmentCard','no suma puntos']) assert.ok(page.includes(x),x);
  assert.match(page,/OPINIÓN ILUSTRATIVA/);
  assert.match(page,/EJEMPLO ILUSTRATIVO/);
  assert.doesNotMatch(page,/\+24|482|36 premios|Nival Pay|Google Wallet|Apple Wallet/i);
});

test('landing and access links adapt to mobile and share the Nival palette',()=>{
  for(const x of ['/acceso','/staff/acceso','/acceso-administrador']) assert.ok(menu.includes(x),x);
  assert.match(css,/--nival-forest/);
  assert.match(css,/--nival-lime/);
  assert.match(css,/--nival-cream/);
  assert.match(css,/DM Serif Display/);
  assert.match(css,/@media\s*\(max-width:\s*390px\)/);
  assert.match(css,/\.nivalLanding \.refMobileMenu \{ display: block; grid-column: 3;/);
  assert.match(css,/prefers-reduced-motion/);
});
