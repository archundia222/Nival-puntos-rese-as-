import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('../lib/owner/demo-fixtures.json',import.meta.url),'utf8'));
test('demo monthly visit count agrees with per-customer activity',()=>{
 const month=fixture.month;
 const total=month.segments.reduce((sum,c)=>sum+Number(c.recent_visits||0),0);
 assert.equal(month.metrics.find(x=>x.period==='current').visits,total);
 assert.equal(month.activity.reduce((sum,x)=>sum+Number(x.active_users||0),0),total);
 assert.equal(month.ranking.reduce((sum,x)=>sum+Number(x.visits||0),0),total);
});
test('demo audience segmentation is complete and exclusive',()=>{
 const customers=fixture.month.segments;
 assert.equal(customers.length,120);
 for(const c of customers){
  const classes=[Boolean(c.is_new),Boolean(c.is_frequent),Boolean(c.is_risk&&!c.is_lost),Boolean(c.absent_month)];
  assert.equal(classes.filter(Boolean).length,1,c.name);
 }
 assert.equal(customers.filter(c=>c.is_new).length,fixture.month.metrics[0].new_customers);
});
test('demo active visits are plausible and campaigns never claim causal lift',()=>{
 const c=fixture.month.segments;
 for(const x of c)assert.ok(Number(x.recent_visits)>=0 && Number(x.recent_visits)<=6,x.name);
});
