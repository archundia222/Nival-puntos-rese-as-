import {Pool,neonConfig} from '@neondatabase/serverless';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
if(!process.argv.includes('--apply'))throw Error('Usa --apply para aplicar la migración revisada.');
if(!process.env.DATABASE_URL)throw Error('Configura DATABASE_URL privada.');
neonConfig.webSocketConstructor=globalThis.WebSocket;
const pool=new Pool({connectionString:process.env.DATABASE_URL});const db=await pool.connect();
try{
 const {rows:[target]}=await db.query('select current_database() name');
 if(target.name!=='nival_puntos_resenas')throw Error('Base incorrecta.');
 const name='plan-pricing-v9',sql=readFileSync(new URL('../database/'+name+'.sql',import.meta.url),'utf8'),checksum=createHash('sha256').update(sql).digest('hex');
 const {rows:[previous]}=await db.query('select checksum from nival_pr_private.schema_versions where name=$1',[name]);
 if(previous){if(previous.checksum!==checksum)throw Error('La migración aplicada difiere de esta versión.');console.log(name+': ya aplicada');}
 else{await db.query(sql.replace(/commit;\s*$/i,`insert into nival_pr_private.schema_versions(name,checksum) values('${name}','${checksum}');\ncommit;`));console.log(name+': aplicada');}
}catch(e){await db.query('rollback').catch(()=>{});console.error(e.message);process.exitCode=1;}finally{db.release();await pool.end();}
