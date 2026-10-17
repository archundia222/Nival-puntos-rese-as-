import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const page = readFileSync("app/page.tsx", "utf8");
const carousel = readFileSync("app/landing-industry-carousel.tsx", "utf8");
const mobileNav = readFileSync("app/landing-mobile-nav.tsx", "utf8");
const css = readFileSync("app/landing-reference.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const ownerView = readFileSync("lib/owner/view.tsx", "utf8");

test("landing explains the products, business types, dashboard and plans", () => {
  for (const text of [
    "Haz que vuelvan.",
    "Que te encuentren.",
    "Que cada visita acerque el premio.",
    "De tu mostrador a Google.",
    "Comparte algo que invita a volver.",
    "Esto es lo que ves en Inicio.",
    "Elige cómo quieres crecer.",
    "Lo esencial, sin vueltas.",
    "Empieza en el mostrador.",
    "Nival gestiona las respuestas de forma manual y con tu permiso.",
  ]) assert.ok(page.includes(text), text);
  assert.ok(carousel.includes("Nival cabe en tu día a día."));
  assert.ok(page.includes("<LandingIndustryCarousel />"));
  assert.equal(
    ((page.match(/<section\b/g) || []).length + (carousel.match(/<section\b/g) || []).length),
    6,
  );
  for (const id of ["producto", "panel", "planes", "preguntas"])
    assert.ok(page.includes(`id="${id}"`), id);
  assert.ok(carousel.includes('id="giros"'), "giros");
  for (const href of ["#giros", "#producto", "#panel", "#planes", "#preguntas"])
    assert.ok(page.includes(href), href);
  assert.ok(page.includes('href="/demo/panel"'));
  assert.ok(page.includes('href="/acceso"'));
  for (const anchor of ["#producto", "#panel", "#planes", "#preguntas"])
    assert.ok(mobileNav.includes(anchor), anchor);
  assert.doesNotMatch(mobileNav, /#como-funciona|#resenas|#contacto/);
});

test("prices and plan limits match the current entitlements", () => {
  for (const text of [
    'price: "$299"',
    'price: "$399"',
    'price: "$549"',
    'nfc: "3"',
    'nfc: "6"',
    'nfc: "12"',
    'reviews: "10"',
    'reviews: "30"',
    'reviews: "100"',
    'branches: "1"',
    'branches: "5"',
    'branches: "10"',
    "RECOMENDADO",
    "Comparación con negocios similares de tu zona",
  ]) assert.ok(page.includes(text), text);
  assert.match(page, /tarjeta de regalo digital/i);
  assert.match(page, /tarjeta digital de puntos/i);
  assert.match(page, /className="nvPlanPerks"/);
  assert.match(page, /por 30 días/);
  assert.match(page, /EN TODOS LOS PLANES/);
  assert.match(page, /Tarjeta digital de puntos <i>·<\/i> Tarjeta de regalo Nival Pay <i>·<\/i> Resumen mensual en PDF/);
  assert.match(page, /Nival gestiona las respuestas de forma manual y con tu permiso/);
  assert.match(page, /resumen mensual en PDF/i);
  assert.match(page, /Tu equipo suma visitas/);
  assert.match(page, /Nival responde reseñas manualmente/);
});

test("sample metrics are labeled and real images replace upload placeholders", () => {
  assert.match(page, /EJEMPLO|ejemplo/);
  assert.match(page, /datos de ejemplo/i);
  assert.match(ownerView, /periodDays/);
  assert.doesNotMatch(page, /Espacio para imagen|pendiente de recibir/);
  for (const image of ["6105", "6106", "6107", "6109", "6111", "6112", "6113", "6114"])
    assert.ok(existsSync(`public/assets/img/landing/${image}.webp`), image);
  for (const image of ["puntos", "resenas"])
    assert.ok(existsSync(`public/assets/img/landing/${image}.webp`), image);
  assert.match(page, /tarjetas NFC \+ QR que abren reseñas de Google/i);
  assert.match(page, /TU FICHA DE GOOGLE/);
  assert.match(page, /áreas de mejora/i);
  assert.match(page, /<OwnerView/);
  assert.match(page, /demoRange/);
  assert.match(page, /nvLivePanelBody/);
  assert.match(ownerView, /Nuevos y recurrentes/);
  assert.match(ownerView, /impactGoogleCard/);
  assert.match(ownerView, /REPUTACIÓN EN GOOGLE/);
  assert.match(ownerView, /Ver análisis y recomendaciones/);
  assert.match(ownerView, /Comparación con negocios de la misma categoría en la zona/);
  for (const image of ["industry-cafe.webp", "industry-taqueria.webp", "industry-restaurant.webp", "industry-clinic.webp", "industry-ice-cream.webp"])
    assert.ok(existsSync(`public/assets/img/${image}`), image);
});

test("legal links are marked for legal review and brand name is NIVAL", () => {
  assert.match(page, /NIVAL/);
  assert.match(page, /pendientes de revisión legal/);
  assert.match(layout, /Tarjeta de puntos y reseñas de Google para negocios locales/);
});

test("responsive layout, keyboard focus and reduced motion are present", () => {
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(max-width:\s*420px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test("business carousel loops automatically and has no visible controls", () => {
  assert.match(css, /@keyframes nvIndustryScroll/);
  assert.match(css, /animation:nvIndustryScroll/);
  assert.match(carousel, /industry-clinic\.webp/);
  assert.match(carousel, /industry-ice-cream\.webp/);
  assert.match(carousel, /landing\/6107\.webp/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(carousel, /Pausar|Siguiente negocio|Negocio anterior|aria-label=".*flecha/i);
  assert.match(page, /cada cliente ve cuánto le falta en su celular/);
  assert.match(page, /Acerca el teléfono o escanea el QR/);
});
