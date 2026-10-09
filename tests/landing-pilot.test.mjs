import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('app/page.tsx', 'utf8');
const css = readFileSync('app/landing-reference.css', 'utf8');

test('landing has aligned access menu and account creation entry points', () => {
  assert.ok(page.includes('Cómo funciona'));
  assert.ok(page.includes('Accesos'));
  for (const href of ['/acceso', '/staff/acceso', '/acceso-administrador']) assert.ok(page.includes(href));
  assert.ok(page.includes('Crear cuenta'));
  assert.match(css, /\.nvHeader/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
});

test('hero keeps the serif headline and explains signup, QR, and optional NFC', () => {
  assert.ok(page.includes('Que te encuentren.'));
  assert.ok(page.includes('Que vuelvan.'));
  assert.ok(page.includes('QR incluido'));
  assert.ok(page.includes('Sin app'));
  assert.ok(page.includes('NFC'));
  assert.ok(page.includes('/assets/img/hero-phone.webp'));
  assert.ok(page.includes('/acceso?modo=registro'));
});

test('customer journey uses four distinct steps and icons', () => {
  for (const icon of ["'pin'", "'qr'", "'trophy'", "'heart'"]) assert.ok(page.includes(icon));
  for (const phrase of ['Se unen en el mostrador', 'Suman y canjean', 'Vuelven con un motivo']) assert.ok(page.includes(phrase));
});

test('pricing matrix is comparable and keeps current public prices and response caps', () => {
  for (const plan of ['Nival Puntos', 'Nival Esencial', 'Nival Plus']) assert.ok(page.includes(plan));
  for (const price of ['$399', '$499', '$599']) assert.ok(page.includes(price));
  assert.ok(page.includes('30 por periodo activo de 30 días'));
  assert.ok(page.includes('100 por periodo activo de 30 días'));
  assert.ok(page.includes('periodo activo'));
});

test('review promise sets a realistic service window and avoids automation claims', () => {
  assert.ok(page.includes('reseñas de Google'));
  assert.match(page, /3 días hábiles/);
  assert.doesNotMatch(page, /instantáneo|automático/i);
});

test('final CTA text has strong contrast and WhatsApp does not cover mobile content', () => {
  assert.ok(page.includes('¿Listo para que tus clientes vuelvan?'));
  assert.match(css, /\.nvFinalCta/);
  assert.match(css, /\.refWhats/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /@media\s*\(max-width:\s*390px\)/);
});
