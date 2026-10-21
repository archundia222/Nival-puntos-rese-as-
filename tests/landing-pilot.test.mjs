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
    "Que cada visita acerque el premio.",
    "De tu mostrador a Google.",
    "Descubre quién vuelve y quién necesita un impulso.",
    "Esto es lo que ves en Inicio.",
    "Elige cómo quieres crecer.",
    "Lo esencial, sin vueltas.",
    "Empieza en el mostrador.",
    "Nival gestiona las respuestas de forma manual y con tu permiso.",
  ]) assert.ok(page.includes(text), text);
  assert.ok(page.includes('<h1 id="hero-title">Puntos, reseñas de Google y tarjetas digitales.</h1>'));
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
    "MÁS ELEGIDO",
    "Comparación con negocios similares de tu zona",
  ]) assert.ok(page.includes(text), text);
  assert.doesNotMatch(page, /tarjeta de regalo digital/i,'gift cards must not be advertised');
  assert.match(page, /Consultar visitas, clientes por grupo y premios canjeados|Consulta visitas, clientes por grupo y premios canjeados/i);
  assert.ok(page.includes('name: "Básico"')&&page.includes('Elegir {plan.name}'),"Básico label and plan selection stay consistent");
  assert.match(page, /Dar puntos por visitas y canjear premios/i);
  assert.match(page, /className="nvPlanFullPerks"/);
  assert.match(page, /por 30 días/);
  assert.match(page, /EN TODOS LOS PLANES/);
  for (const feature of ["Dar puntos por visitas y canjear premios", "Consultar visitas y grupos de clientes", "Revisar calificación, reseñas y respuestas de Google en Inicio", "Registrar visitas y consultar premios canjeados", "Descargar el resumen mensual en PDF"])
    assert.ok(page.includes(feature), feature);
  assert.match(page, /Nival gestiona las respuestas de forma manual y con tu permiso/);
  assert.match(page, /resumen mensual en PDF/i);
  assert.match(page, /Tu equipo suma visitas/);
  assert.match(page, /Nival responde reseñas manualmente/);
});

test("sample metrics are labeled and real images replace upload placeholders", () => {
  assert.match(page, /EJEMPLO|ejemplo/);
  assert.match(page, /CAFÉ DEMO · EJEMPLO/,'Illustrative metrics must be explicitly labeled on the landing');
  assert.match(ownerView, /periodDays/);
  assert.doesNotMatch(page, /Espacio para imagen|pendiente de recibir/);
  for (const image of ["6105", "6106", "6107", "6109", "6111", "6112", "6113", "6114"])
    assert.ok(existsSync(`public/assets/img/landing/${image}.webp`), image);
  for (const image of ["puntos", "resenas"])
    assert.ok(existsSync(`public/assets/img/landing/${image}.webp`), image);
  assert.match(page, /NFC y QR para abrir la ficha de Google/i);
  assert.match(page, /TU FICHA DE GOOGLE/);
  assert.match(page, /áreas de mejora/i);
  assert.match(page, /<OwnerView/);
  assert.match(page, /demo embedded/);
  assert.match(ownerView, /embedded\?\x27div\x27:\x27main\x27/);
  assert.match(page, /demoRange/);
  assert.match(page, /nvLivePanelBody/);
  assert.match(ownerView, /Nuevos y recurrentes/);
  assert.match(ownerView, /data-panel="reseñas"/);
  assert.match(ownerView, /<Metric label="Calificación"/);
  assert.match(ownerView, /Qué mejorar en las reseñas/);
  assert.match(ownerView, /Comparación con la zona/);
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
  assert.match(css, /\.nvHero h1>span\+span\{margin-top:\.16em/);
  assert.match(css, /\.nvHero h1>span\+span\{[^}]*color:var\(--nv-dark\)/);
  assert.match(css, /font-size:clamp\(38px,3\.8vw,50px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test("business carousel loops automatically and has no visible controls", () => {
  assert.match(css, /@keyframes nvIndustryScroll/);
  assert.match(css, /animation:nvIndustryScroll/);
  assert.match(css, /nvIndustryScroll 22s linear infinite/);
  assert.match(carousel, /industry-clinic\.webp/);
  assert.match(carousel, /industry-ice-cream\.webp/);
  assert.match(carousel, /landing\/6107\.webp/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(carousel, /Pausar|Siguiente negocio|Negocio anterior|aria-label=".*flecha/i);
  assert.match(page, /cada cliente ve cuánto le falta en su celular/);
  assert.match(page, /Acerca el teléfono o escanea el QR/);
});

test("Google review charts explain counts and avoid a false one-point trend", () => {
  const charts = readFileSync("lib/owner/charts.tsx", "utf8");
  const workspaceCss = readFileSync("lib/owner/workspace.css", "utf8");
  assert.match(ownerView, /Reseñas por calificación/);
  assert.match(charts, /AxisChart/);
  assert.match(readFileSync("lib/owner/axis-chart.tsx","utf8"), /Toca una barra o punto/);
  assert.match(charts, /data\.length/);
  assert.match(charts, /Calificación de Google/);
  assert.match(charts, /new Map\(reports\.map/);
  assert.match(ownerView, /\[5,4,3,2,1\]/);
  assert.match(ownerView, /data-panel="reseñas"/);
  assert.match(ownerView, /<Bars title="Reseñas por calificación"/);
  assert.match(ownerView, /<ReviewInsights/);
  assert.ok(workspaceCss.includes('.nivalShell[data-section="reseñas"] [data-panel="reseñas"]'));
});

test("no business or demo advertises a gift card after retirement", () => {const catalog=readFileSync("lib/points/card-catalog.tsx","utf8"),demo=readFileSync("app/demo/panel/page.tsx","utf8");assert.doesNotMatch(page,/tarjeta de regalo digital|tarjeta de regalo Nival Pay/i);assert.ok(!catalog.includes('id="gift-card"'));assert.ok(!demo.includes("pay_card_url"));assert.ok(!ownerView.includes('data-panel="nival-pay"'));assert.ok(ownerView.includes('<CardCatalog'),'points and review cards remain');});
