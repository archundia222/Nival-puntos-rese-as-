'use server';
import {revalidatePath} from 'next/cache';
import {guardAction} from '../foundation/action-guard';
import {requireTool} from '../foundation/require-tool';
import {systemQuery} from '../foundation/db';
import {walletReady} from '../wallet/server';
import {configuration,googleClient} from '../wallet/google.mjs';
import type {Result} from '../foundation/actions';

const audiences=['all','new','frequent','at_risk','lost','absent'] as const;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function sendWalletCampaign(_:Result,form:FormData):Promise<Result>{
 const actor=await guardAction(['owner'],form);
 const businessId=String(form.get('businessId')||'');
 const audience=String(form.get('audience')||'');
 const title=String(form.get('title')||'').trim();
 const body=String(form.get('body')||'').trim();
 if(!uuid.test(businessId)||!audiences.includes(audience as typeof audiences[number])||title.length<1||title.length>60||body.length<1||body.length>250)
 return {error:'Revisa el público, el título y el mensaje.'};
 if(form.get('confirmation')!=='on')return {error:'Confirma los destinatarios antes de enviar.'};
 await requireTool(actor,businessId);
 if(!walletReady())return {error:'Google Wallet todavía no está configurado para enviar notificaciones.'};
 const config=configuration(process.env),client=googleClient(config);
 const rows=await systemQuery(`SELECT c.id,
 nival_pr_private.reward_policy_for_customer(c.id)->>'audience' audience
 FROM nival_pr.customers c JOIN nival_pr_private.wallet_sync w ON w.customer_id=c.id AND w.business_id=c.business_id
 WHERE c.business_id=$1 AND c.marketing_consent=true AND c.marketing_consent_at IS NOT NULL
 AND w.synced_revision>0 AND w.last_synced_at IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM nival_pr_private.wallet_campaign_deliveries d
 WHERE d.customer_id=c.id AND d.created_at>now()-interval '24 hours' AND d.status IN ('pending','sent'))
 ORDER BY c.created_at LIMIT 150`,[businessId]);
 const eligible=rows.filter(row=>audience==='all'||row.audience===audience);
 if(eligible.length===0)return {error:'No hay clientes con Wallet habilitado y consentimiento disponible para este grupo, o ya recibieron un mensaje hoy.'};
 if(eligible.length>10)return {error:'La campaña tiene '+eligible.length+' destinatarios. Por seguridad, el envío inicial admite hasta 10 clientes por operación.'};
 let sent=0,failed=0;
 for(const customer of eligible){
   const [claimed]=await systemQuery(`INSERT INTO nival_pr_private.wallet_campaign_deliveries(business_id,customer_id,owner_id,audience,title,body,status)
 SELECT $1,$2,$3,$4,$5,$6,'pending'
 WHERE NOT EXISTS(SELECT 1 FROM nival_pr_private.wallet_campaign_deliveries d WHERE d.customer_id=$2 AND d.created_at>now()-interval '24 hours' AND d.status IN ('pending','sent'))
 ON CONFLICT (customer_id,send_day) DO NOTHING
 RETURNING id`,[businessId,customer.id,actor.id,audience,title,body]);
   if(!claimed)continue;
   try {
    await client.notify(config.issuer+'.puntos_customer_'+customer.id,title,body);
    await systemQuery('UPDATE nival_pr_private.wallet_campaign_deliveries SET status=\'sent\',sent_at=now() WHERE id=$1',[claimed.id]);
    sent++;
   } catch {
    await systemQuery('UPDATE nival_pr_private.wallet_campaign_deliveries SET status=\'failed\' WHERE id=$1',[claimed.id]);
    failed++;
   }
 }
 revalidatePath('/panel');
 return sent>0?{success:sent+' solicitudes aceptadas por Google Wallet'+(failed?' · '+failed+' fallidas':'')+'. La entrega depende de Wallet y de las notificaciones del cliente.'}:{error:'Google Wallet no aceptó las solicitudes. Revisa la configuración y vuelve a intentar.'};
}
