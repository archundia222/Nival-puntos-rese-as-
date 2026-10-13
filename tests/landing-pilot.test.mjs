import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync('app/page.tsx','utf8');
const css=readFileSync('app/landing-reference.css','utf8');
const layout=readFileSync('app/layout.tsx','utf8');
const carousel=readFileSync('app/landing-carousel.tsx','utf8');

test('landing states both product pillars and uses the existing visual assets',()=>{
  for(const x of ['Que vuelvan.','Que te recomienden.','TARJETA DE PUNTOS + RESEÑAS DE GOOGLE','/assets/img/barista.webp','/assets/img/hero-phone.webp','/assets/img/google-phone.webp','/assets/img/step-02.webp','/assets/img/step-03.webp']) assert.ok(page.includes(x),x);
  assert.ok(page.includes('href="/demo"'));
  assert.ok(page.includes('href="/acceso"'));
  assert.ok(!page.includes('Cotizar por WhatsApp" href={whatsapp}'));
});

test('plans and included features retain the confirmed prices and conditions',()=>{
  for(const x of ["price: '$299'","price: '$399'","price: '$549'",'Hasta 10 tarjetas NFC + QR','Incluido al cierre de cada periodo de 30 días','Hasta 30','Hasta 100','No se publican automáticamente']) assert.ok(page.includes(x),x);
  assert.ok(page.includes('quoteUrl(plan.name)'));
});

test('no free trial or fabricated social proof is promised',()=>{
  assert.doesNotMatch(page,/gratis|prueba gratuita|15 días gratis/i);
  assert.doesNotMatch(page,/Negocios que ya usan Nival|testimonio|clientes activos/i);
  assert.match(page,/DATOS DE EJEMPLO/);
  assert.match(carousel,/EJEMPLOS ILUSTRATIVOS/);
});

test('wallet availability and legal draft status are stated clearly',()=>{
  assert.match(page,/Google Wallet está disponible cuando la integración está activa/);
  assert.match(page,/Apple Wallet no está disponible actualmente/);
  assert.match(page,/borrador para revisión legal/);
  assert.match(layout,/Tarjeta de puntos y reseñas de Google para negocios locales/);
  assert.match(layout,/og:image|images:/);
});

test('responsive layout, keyboard focus, reduced motion and swipeable cards are present',()=>{
  for(const x of ['#como-funciona','#resenas','#mostrador','#panel','#planes','#preguntas']) assert.ok(page.includes(x),x);
  assert.match(page,/nvMobileStickyCta/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(carousel,/onPointerDown/);
  assert.match(carousel,/prefers-reduced-motion/);
});
