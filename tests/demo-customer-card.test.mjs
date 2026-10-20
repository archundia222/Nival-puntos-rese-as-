import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("demo share link and QR open the clearly labeled sample customer card", async () => {
  const [share, qr, page, owner] = await Promise.all([
    read("../lib/owner/share-tools.tsx"),
    read("../app/api/demo/qr/route.ts"),
    read("../app/demo/tarjeta/page.tsx"),
    read("../lib/owner/view.tsx"),
  ]);

  assert.match(share, /demo\?'\/demo\/tarjeta'/);
  assert.match(qr, /url\.origin\+'\/demo\/tarjeta'/);
  assert.match(page, /Muestra de diseño/);
  assert.match(page, /QR no registra visitas ni canjes/);
  assert.match(page, /href="\/demo\/panel"/);
  assert.match(
    owner,
    /Esta muestra abre una tarjeta ficticia y no guarda datos/,
  );
});

test("sample customer card has no enrollment form or write action", async () => {
  const page = await read("../app/demo/tarjeta/page.tsx");
  assert.doesNotMatch(
    page,
    /<form|VerifiedActionForm|ActionForm|enroll|fetch\s*\(|server action/i,
  );
  assert.match(page, /aria-valuenow=\{points\}/);
  assert.match(page, /className="loyaltyCard nivalConfiguredCard"/);
});

test("public landing explains Nival plans, points, and review support without unverified metrics", async () => {
  const landing = await read("../app/page.tsx");
  assert.ok(landing.includes('price: "$299"'));
  assert.ok(landing.includes('price: "$399"'));
  assert.ok(landing.includes('price: "$549"'));
  assert.ok(landing.includes("Cotizar por WhatsApp"));
  assert.ok(landing.includes('nfc: "3"'));
  assert.ok(landing.includes('nfc: "6"'));
  assert.ok(landing.includes('nfc: "12"'));
  assert.ok(landing.includes("Comparación con negocios similares de tu zona"));
  assert.ok(landing.includes('<h1 id="hero-title">Puntos, reseñas de Google y tarjetas digitales.</h1>'));
  assert.ok(landing.includes('Una visita válida con compra suma un punto.'),'loyalty mechanic remains explicit');
  assert.ok(landing.includes("CAFÉ DEMO · EJEMPLO"));
});
