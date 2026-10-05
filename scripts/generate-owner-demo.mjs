// Generates synthetic presentation fixtures from the exact PostgreSQL analytics queries.
import {ownerFixture} from '../tests/owner-fixture.mjs';
import {ownerStatements} from '../lib/owner/queries.mjs';
import {periodRange,googleSelection} from '../lib/owner/domain.mjs';
import {writeFileSync} from 'node:fs';
const {db,owner,b}=await ownerFixture();
try{
 for(const [period,rating,total,fresh,answered,dist] of [['2026-09-01',4.4,100,12,10,{1:3,2:2,3:5,4:20,5:70}],['2026-10-01',4.5,110,10,7,{1:3,2:2,3:5,4:22,5:78}]])await db.query("insert into nival_pr.review_reports(business_id,period,period_kind,rating,total_reviews,new_reviews,answered,distribution,profile_checklist,notes,created_by,answered_scope) values($1,$2,'month',$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,'period')",[b,period,rating,total,fresh,answered,JSON.stringify(dist),JSON.stringify({fotos:true,horarios:true,categoria:true,descripcion:false,publicaciones:false,menu:true,preguntas:false,reservas:false}),'Agrega una descripción clara del negocio y revisa las preguntas sin respuesta. Usa fotos recientes de tus productos disponibles.',owner]);
 await db.query("insert into nival_pr.changelog(business_id,date,description) values($1,'2026-10-03T18:00:00Z','Actualizamos los horarios y agregamos fotos del menú.')",[b]);
 await db.exec('set role npr_v2_owner');await db.query("select set_config('npr.user_id',$1,false)",[owner]);
 const result={};
 for(const kind of ['day','month','year']){
 const range=periodRange(kind,'',new Date('2026-10-05T12:00:00Z'));
 const rows=[];for(const st of ownerStatements(b,range))rows.push((await db.query(st.text,st.values)).rows);
 const [settings,segments,metrics,ranking,reports,changes,templates]=rows;
 result[kind]={settings:settings[0]||null,segments:segments.map(c=>({...c,phone:''})),metrics,ranking:ranking.map(r=>({...r,name:'Equipo de Café Demo'})),...googleSelection(reports,range),changes,templates};
 }
 writeFileSync('lib/owner/demo-fixtures.json',JSON.stringify(result,null,2)+'\n');console.log('Demo generated: 20 synthetic customers; real SQL analytics.');
}finally{await db.close();}
