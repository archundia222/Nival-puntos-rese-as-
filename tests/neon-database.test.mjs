import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const a='11111111-1111-4111-8111-111111111111';const b='22222222-2222-4222-8222-222222222222';const operator='33333333-3333-4333-8333-333333333333';
async function setup(){const db=new PGlite();await db.exec(`create schema neon_auth; create table neon_auth."user"(id uuid primary key); insert into neon_auth."user" values('${a}'),('${b}'),('${operator}');`);await db.exec(readFileSync('database/neon.sql','utf8'));return db;}
async function as(db,id){await db.exec(`reset role; set role npr_app; select set_config('npr.user_id','${id}',false);`);}
async function business(db,id,name){await as(db,id);return(await db.query('insert into public.npr_businesses(owner_id,name) values($1,$2) returning id',[id,name])).rows[0].id;}
test('owners only see their data and cannot promote themselves to operator',async()=>{const db=await setup();try{const ba=await business(db,a,'Negocio A');await business(db,b,'Negocio B');await as(db,a);assert.equal((await db.query('select name from npr_businesses')).rows.length,1);await assert.rejects(db.query('insert into npr_operators(user_id) values($1)',[a]),/permission denied/);await assert.rejects(db.query('update npr_businesses set owner_id=$1 where id=$2',[b,ba]),/permission denied/);await as(db,b);await assert.rejects(db.query('insert into npr_customers(business_id,name) values($1,$2)',[ba,'Ajeno']),/row-level security/);await db.exec('reset role; set role npr_anon;');await assert.rejects(db.query('select * from npr_businesses'),/permission denied/);}finally{await db.close();}});
test('visits award one point; reward cannot overdraw or use arbitrary amount',async()=>{const db=await setup();try{const bid=await business(db,a,'A');const cid=(await db.query("insert into npr_customers(business_id,name) values($1,'Cliente') returning id",[bid])).rows[0].id;const add=(kind,points)=>db.query('insert into npr_movements(business_id,customer_id,kind,points) values($1,$2,$3,$4)',[bid,cid,kind,points]);await assert.rejects(add('redeem',-5),/Insufficient points/);await assert.rejects(add('visit',100),/check constraint/);for(let i=0;i<5;i++)await add('visit',1);await assert.rejects(add('redeem',-1),/Invalid reward amount/);await add('redeem',-5);assert.equal(Number((await db.query('select sum(points) as balance from npr_movements')).rows[0].balance),0);await assert.rejects(add('redeem',-5),/Insufficient points/);await assert.rejects(db.query('delete from npr_movements'),/permission denied/);}finally{await db.close();}});
test('only operator writes reviews, owners can read theirs',async()=>{const db=await setup();try{const bid=await business(db,a,'A');await assert.rejects(db.query("insert into npr_reviews(business_id,author,rating,review_date) values($1,'Autor',5,'2026-10-01')",[bid]),/row-level security/);await db.exec('reset role');await db.query('insert into npr_operators values($1)',[operator]);await as(db,operator);await db.query("insert into npr_reviews(business_id,author,rating,review_date) values($1,'Autor',3,'2026-10-01')",[bid]);await as(db,a);assert.equal((await db.query('select * from npr_reviews')).rows.length,1);await as(db,b);assert.equal((await db.query('select * from npr_reviews')).rows.length,0);}finally{await db.close();}});

test('diagnostics are operator-only writes and owners only read their own history',async()=>{const db=await setup();try{const bid=await business(db,a,'A');await business(db,b,'B');const insert=()=>db.query("insert into npr_diagnostics(business_id,checked_on,rating,review_count,findings,recommendations) values($1,'2026-10-01',4.3,12,'Fotos desactualizadas','Actualizar fotos')",[bid]);await as(db,a);await assert.rejects(insert(),/row-level security/);await db.exec('reset role');await db.query('insert into npr_operators values($1)',[operator]);await as(db,operator);await insert();await assert.rejects(insert(),/unique constraint/);await as(db,a);assert.equal((await db.query('select * from npr_diagnostics')).rows.length,1);await assert.rejects(db.query("update npr_diagnostics set rating=5"),/permission denied/);await as(db,b);assert.equal((await db.query('select * from npr_diagnostics')).rows.length,0);await db.exec('reset role; set role npr_anon;');await assert.rejects(db.query('select * from npr_diagnostics'),/permission denied/);}finally{await db.close();}});

test('public review links expose only published data and remain owner controlled',async()=>{
 const db=await setup();try{
  const bid=await business(db,a,'A');await business(db,b,'B');await as(db,a);
  const link=(await db.query("insert into npr_review_links(business_id,display_name,google_url) values($1,'Nombre público','https://g.page/r/abc/review') returning id",[bid])).rows[0].id;
  await assert.rejects(db.query("update npr_review_links set google_url='https://evil.example/test' where id=$1",[link]),/check constraint/);
  await db.exec('reset role; set role npr_anon;');
  assert.equal((await db.query('select id,display_name,google_url from npr_review_links')).rows.length,1);
  await assert.rejects(db.query('select business_id from npr_review_links'),/permission denied/);
  await assert.rejects(db.query("insert into npr_review_links(business_id,display_name,google_url) values($1,'Falso','https://g.page/r/abc/review')",[bid]),/permission denied/);
  await assert.rejects(db.query('select * from npr_customers'),/permission denied/);
  await as(db,b);
  assert.equal((await db.query("update npr_review_links set display_name='Ajeno' where id=$1 returning id",[link])).rows.length,0);
  await assert.rejects(db.query("insert into npr_review_links(business_id,display_name,google_url) values($1,'Ajeno','https://g.page/r/xyz/review')",[bid]),/row-level security/);
  await as(db,a);await db.query('update npr_review_links set active=false where id=$1',[link]);
  assert.equal((await db.query('select id from npr_review_links')).rows.length,1);
  await as(db,b);assert.equal((await db.query('select id from npr_review_links')).rows.length,0);
  await db.exec('reset role; set role npr_anon;');assert.equal((await db.query('select id from npr_review_links')).rows.length,0);
 }finally{await db.close();}
});

test('customer cards start disabled, are owner controlled, and can be revoked or rotated',async()=>{
 const db=await setup();try{
  const bid=await business(db,a,'A');await business(db,b,'B');await as(db,a);
  const customer=(await db.query("insert into npr_customers(business_id,name) values($1,'Privado') returning id,card_token,card_enabled",[bid])).rows[0];
  assert.equal(customer.card_enabled,false);
  await db.query('update npr_customers set card_enabled=true where id=$1',[customer.id]);
  await as(db,b);assert.equal((await db.query('update npr_customers set card_enabled=false where id=$1 returning id',[customer.id])).rows.length,0);
  await db.exec('reset role; set role npr_anon;');await assert.rejects(db.query('select card_token from npr_customers'),/permission denied/);
  const lookup=token=>db.query('select id,business_id from npr_customers where card_token=$1 and card_enabled=true',[token]);
  await db.exec('reset role; set role npr_card_reader;');await db.query("select set_config('npr.card_token',$1,false)",[customer.card_token]);assert.equal((await lookup(customer.card_token)).rows.length,1);
  await as(db,a);await db.query('update npr_customers set card_token=gen_random_uuid() where id=$1',[customer.id]);
  const newToken=(await db.query('select card_token from npr_customers where id=$1',[customer.id])).rows[0].card_token;
  await db.exec('reset role; set role npr_card_reader;');await db.query("select set_config('npr.card_token',$1,false)",[customer.card_token]);assert.equal((await lookup(customer.card_token)).rows.length,0);await db.query("select set_config('npr.card_token',$1,false)",[newToken]);assert.equal((await lookup(newToken)).rows.length,1);
  await as(db,a);await db.query('update npr_customers set card_enabled=false where id=$1',[customer.id]);
  await db.exec('reset role; set role npr_card_reader;');assert.equal((await lookup(newToken)).rows.length,0);
 }finally{await db.close();}
});
