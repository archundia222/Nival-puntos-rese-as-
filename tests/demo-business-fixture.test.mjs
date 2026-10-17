import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../lib/owner/demo-fixtures.json' with {type:'json'};
import {readFile} from 'node:fs/promises';

test('busy-business demo is fully labeled sample data with non-contactable mock phones',async()=>{
 const [page,customers]=await Promise.all([
  readFile(new URL('../app/demo/panel/page.tsx',import.meta.url),'utf8'),
  readFile(new URL('../lib/owner/customer-explorer.tsx',import.meta.url),'utf8'),
 ]);
 assert.match(page,/Datos de ejemplo|datos ficticios/);
 assert.match(customers,/Perfiles y teléfonos ficticios/);
 assert.equal(fixture.month.segments.length,120);
 assert.ok(fixture.month.segments.every(c=>/^55 0000 \d{4}$/.test(c.phone)));
 assert.ok(fixture.month.segments.every(c=>Number.isFinite(c.balance)&&Number.isFinite(c.redemptions)));
 assert.equal(fixture.month.metrics[0].visits,fixture.month.activity.reduce((sum,day)=>sum+day.active_users,0));
});

test('demo showcases active points, gift, review cards, staff and Google usage',()=>{
 for(const period of Object.values(fixture)){
  assert.equal(period.program.card_enabled,true);
  assert.equal(period.rewards.length,3);
  assert.equal(period.reviewCards.filter(card=>card.active).length,9);
  assert.equal(period.ranking.length,8);
  assert.equal(period.google.answered,94);
  assert.equal(period.last.total_reviews,1486);
 }
});
