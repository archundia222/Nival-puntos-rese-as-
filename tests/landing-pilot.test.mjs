import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const page = readFileSync("app/page.tsx", "utf8");
const carousel = readFileSync("app/landing-industry-carousel.tsx", "utf8");
const mobileNav = readFileSync("app/landing-mobile-nav.tsx", "utf8");
const css = readFileSync("app/landing-reference.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");

test("landing explains the products, business types, dashboard and plans", () => {
  for (const text of [
    "Una visita más.",
    "Un motivo para volver.",
    "Cada visita cuenta.",
    "Opiniones a un toque.",
    "Un detalle que se comparte.",
    "Todo lo importante,<br /><em>en Inicio.</em>",
    "Precios sin sorpresas.",
    "¿Te queda alguna duda?",
  ]) assert.ok(page.includes(text), text);
  assert.ok(carousel.includes("De la cafetería a la barbería."));
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
  assert.ok(page.includes('href="/demo"'));
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
    "Comparación con negocios cercanos",
  ]) assert.ok(page.includes(text), text);
  assert.match(page, /tarjeta de regalo digital/i);
  assert.match(page, /tarjeta digital de puntos/i);
});

test("sample metrics are labeled and real images replace upload placeholders", () => {
  assert.match(page, /EJEMPLO|ejemplo/);
  assert.match(page, /datos de ejemplo/i);
  assert.match(page, /ÚLTIMOS 30 DÍAS/);
  assert.doesNotMatch(page, /Espacio para imagen|pendiente de recibir/);
  for (const image of ["6105", "6106", "6107", "6109", "6111", "6112", "6113", "6114"])
    assert.ok(existsSync(`public/assets/img/landing/${image}.webp`), image);
  for (const image of ["puntos", "resenas"])
    assert.ok(existsSync(`public/assets/img/landing/${image}.webp`), image);
  assert.match(page, /Cada visita cuenta\./);
  assert.match(page, /Opiniones a un toque\./);
  assert.match(page, /Nuevos y recurrentes/);
  assert.match(page, /INGRESOS DE CLIENTES RECURRENTES/);
  assert.match(page, /selector de sucursal|Sucursal seleccionada/i);
  assert.match(page, /Tu reputación, a la vista\./);
  assert.match(page, /Tus grupos/);
  assert.match(page, /COMPARATIVO LOCAL · EJEMPLO/);
  assert.match(page, /PLAN PLUS/);
  for (const image of ["industry-cafe.webp", "industry-taqueria.webp", "industry-restaurant.webp", "nival-counter-display.webp"])
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

test("business carousel advances automatically and pauses for interaction or reduced motion", () => {
  assert.match(carousel, /setInterval/);
  assert.match(carousel, /4200/);
  assert.match(carousel, /prefers-reduced-motion:\s*reduce/);
  assert.match(carousel, /onMouseEnter/);
  assert.match(carousel, /onFocus/);
  assert.match(carousel, /Pausar/);
});
