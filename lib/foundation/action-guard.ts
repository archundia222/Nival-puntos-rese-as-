import 'server-only';
import type {Actor,Role} from './db';
import {foundationEnabled} from './db';
import {requireBusiness,requireRole} from './session';
import {assertSameOrigin} from '../points/security';
import {backendConfigured} from '../backend/config';
import {createClient} from '../backend/server';

export async function guardPublicAction(){await assertSameOrigin();}

export async function guardAction(allowed:Role[],form?:FormData):Promise<Actor>{
 await assertSameOrigin();
 const actor=await requireRole(...allowed);
 const businessId=form?String(form.get('businessId')||'').trim():'';
 if(businessId)await requireBusiness(actor,businessId);
 return actor;
}

export async function guardLegacyOwnerAction(){
 await assertSameOrigin();
 if(foundationEnabled()||!backendConfigured())throw Error('legacy-disabled');
 const client=await createClient();const{data,error}=await client.auth.getUser();
 if(error||!data.user)throw Error('auth');
 return {client,user:data.user};
}

export async function guardLegacyOperatorAction(){
 await assertSameOrigin();
 if(foundationEnabled()||!backendConfigured())throw Error('legacy-disabled');
 const client=await createClient();const{data,error}=await client.auth.getUser();
 if(error||!data.user)throw Error('auth');
 const{data:role,error:roleError}=await client.from('npr_operators').select('user_id').eq('user_id',data.user.id).maybeSingle();
 if(roleError||!role)throw Error('role');
 return client;
}
