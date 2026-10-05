import 'server-only';
import {neon} from '@neondatabase/serverless';
export type Role='superadmin'|'owner'|'staff';
export type Actor={id:string;role:Role;name:string;businessId?:string};
export type Statement={text:string;values?:unknown[]};
const roles={superadmin:'npr_v2_admin',owner:'npr_v2_owner',staff:'npr_v2_staff',auth:'npr_v2_auth',customer:'npr_v2_customer'} as const;
export function foundationEnabled(){return process.env.FOUNDATION_ENABLED==='true';}
export async function transaction(scope:Actor|{role:'auth';id:string}|{role:'customer';tokenHash:string},statements:Statement[]){
 if(!foundationEnabled())throw Error('Cimiento pendiente de activación.');
 const url=process.env.DATABASE_URL;if(!url)throw Error('Base no configurada.');
 const sql=neon(url);const role=roles[scope.role];
 const uid=scope.role==='customer'?'':scope.id;const token=scope.role==='customer'?scope.tokenHash:'';
 const results=await sql.transaction([sql.query(`set local role ${role}`),sql.query("select set_config('npr.user_id',$1,true),set_config('npr.device_token_hash',$2,true)",[uid,token]),...statements.map(s=>sql.query(s.text,s.values||[]))]);
 return results.slice(2) as Record<string,any>[][];
}
export async function query(scope:Parameters<typeof transaction>[0],text:string,values:unknown[]=[]){return (await transaction(scope,[{text,values}]))[0];}
export const authScope=(id='')=>({role:'auth' as const,id});
