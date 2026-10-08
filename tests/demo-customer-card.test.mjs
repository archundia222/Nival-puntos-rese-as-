import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('demo share link and QR open the clearly labeled sample customer card', async () => {
  const [share, qr, page, owner] = await Promise.all([
    read('../lib/owner/share-tools.tsx'),
    read('../app/api/demo/qr/route.ts'),
    read('../app/demo/tarjeta/page.tsx'),
    read('../lib/owner/view.tsx'),
  ]);

  assert.match(share, /demo\?'\/demo\/tarjeta'/);
  assert.match(qr, /url\.origin\+'\/demo\/tarjeta'/);
  assert.match(page, /Vista de ejemplo/);
  assert.match(page, /No crea una cuenta ni guarda visitas o puntos/);
  assert.match(page, /href="\/demo\/panel"/);
  assert.match(owner, /Esta muestra abre una tarjeta ficticia y no guarda datos/);
});

test('sample customer card has no enrollment form or write action', async () => {
  const page = await read('../app/demo/tarjeta/page.tsx');
  assert.doesNotMatch(page, /<form|VerifiedActionForm|ActionForm|enroll|fetch\s*\(|server action/i);
  assert.match(page, /aria-valuenow=\{points\}/);
  assert.match(page, /className="loyaltyCard"/);
});
