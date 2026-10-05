import {Pool,neonConfig} from '@neondatabase/serverless';
import {randomBytes,randomUUID} from 'node:crypto';
import {hashPin,sha256} from '../lib/foundation/security.mjs';
import {writeFileSync,existsSync,mkdirSync} from 'node:fs';
const required=['DATABASE_URL','NEON_AUTH_BASE_URL','SEED_OWNER_EMAIL','SEED_OWNER_PASSWORD','SEED_STAFF1_PIN','SEED_STAFF2_PIN'];
for(const key of required)if(!process.env[key])throw Error('Configura '+key+' como variable privada antes de crear el demo.');
if(process.env.SEED_OWNER_PASSWORD.length<12)throw Error('La contraseña demo debe tener al menos 12 caracteres.');
for(const key of ['SEED_STAFF1_PIN','SEED_STAFF2_PIN'])if(!/^\d{6,8}$/.test(process.env[key]))throw Error('Los PIN deben tener 6 a 8 dígitos.');
const origin=process.env.APP_URL||'http://localhost:3000';
neonConfig.webSocketConstructor=globalThis.WebSocket;
const pool=new Pool({connectionString:process.env.DATABASE_URL});const client=await pool.connect();
let inTransaction=false;
async function account(email,name,password){
 const lookup=await client.query('select id from neon_auth."user" where lower(email)=lower($1)',[email]);
 if(lookup.rows[0])throw Error('Ya existe una cuenta para un correo del seed. Para evitar cambiar usuarios reales, usa correos demo nuevos.');
 const response=await fetch(process.env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/sign-up/email',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({email,name,password})});
 const data=await response.json();if(!response.ok||!data.user?.id)throw Error('Neon Auth no creó la cuenta demo. Revisa Trusted Domains y la configuración de correo.');return data.user.id;
}
try{
 const {rows:[target]}=await client.query('select current_database() as name');if(target.name!=='nival_puntos_resenas')throw Error('Base incorrecta.');
 const {rows:[existing]}=await client.query("select id from nival_pr.businesses where slug='cafe-demo'");if(existing){console.log('Café Demo ya existe; no se duplicó el seed.');}else{
  mkdirSync('.private',{recursive:true});
  if(existsSync('.private/demo-accounts.json'))throw Error('Hay un checkpoint de cuentas creadas. Revisa ese archivo antes de volver a ejecutar.');
  const ownerEmail=process.env.SEED_OWNER_EMAIL;
  const stamp=randomBytes(6).toString('hex');const emails=[`mesero-1-${stamp}@example.com`,`mesero-2-${stamp}@example.com`];
  const accounts=[];const checkpoint=()=>writeFileSync('.private/demo-accounts.json',JSON.stringify({accounts,created_at:new Date().toISOString()},null,2),{mode:0o600});
  for(const [email,name,password] of [[ownerEmail,'Owner Café Demo',process.env.SEED_OWNER_PASSWORD],[emails[0],'Mesero 1',randomBytes(32).toString('base64url')],[emails[1],'Mesero 2',randomBytes(32).toString('base64url')]]){const id=await account(email,name,password);accounts.push({id,email,name});checkpoint();}
  const [owner,staff1,staff2]=accounts.map(a=>a.id);const b=randomUUID();
  await client.query('begin');inTransaction=true;
  await client.query("insert into nival_pr.profiles(id,role,full_name) values($1,'owner','Owner Café Demo'),($2,'staff','Mesero 1'),($3,'staff','Mesero 2')",[owner,staff1,staff2]);
  await client.query("insert into nival_pr.businesses(id,slug,name,giro,status,plan_id,paid_until) values($1,'cafe-demo','Café Demo','Cafetería','activo',(select id from nival_pr.plans order by name limit 1),now()+interval '30 days')",[b]);
  await client.query("insert into nival_pr.memberships(user_id,business_id,role,pin_hash) values($1,$4,'owner',null),($2,$4,'staff',$5),($3,$4,'staff',$6)",[owner,staff1,staff2,b,await hashPin(process.env.SEED_STAFF1_PIN),await hashPin(process.env.SEED_STAFF2_PIN)]);
  const {rows:[program]}=await client.query("insert into nival_pr.programs(business_id,name,mode) values($1,'Café de regalo','single') returning id",[b]);
  await client.query("insert into nival_pr.rewards(program_id,name,points_cost,position) values($1,'Un café americano',5,0)",[program.id]);
  for(let i=1;i<=20;i++)await client.query('insert into nival_pr.customers(business_id,phone,name) values($1,$2,$3)',[b,'550000'+String(i).padStart(4,'0'),'Cliente Demo '+i]);
  await client.query('commit');inTransaction=false;
  writeFileSync('.private/demo-access.json',JSON.stringify({business:'cafe-demo',owner_email:ownerEmail,staff1_id:staff1,staff2_id:staff2,customers:20},null,2),{mode:0o600});
  console.log('Café Demo creado con owner, dos meseros y 20 clientes ficticios. Identificadores en .private/demo-access.json. No se imprimen contraseñas ni PIN.');
 }
}catch(error){if(inTransaction)await client.query('rollback');console.error(error.message);process.exitCode=1;}finally{client.release();await pool.end();}
