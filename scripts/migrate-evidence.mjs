import {neon} from '@neondatabase/serverless';
import {evidenceStorage,migrateEvidence,digest} from '../lib/storage/evidence.mjs';
if(!process.argv.includes('--apply'))throw Error('Revisa el procedimiento y ejecuta con --apply en la base aprobada.');
if(!process.env.DATABASE_URL)throw Error('Configura DATABASE_URL en el entorno, nunca en el chat.');
const sql=neon(process.env.DATABASE_URL),storage=evidenceStorage();
const [db]=await sql.query('select current_database() name');if(db.name!=='nival_puntos_resenas')throw Error('Base incorrecta.');
let count=0;
while(true){
 const [row]=await sql.query("select e.path,encode(e.data,'base64') photo,e.mime,o.sha256 existing_hash from nival_pr_private.evidence_photos e left join nival_pr_private.evidence_objects o on o.path=e.path order by e.path limit 1");if(!row)break;
 if(row.existing_hash&&row.existing_hash!==digest(Buffer.from(row.photo,'base64')))throw Error('Referencia distinta: no sobrescribir el objeto.');
 await migrateEvidence({row,storage,commit:async({key,size,hash})=>{
 const result=await sql.transaction([
 sql.query(`insert into nival_pr_private.evidence_objects(path,object_key,mime,size_bytes,sha256) values($1,$2,$3,$4,$5)
 on conflict(path) do update set object_key=excluded.object_key where evidence_objects.sha256=excluded.sha256 returning path`,[row.path,key,row.mime,size,hash]),
 sql.query(`delete from nival_pr_private.evidence_photos e where path=$1 and data=decode($2,'base64') and exists(select 1 from nival_pr_private.evidence_objects o where o.path=e.path and o.sha256=$3 and o.object_key=$4) returning path`,[row.path,row.photo,hash,key])
 ]);
 if(!result[0].length||!result[1].length)throw Error('Conflicto: revisa la referencia; no se avanza automáticamente.');
 }});count++;console.log('Fotos copiadas y verificadas:',count);
}
console.log('Migración terminada; fotos binarias restantes: 0. Verifica canjes y URLs desde Preview.');
