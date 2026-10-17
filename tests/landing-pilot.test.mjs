import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const page = readFileSync("app/page.tsx", "utf8");
const mobileNav = readFileSync("app/landing-mobile-nav.tsx", "utf8");
const css = readFileSync("app/landing-reference.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");

test("landing tells the product story in five short sections", () => {
  for (const text of [
    "Que vuelvan.",
    "Tres herramientas.",
    "Entras y sabes",
    "Precios sin sorpresas.",
    "¿Te queda alguna duda?",
  ]) assert.ok(page.includes(text), text);
  assert.equal((page.match(/<section\b/g) || []).length, 5);
  for (const id of ["producto", "panel", "planes", "preguntas"])
    assert.ok(page.includes(`id="${id}"`), id);
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
  assert.match(page, /tarjeta de regalo o Nival Pay/i);
  assert.match(page, /como complementos/i);
});

test("sample metrics are labeled and real images replace upload placeholders", () => {
  assert.match(page, /EJEMPLO|ejemplo/);
  assert.match(page, /Datos de ejemplo/);
  assert.match(page, /periodo para identificar clientes en riesgo se configura/);
  assert.doesNotMatch(page, /Espacio para imagen|pendiente de recibir/);
  for (const image of ["6105", "6106", "6107", "6109", "6111", "6112", "6113", "6114"])
    assert.ok(existsSync(`public/assets/img/landing/${image}.webp`), image);
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
