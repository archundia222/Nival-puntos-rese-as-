const assert=require('node:assert/strict');
const test=require('node:test');
const ts=require('typescript');
const fs=require('node:fs');
const mod={exports:{}};
new Function('module','exports',ts.transpile(fs.readFileSync('lib/monthly-report.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(mod,mod.exports);
const{monthlyReport,validMonth}=mod.exports;
test('Mexico midnight assigns visits to the correct month and ignores redemptions as visits',()=>{
 const r=monthlyReport([{id:'a',created_at:'2026-10-01T02:00:00Z'}],[{customer_id:'a',kind:'visit',points:1,happened_at:'2026-10-01T02:00:00Z'},{customer_id:'a',kind:'visit',points:1,happened_at:'2026-10-01T07:00:00Z'},{customer_id:'a',kind:'redeem',points:-2,happened_at:'2026-10-02T07:00:00Z'}],[],'2026-10');
 assert.equal(r.newCustomers,0);assert.equal(r.visits,1);assert.equal(r.returning,1);assert.equal(r.redemptions,1);
});
test('review counts include neutral scores and responses confirmed after the review month',()=>{
 const r=monthlyReport([],[],[{rating:5,review_date:'2026-09-30',answered_at:null},{rating:3,review_date:'2026-10-01',answered_at:'2026-11-01'},{rating:1,review_date:'2026-10-02',answered_at:null}],'2026-10');
 assert.equal(r.reviews,2);assert.equal(r.neutral,1);assert.equal(r.negative,1);assert.equal(r.answered,1);assert.equal(r.pending,1);assert.equal(r.average,2);
});
test('empty history has no invented ratings and invalid months are rejected',()=>{
 const r=monthlyReport([],[],[],'2026-10');assert.equal(r.average,null);assert.equal(r.visits,0);assert.equal(r.recommendations.length,2);assert.equal(validMonth('2026-13'),false);assert.throws(()=>monthlyReport([],[],[],'2026-00'));
});
