import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../lib/owner/demo-fixtures.json' with {type:'json'};
import {demoRollingPeriod} from '../lib/owner/demo-period.mjs';
import {rollingPeriodRange} from '../lib/owner/domain.mjs';

test('demo 7/30/90 day periods show consistent activity instead of a daily zero state',()=>{
 const now=new Date('2026-10-05T12:00:00Z');
 for(const days of [7,30,90]){
  const range=rollingPeriodRange(days,now),data=demoRollingPeriod(fixture.month,range);
  const current=data.metrics.find(row=>row.period==='current');
  const previous=data.metrics.find(row=>row.period==='previous');
  assert.equal(data.activity.length,days);
  assert.ok(current.visits>0);
  assert.equal(data.activity.reduce((sum,row)=>sum+row.active_users,0),current.visits);
  assert.ok(previous.visits>0);
 }
});
