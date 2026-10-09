import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

test('review page and report generation execute with formatted dates and chronological ordering',async()=>{
 const db=new PGlite();
 try{
  await db.exec("create schema nival_pr; create table nival_pr.reviews(id int,business_id int,reviewed_on date); insert into nival_pr.reviews values(1,10,'2026-09-01'),(2,10,'2026-09-03'),(3,20,'2026-09-04');");
  const queryFrom=path=>{
   const source=readFileSync(path,'utf8');
   const match=source.match(/select rv\.\*,to_char\([\s\S]*?(?=["`])/);
   assert.ok(match,'Expected actual review query');return match[0];
  };
  const page=(await db.query(queryFrom('app/admin/reportes/page.tsx'),[10])).rows;
  assert.deepEqual(page.map(r=>r.id),[2,1]);
  assert.deepEqual(page.map(r=>r.reviewed_on_iso),['2026-09-03','2026-09-01']);
  const period=(await db.query(queryFrom('lib/reputation/actions.ts'),[10,'2026-09-01','2026-09-03'])).rows;
  assert.deepEqual(period.map(r=>r.id),[1]);
  assert.equal(period[0].reviewed_on_iso,'2026-09-01');
 }finally{await db.close();}
});
