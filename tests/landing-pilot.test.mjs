import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/page.tsx", "utf8");
const css = readFileSync("app/landing-reference.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");

test("landing has eight sections and labeled image placeholders", () => {
  for (const text of [
    "Haz que tu negocio sea",
    "Tres pasos. Un",
    "Puntos",
    "Tu panel te dice",
    "number={1}",
    "number={11}",
    "Ejemplos de diseño",
  ]) {
    assert.ok(page.includes(text), text);
  }
  assert.equal((page.match(/<section\b/g) || []).length, 8);
  for (const id of [
    "producto",
    "panel",
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

test("prices and plan limits match the current entitlements", () => {
  for (const text of [
    'price: "$299"',
    'price: "$399"',
    'price: "$549"',
    "3 tarjetas NFC + QR para reseñas",
    "6 tarjetas NFC + QR para reseñas",
    "12 tarjetas NFC + QR para reseñas",
    "10 respuestas a reseñas / periodo",
    "30 respuestas a reseñas / periodo",
    "100 respuestas a reseñas / periodo",
    "RECOMENDADO",
    "Comparación con negocios cercanos",
  ]) {
    assert.ok(page.includes(text), text);
  }
  assert.match(page, /Nival Pay/);
  assert.match(page, /como complemento/);
});

test("examples are labeled and unconfirmed business rules are not promised", () => {
  assert.match(page, /Ejemplos/);
  assert.match(page, /plazo de respuesta del servicio está pendiente de confirmar/);
  assert.match(page, /Según la actividad configurada/);
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
