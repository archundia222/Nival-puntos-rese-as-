import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('app/page.tsx', 'utf8');
const css = readFileSync('app/landing-reference.css', 'utf8');
const interactions = readFileSync('app/landing-interactions.tsx', 'utf8');
const whatsapp = readFileSync('app/whatsapp-fab.tsx', 'utf8');

test('landing keeps the selected navigation and all access entry points', () => {
  for (const label of ['Cómo funciona', 'Precios', 'Preguntas', 'Ver demo']) assert.ok(page.includes(label));
  for (const href of ['/acceso', '/staff/acceso', '/acceso-administrador']) assert.ok(page.includes(href));
  assert.ok(page.includes('className="refNav"'));
  assert.match(css, /\.refNav/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
});

test('hero retains its image, gradient treatment, QR message and signup paths', () => {
  assert.ok(page.includes('Que te<br/>encuentren.'));
  assert.ok(page.includes('Que vuelvan.'));
  assert.ok(page.includes('QR incluido'));
  assert.ok(page.includes('Sin app'));
  assert.ok(page.includes('hero-phone.webp'));
  assert.ok(page.includes('/acceso?modo=registro'));
  assert.match(css, /\.refHeroPhoto/);
});

test('four-step journey explains discovery, visits, rewards and voluntary reviews', () => {
  for (const phrase of ['Te encuentran en Google.', 'Acumulan puntos.', 'Regresan por sus premios.', 'Comparten su experiencia.']) assert.ok(page.includes(phrase));
  assert.ok(page.includes('Cada visita con compra suma un punto'));
  assert.ok(page.includes('de forma amable y libre'));
});

test('plan cards preserve existing prices and explain each plan limits', () => {
  for (const plan of ['Nival Puntos', 'Nival Esencial', 'Nival Plus']) assert.ok(page.includes(plan));
  for (const price of ['price:299', 'price:399', 'price:499']) assert.ok(page.includes(price));
  assert.ok(page.includes('Hasta 30 respuestas por periodo activo de 30 días'));
  assert.ok(page.includes('Hasta 100 respuestas por periodo activo de 30 días'));
});

test('review section states the plan quotas and manual service window', () => {
  assert.ok(page.includes('reseñas de Google'));
  assert.match(page, /3 días hábiles/);
  assert.doesNotMatch(page, /instantáneo|automático/i);
  assert.ok(page.includes('hasta 30 respuestas'));
  assert.ok(page.includes('hasta 100'));
});

test('benefit cards remain interactive and WhatsApp contact is available', () => {
  assert.ok(page.includes("mode:'benefits'"));
  assert.match(interactions, /mode === 'benefits'/);
  assert.ok(page.includes('<WhatsAppFab href={wa}/>'));
  assert.ok(whatsapp.includes('className="refWhats"'));
  assert.ok(whatsapp.includes('Hablar con Nival por WhatsApp'));
  assert.match(css, /\.refWhats\{position:fixed/);
});

test('value and pricing sections use a single consolidated benefits area', () => {
  assert.ok(page.includes('className="refValue"'));
  assert.ok(page.includes('className="refPricing"'));
  assert.equal((page.match(/className="refBenefits"/g) || []).length, 1);
});
