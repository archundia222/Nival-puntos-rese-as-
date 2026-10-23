import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const editor = readFileSync('lib/points/program-editor.tsx', 'utf8');
const action = readFileSync('lib/foundation/actions.ts', 'utf8');
const customerCard = readFileSync('lib/points/card-view.tsx', 'utf8');
const migration = readFileSync('database/automation-ready-v7.sql', 'utf8');

test('card designs edit live, accept owned image assets, and render on the customer card', () => {
  assert.ok(editor.includes('theme:"minimal"'),'the approved minimal design remains the default');
  for (const key of ['secondaryColor','backgroundX','backgroundY','logoX','logoY','squareLogo','textColor']) assert.ok(editor.includes(key),'card visual customization remains: '+key);
  assert.ok(editor.includes('VISTA PREVIA · BORRADOR'));
  assert.ok(editor.includes('type="file"'));
  assert.ok(editor.includes('Recorte horizontal del fondo'));
  assert.ok(editor.includes('tab===3&&<button type="submit"')&&editor.includes('Publicar tarjeta'));
  assert.ok(!editor.includes('Guardar ahora'));
  assert.ok(action.includes('card_design: cardDesign'));
  assert.ok(action.includes("(coalesce(programs.rules, '{}'::jsonb)-'catalog_only') || excluded.rules"));
  assert.ok(customerCard.includes('business.program?.color'));
  assert.ok(customerCard.includes('readableCardText'));
  assert.ok(customerCard.includes('design.background'));
  assert.ok(customerCard.includes('design.footer'));
});

test('customer loyalty card has one shared scan code, automatic balance refresh, and reward status history', () => {
  assert.equal((customerCard.match(/className="customerQrPanel"/g) || []).length, 1);
  assert.equal((customerCard.match(/src=\{qr\}/g) || []).length, 1);
  assert.ok(customerCard.includes('setInterval(automatic, 6000)'));
  assert.ok(customerCard.includes('className="customerQrCode"'));
  assert.ok(customerCard.includes('onClick={copyCode}>Copiar'));
  assert.ok(!customerCard.includes('UN SOLO CÓDIGO PARA PUNTOS Y PREMIOS'));
  assert.ok(!customerCard.includes('personalQr'));
  assert.ok(!customerCard.includes('Actualizar mis puntos'));
  assert.ok(customerCard.includes('activityTab==="points"'));
  assert.ok(customerCard.includes('activityTab==="redemptions"'));
  assert.ok(customerCard.includes('activityTab==="rewards"'));
  assert.ok(customerCard.includes('customerProgressCount'));
  assert.ok(customerCard.includes('Te faltan '));
  assert.ok(!customerCard.includes('customerRewardSummary'));
});

test('automation groundwork only adds fields and review state storage', () => {
  assert.match(migration, /create table if not exists nival_pr\.review_items/);
  for (const status of ['pending', 'drafted', 'approved', 'published']) assert.ok(migration.includes(status));
  for (const mode of ['manual', 'assisted', 'automatic']) assert.ok(migration.includes(mode));
  assert.doesNotMatch(migration, /\b(drop|delete|truncate)\s+(table|from|column)/i);
  assert.doesNotMatch(migration, /\bupdate\s+nival_pr\./i);
});

test('owner dashboard exposes month-over-month retention from period queries', () => {
  const query = readFileSync('lib/owner/queries.mjs', 'utf8');
  const view = readFileSync('lib/owner/view.tsx', 'utf8');
  assert.ok(query.includes('returning_customers'));
  assert.ok(view.includes('Retención'));
});
