import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/page.tsx", "utf8");
const css = readFileSync("app/landing-reference.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");

test("landing has eight sections and labeled image placeholders", () => {
  for (const text of [
    "Que vuelvan.",
    "Que te elijan.",
    "Escanean.",
    "Suman. Canjean.",
    "La próxima visita",
    "TU PANEL",
    "number={1}",
    "number={11}",
    "Ejemplos de diseño",
  ]) {
    assert.ok(page.includes(text), text);
  }
  assert.equal((page.match(/<section\b/g) || []).length, 8);
  for (const id of [
    "como-funciona",
    "resenas",
    "planes",
    "preguntas",
    "contacto",
  ])
    assert.ok(page.includes(`id="${id}"`), id);
  assert.ok(page.includes('href="/demo"'));
  assert.ok(page.includes('href="/acceso"'));
});

test("prices and included review cards match the confirmed offer", () => {
  for (const text of [
    'price: "$299"',
    'price: "$399"',
    'price: "$549"',
    "10 tarjetas NFC + QR para reseñas",
    "Hasta 30 respuestas a reseñas cada 30 días",
    "Hasta 100 respuestas a reseñas cada 30 días",
    "RECOMENDADO",
    "quoteUrl(plan.name)",
  ]) {
    assert.ok(page.includes(text), text);
  }
  assert.doesNotMatch(page, /Nival Pay/);
});

test("examples are labeled and unconfirmed business rules are not promised", () => {
  assert.match(page, /Ejemplos/);
  assert.match(page, /Plazo de respuesta por confirmar/);
  assert.match(page, /umbral por confirmar/);
  assert.doesNotMatch(
    page,
    /186 clientes|342 visitas|24 premios|testimonio|clientes activos/i,
  );
  assert.match(page, /Datos de ejemplo|DATOS DE EJEMPLO/);
});

test("legal links are marked for legal review and brand name is NIVAL", () => {
  assert.match(page, /NIVAL/);
  assert.match(page, /pendiente de revisión legal/);
  assert.match(
    layout,
    /Tarjeta de puntos y reseñas de Google para negocios locales/,
  );
});

test("responsive layout, keyboard focus, reduced motion and carousel are present", () => {
  assert.match(css, /@media\s*\(max-width:\s*800px\)/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@keyframes nvCarousel/);
  assert.match(css, /@keyframes nvFloat/);
  assert.match(css, /@keyframes nvPulse/);
});
