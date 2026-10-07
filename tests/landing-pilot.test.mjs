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
  assert.ok(header.includes('Iniciar sesión'));
  assert.ok(header.includes('>Empezar</a>'));
  assert.equal((header.match(/acceso-administrador/g) || []).length, 0);
  assert.equal((page.match(/href="\/acceso-administrador"/g) || []).length, 1);
  assert.match(css, /\.nxHeader\{position:sticky;top:0/);
  assert.match(css, /\.nxHeader nav a\{font-size:16px/);
});

test('hero preserves its two clear actions and explains QR without implying NFC is included', () => {
  const hero = page.split('<section className="nxHero"')[1].split('</section>')[0];
  const actions = hero.split('<div className="nxActions">')[1].split('</div>')[0];
  assert.equal((actions.match(/<a /g) || []).length, 2);
  assert.ok(actions.includes('href="/acceso?modo=registro"'));
  assert.ok(actions.includes('href="/demo"'));
  assert.ok(hero.includes('QR incluido'));
  assert.ok(page.includes('La tarjeta NFC física se cotiza por separado.'));
});

test('scroll story contains the requested customer journey and a reduced-motion static version', () => {
  assert.equal((story.match(/kind: '/g) || []).length, 10);
  for (const phrase of [
    'Tus clientes te buscan en Google Maps.',
    'Eligen según las estrellas y los comentarios.',
    'La confianza los acerca a tu negocio.',
    'Después de una buena visita, puedes pedir una reseña.',
    'Una reseña honesta puede ayudar a otras personas.',
    'Los puntos se ganan por visitar y comprar.',
    'Tres días después… vuelve.',
    'Llega el momento de canjear su premio.',
    'Una buena experiencia se comparte.',
    'Nival ayuda a que te encuentren y a que vuelvan.',
  ]) assert.ok(story.includes(phrase), phrase);
  assert.ok(story.includes('aria-valuenow={active + 1}'));
  assert.ok(story.includes('className="nxStoryMapPin nxStoryMapPin--one"'));
  assert.match(css, /\.nxStoryMapPin\{/);
  assert.ok(story.includes('className="nxStoryStatic"'));
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.nxStoryPin\{display:none\}[\s\S]*?\.nxStoryStatic\{display:grid/);
  assert.ok(css.includes('transition:transform'));
  assert.ok(css.includes('transition:opacity'));
});

test('reviews and loyalty are separate, and the page links to the current Google Maps policy', () => {
  assert.ok(page.includes('¿Es legal? Sí: así lo hacemos.'));
  assert.ok(page.includes('nunca se condicionan a escribir una reseña'));
  assert.ok(page.includes('por visitar y comprar'));
  assert.ok(page.includes('support.google.com/contributionpolicy/answer/7400114'));
  assert.ok(page.includes('Los puntos se obtienen por una visita válida con compra'));
});

test('pricing shows the three current plans, review caps, and the recommended tier', () => {
  assert.ok(page.includes("name: 'Nival Puntos', price: 299"));
  assert.ok(page.includes("name: 'Esencial', price: 399"));
  assert.ok(page.includes("name: 'Plus', price: 499"));
  assert.ok(page.includes('Hasta 30 respuestas manuales por periodo de 30 días'));
  assert.ok(page.includes('Hasta 100 respuestas manuales por periodo de 30 días'));
  assert.ok(page.includes('recommended: true'));
  assert.ok(page.includes('QR digital incluido'));
  assert.ok(page.includes('La tarjeta NFC física se cotiza por separado.'));
  assert.ok(!page.includes('sin plazo forzoso'));
});

test('service copy describes assisted work, manual payment, activation, and preserved history', () => {
  assert.ok(page.includes('se trabajan de forma asistida'));
  assert.ok(page.includes('No hay conexión automática con Google Business Profile'));
  assert.ok(page.includes('confirma el pago manual'));
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
  assert.ok(menu.includes('aria-expanded={open}'));
  assert.ok(menu.includes("event.key === 'Escape'"));
  assert.ok(menu.includes('onClick={() => setOpen(false)}'));
  assert.match(css, /\.nxMobileMenu>button\{[^}]*min-height:48px/);
  assert.match(css, /\.nxMobileMenu nav a\{[^}]*min-height:48px/);
});
