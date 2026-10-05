import {Pool,neonConfig} from '@neondatabase/serverless';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
if(!process.argv.includes('--apply'))throw Error('Ejecuta con --apply solo después de revisar el SQL y probarlo.');
if(!process.env.DATABASE_URL)throw Error('Configura DATABASE_URL privada.');
neonConfig.webSocketConstructor=globalThis.WebSocket;
const pool=new Pool({connectionString:process.env.DATABASE_URL});const client=await pool.connect();
try{
 const {rows:[target]}=await client.query('select current_database() as name');
 if(target.name!=='nival_puntos_resenas')throw Error('Base incorrecta: se requiere nival_puntos_resenas.');
 const sql=readFileSync(new URL('../database/foundation-neon.sql',import.meta.url),'utf8');const digest=createHash('sha256').update(sql).digest('hex');
 const {rows:[existing]}=await client.query("select exists(select 1 from pg_namespace where nspname='nival_pr') as exists");
 if(existing.exists){
  const {rows:[version]}=await client.query("select checksum from nival_pr_private.schema_versions where name='foundation-v1'");
  if(version?.checksum!==digest)throw Error('El esquema ya existe con una versión distinta. Requiere migración incremental; no sobrescribir.');
  console.log('La migración aprobada ya está aplicada.');
 }else{
  // El archivo se ejecuta con protocolo simple y una transacción. El marcador forma parte del mismo COMMIT.
  const marker=`create table nival_pr_private.schema_versions(name text primary key,checksum text not null,applied_at timestamptz not null default now());alter table nival_pr_private.schema_versions enable row level security;revoke all on nival_pr_private.schema_versions from public;insert into nival_pr_private.schema_versions(name,checksum) values('foundation-v1','${digest}');`;
  await client.query(sql.replace(/commit;\s*$/i,marker+'\ncommit;'));
  console.log('Migración aplicada en la base independiente.');
 }
 const {rows}=await client.query("select count(*)::int as protected_tables from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('nival_pr','nival_pr_private') and c.relkind='r' and c.relrowsecurity");
 console.log('Tablas protegidas por RLS:',rows[0].protected_tables);
}catch(error){await client.query('rollback').catch(()=>{});console.error(error.message);process.exitCode=1;}finally{client.release();await pool.end();}
