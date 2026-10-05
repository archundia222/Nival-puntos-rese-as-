const {test}=require('node:test');const assert=require('node:assert/strict');const ts=require('typescript');const fs=require('node:fs');
const compiled=ts.transpileModule(fs.readFileSync('lib/customer-card.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const m={exports:{}};new Function('exports','module',compiled)(m.exports,m);const {cardTokenValid,cardProgress}=m.exports;
test('card balances handle reward boundaries without inventing or awarding points',()=>{
 assert.deepEqual(cardProgress(3,5),{balance:3,goal:5,remaining:2,ready:false,percent:60});
 assert.equal(cardProgress(5,5).ready,true);assert.equal(cardProgress(12,5).remaining,0);assert.equal(cardProgress(12,5).percent,100);
 for(const [balance,goal] of [[-1,5],[1,0],[NaN,5],[2.5,5]])assert.throws(()=>cardProgress(balance,goal));
 assert.equal(cardTokenValid('11111111-1111-4111-8111-111111111111'),true);for(const token of ['1','customer-1','11111111-1111-1111-1111-111111111111'])assert.equal(cardTokenValid(token),false);
});
