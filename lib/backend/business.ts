import type {Row} from './query';

type DbClient={from:(table:string)=>any};
export async function accessibleBusiness(client:DbClient,userId:string){
 const owned=await client.from('npr_businesses').select('id,name,reward_goal,reward_name,risk_days').eq('owner_id',userId).maybeSingle();
 if(owned.error)throw Error('business lookup failed');
 if(owned.data)return {business:owned.data as Row,staff:false};
 const member=await client.from('npr_business_members').select('business_id').eq('user_id',userId).eq('active',true).single();
 if(member.error||!member.data)return null;
 const business=await client.from('npr_businesses').select('id,name,reward_goal,reward_name,risk_days').eq('id',member.data.business_id).single();
 if(business.error||!business.data)return null;
 return {business:business.data as Row,staff:true};
}
