import {Pool,neonConfig} from '@neondatabase/serverless';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
if(!process.argv.includes('--apply'))throw Error('Usa --apply para aplicar las migraciones revisadas.');
neonConfig.webSocketConstructor=globalThis.WebSocket;const pool=new Pool({connectionString:process.env.DATABASE_URL});const db=await pool.connect();
try{
 const {rows:[target]}=await db.query('select current_database() name');if(target.name!=='nival_puntos_resenas')throw Error('Base incorrecta');
 for(const name of ['reputation-v6','lealtad-v6','points-only-plan-v1']){
 const sql=readFileSync(new URL('../database/'+name+'.sql',import.meta.url),'utf8'),hash=createHash('sha256').update(sql).digest('hex');
 const {rows:[previous]}=await db.query('select checksum from nival_pr_private.schema_versions where name=$1',[name]);
 if(previous){if(previous.checksum!==hash)throw Error('La versión aplicada difiere: '+name);console.log(name+': ya aplicada');continue;}
 const marker="insert into nival_pr_private.schema_versions(name,checksum) values('"+name+"','"+hash+"');commit;";
 await db.query(sql.replace(/commit;\s*$/i,marker));console.log(name+': aplicada');
 }
}catch(e){await db.query('rollback').catch(()=>{});console.error(e.message);process.exitCode=1;}finally{db.release();await pool.end();}
