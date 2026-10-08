import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('app/page.tsx', 'utf8');
const story = readFileSync('app/scroll-story.tsx', 'utf8');
const menu = readFileSync('app/landing-menu.tsx', 'utf8');
const css = readFileSync('app/landing-v5.css', 'utf8');

test('landing navigation is sticky, legible, and keeps administrator access in the footer', () => {
  const header = page.split('<header className="nxHeader">')[1].split('</header>')[0];
  assert.ok(header.includes('Cómo funciona'));
  assert.ok(header.includes('Precios'));
  assert.ok(header.includes('Ver demo'));
  assert.ok(header.includes('Contacto'));
  assert.ok(header.includes('Acceso a negocios'));
  assert.ok(header.includes('href="/staff/acceso"'));
  assert.ok(header.includes('href="/acceso-administrador"'));
  assert.ok(!header.includes('Dueños · Entrar'));
  assert.equal((header.match(/acceso-administrador/g) || []).length, 1);
  assert.equal((page.match(/href="\/acceso-administrador"/g) || []).length, 2);
  assert.match(css, /\.nxHeader\{position:sticky;top:0/);
  assert.match(css, /\.nxHeader nav a\{font-size:16px/);
});

test('hero preserves its two clear actions and explains QR without implying NFC is included', () => {
  const hero = page.split('<section className="nxHero"')[1].split('</section>')[0];
  const actions = hero.split('<div className="nxActions">')[1].split('</div>')[0];
  assert.equal((actions.match(/<a /g) || []).length, 2);
  assert.ok(actions.includes('href="/acceso?modo=registro"'));
  assert.ok(actions.includes('href="/demo"'));
  assert.ok(hero.includes('Crear cuenta'));
  assert.ok(hero.includes('QR incluido'));
  assert.ok(page.includes('La tarjeta NFC física se cotiza por separado.'));
});

test('how it works is concise, easy to scan, and keeps points separate from reviews', () => {
  assert.equal(story.split('{ title:').length - 1, 4);
  for (const phrase of [
    'Así funciona Nival',
    'Te encuentran',
    'Te visitan y compran',
    'Ven cuánto les falta',
    'Canjean su premio',
    'Cuatro pasos claros',
    'las reseñas son voluntarias',
    'Los puntos se entregan por visitas con compra',
  ]) assert.ok(story.includes(phrase), phrase);
  assert.ok(story.includes('<ol className="nxStorySteps">'));
  assert.ok(story.includes('aria-labelledby="nxStoryTitle"'));
  assert.ok(!story.includes('useEffect'));
  assert.ok(css.includes('.nxStory{height:auto;'));
  assert.ok(css.includes('.nxStorySteps{grid-template-columns:1fr;gap:11px'));
});

test('reviews and loyalty are separate, and the page links to the current Google Maps policy', () => {
  assert.ok(page.includes('Haz que cada visita cuente.'));
  assert.ok(page.includes('sin condicionar puntos ni premios'));
  assert.ok(page.includes('por visitas válidas con compra'));
  assert.ok(page.includes('La reseña es opcional') || page.includes('opiniones auténticas y voluntarias'));
  assert.ok(page.includes('Los puntos se obtienen por una visita válida con compra'));
});

test('pricing shows the three current plans, review caps, and the recommended tier', () => {
  assert.ok(page.includes("name: 'Nival Puntos', price: 299"));
  assert.ok(page.includes("name: 'Esencial', price: 399"));
  assert.ok(page.includes("name: 'Plus', price: 499"));
  assert.ok(page.includes('Reportes y seguimiento, sin respuestas incluidas'));
  assert.ok(page.includes('Hasta 100 respuestas manuales por periodo de 30 días'));
  assert.ok(page.includes('recommended: true'));
  assert.ok(page.includes('QR digital incluido'));
  assert.ok(page.includes('La tarjeta NFC física se cotiza por separado.'));
  assert.ok(!page.includes('sin plazo forzoso'));
});

test('service copy describes assisted work, manual payment, activation, and preserved history', () => {
  assert.ok(page.includes('atención personalizada'));
  assert.ok(page.includes('Nival te acompaña'));
  assert.ok(page.includes('Una vez confirmado el pago'));
  assert.ok(page.includes('código único de activación'));
  assert.ok(page.includes('comienza un periodo de 30 días'));
  assert.ok(page.includes('el historial se conserva'));
});

test('WhatsApp carries the product, page, and selected plan context on desktop and mobile', () => {
  assert.ok(page.includes('Nival Puntos + Reseñas en la página'));
  assert.ok(page.includes('Me interesa el plan'));
  assert.ok(page.includes("whatsapp('botón flotante')"));
  assert.ok(readFileSync('app/whatsapp-fab.tsx', 'utf8').includes('IntersectionObserver'));
  assert.match(css, /\.nxWhats\{display:grid;position:fixed/);
  assert.ok(css.includes('env(safe-area-inset-bottom)'));
});

test('mobile navigation supports dismissal and touch-sized choices', () => {
  assert.ok(menu.includes('Acceso a negocios'));
  assert.ok(menu.includes('Personal · Entrar con PIN'));
  assert.ok(menu.includes('Administrador de Nival'));
  assert.ok(!menu.includes('Dueño del negocio · Entrar'));
  assert.ok(menu.includes('aria-expanded={open}'));
  assert.ok(menu.includes("event.key === 'Escape'"));
  assert.ok(menu.includes('onClick={() => setOpen(false)}'));
  assert.match(css, /\.nxMobileMenu>button\{[^}]*min-height:48px/);
  assert.match(css, /\.nxMobileMenu nav a\{[^}]*min-height:48px/);
});
