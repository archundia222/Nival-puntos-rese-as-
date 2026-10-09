import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const editor = readFileSync('lib/points/program-editor.tsx', 'utf8');
const action = readFileSync('lib/foundation/actions.ts', 'utf8');
const customerCard = readFileSync('lib/points/card-view.tsx', 'utf8');
const migration = readFileSync('database/automation-ready-v7.sql', 'utf8');

test('card designs edit live, accept owned image assets, and render on the customer card', () => {
  for (const choice of ['nival', 'botanico', 'noche']) assert.ok(editor.includes(choice));
  assert.ok(editor.includes('VISTA PREVIA EN VIVO'));
  assert.ok(editor.includes('chooseBackground'));
  assert.ok(action.includes('card_design: cardDesign'));
  assert.ok(action.includes("coalesce(programs.rules, '{}'::jsonb) || excluded.rules"));
  assert.ok(customerCard.includes('card_design?.background'));
  assert.ok(customerCard.includes('card_design?.footer'));
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
