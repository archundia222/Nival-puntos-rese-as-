import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',b='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',bb='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

export async function ownerFixture(){
 const db=new PGlite();
 await db.exec('create schema neon_auth;create table neon_auth."user"(id uuid primary key);');
 for(const path of ['foundation-neon','points-neon','points-lifecycle','points-legacy-phones','owner-panel','owner-report-scope'])await db.exec(readFileSync('database/'+path+'.sql','utf8'));
 await db.query('insert into neon_auth."user" values($1),($2)',[owner,other]);
 await db.query("insert into nival_pr.profiles(id,role,full_name) values($1,'owner','Owner'),($2,'owner','Other')",[owner,other]);
 await db.query("insert into nival_pr.businesses(id,name,slug) values($1,'Example','example'),($2,'Other','other')",[b,bb]);
 await db.query("insert into nival_pr.memberships(user_id,business_id,role) values($1,$3,'owner'),($2,$4,'owner')",[owner,other,b,bb]);
 // Only this disposable PGlite test database permits historical fixture entries.
 await db.exec('alter table nival_pr.point_ledger disable trigger guard_movement;');
 const ages=[[1],[2],[3],[4],...[1,2,3,4].map(()=>[20,10,1]),[90,45],[91,31],[120,60],[100,40],[120,61],[180,90],[240,100],[365,62],[20],[30],[],[]];
 for(let i=0;i<ages.length;i++){
 const {rows:[c]}=await db.query("insert into nival_pr.customers(business_id,name,phone,device_token_hash) values($1,$2,$3,$4) returning id",[b,'Cliente '+(i+1),'52550000'+String(i).padStart(4,'0'),String(i).padStart(64,'0')]);
 for(const age of ages[i])await db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,created_at) values($1,$2,'visit',1,$3,(date '2026-10-05'-$4::int)::timestamp at time zone 'America/Mexico_City')",[b,c.id,owner,age]);
 }
 await db.exec('alter table nival_pr.point_ledger enable trigger guard_movement;');

return {db,owner,other,b,bb};
}
