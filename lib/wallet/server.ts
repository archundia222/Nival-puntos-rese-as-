import 'server-only';
import { after } from 'next/server';
import { randomUUID } from 'node:crypto';
import { systemQuery } from '../foundation/db';
import { publicBusiness } from '../points/security';
import { configuration, googleClient, resources, saveUrl } from './google.mjs';

export function walletReady() {
 try { configuration(process.env); return true; } catch { return false; }
}
function publicOrigin() {
 const value=process.env.GOOGLE_WALLET_PUBLIC_ORIGIN || process.env.APP_URL || (process.env.VERCEL_BRANCH_URL ? 'https://'+process.env.VERCEL_BRANCH_URL : process.env.VERCEL_URL ? 'https://'+process.env.VERCEL_URL : process.env.APP_URL);
 const url=new URL(value || '');
 if(url.protocol!=='https:')throw Error('Wallet public HTTPS origin required');
 return url.origin;
}
export async function runWalletJobs(limit=6, customerId:string|null=null) {
 if(!walletReady())return {processed:0,failed:0,configured:false};
 const config=configuration(process.env),client=googleClient(config),origin=publicOrigin();
 let processed=0,failed=0; const started=Date.now();
 for(let i=0;i<limit;i++){
  if(Date.now()-started>12000)break;
  const lease=randomUUID();
  const [job]=await systemQuery(`with candidate as (
   select customer_id from nival_pr_private.wallet_sync where revision>synced_revision
   and available_at<=now() and (lease_until is null or lease_until<now())
   and ($1::uuid is null or customer_id=$1) order by available_at for update skip locked limit 1
  ) update nival_pr_private.wallet_sync w set lease_id=$2,lease_until=now()+interval '2 minutes'
   from candidate c where w.customer_id=c.customer_id returning w.*`,[customerId,lease]);
  if(!job)break;
  try {
   const [c]=await systemQuery(`select c.id,c.name,coalesce((select sum(points) from nival_pr.point_ledger l where l.customer_id=c.id),0)::text balance,b.slug from nival_pr.customers c join nival_pr.businesses b on b.id=c.business_id where c.id=$1 and c.business_id=$2`,[job.customer_id,job.business_id]);
   if(!c)throw Error('Wallet customer unavailable');
   const business=await publicBusiness(c.slug);
   await client.sync(resources(config,business,c,origin));
   await systemQuery(`update nival_pr_private.wallet_sync set synced_revision=$3,last_synced_at=now(),last_error=null,attempts=0,lease_id=null,lease_until=null where customer_id=$1 and lease_id=$2`,[job.customer_id,lease,job.revision]);
   processed++;
  } catch(e) {
   // Persist only a sanitized status; never Google's body, JWT, or credentials.
   const code=/^Wallet (?:OAuth|loyaltyClass|loyaltyObject) \d{3}$/.test(String((e as Error).message)) ? (e as Error).message : 'Wallet sync unavailable';
   await systemQuery(`update nival_pr_private.wallet_sync set attempts=attempts+1,last_error=$3,available_at=now()+make_interval(secs=>least(3600,30*power(2,least(attempts,7)))::int),lease_id=null,lease_until=null where customer_id=$1 and lease_id=$2`,[job.customer_id,lease,code]);
   failed++;
  }
 }
 return {processed,failed,configured:true};
}
export function kickWalletJobs() {
 // after() retains the Vercel function after the response; the durable queue survives crashes.
 try {if(walletReady())after(async()=>{try{await runWalletJobs();}catch{console.warn('Wallet worker unavailable');}});}catch{console.warn('Wallet worker scheduling unavailable');}
}
export async function customerSaveUrl(business:any,customer:any) {
 const config=configuration(process.env);
 await systemQuery(`insert into nival_pr_private.wallet_sync(customer_id,business_id) values($1,$2)
 on conflict(customer_id) do update set revision=wallet_sync.revision+1,available_at=now() returning customer_id`,[customer.id,business.id]);
 await runWalletJobs(1,customer.id);
 const [status]=await systemQuery('select synced_revision from nival_pr_private.wallet_sync where customer_id=$1 and business_id=$2',[customer.id,business.id]);
 if(!status||Number(status.synced_revision)===0)throw Error('Wallet not ready');
 return saveUrl(config,resources(config,business,customer,publicOrigin()),publicOrigin());
}
