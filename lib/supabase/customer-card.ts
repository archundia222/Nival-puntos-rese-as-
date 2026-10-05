import 'server-only';
import {createCardClient} from '../backend/server';
import {readAll} from './read-all';
import {cardTokenValid,cardProgress} from '../customer-card';

export function customerCardsConfigured(){return !!(process.env.DATABASE_URL);}
// This privileged client never leaves this module. The bearer token grants
// read access to one card only, never to names, phones or customer lists.
export async function readCustomerCard(token:string){
 if(!cardTokenValid(token))return null;
 const client=createCardClient(token);
 const {data:customer,error}=await client.from('npr_customers').select('id,business_id').eq('card_token',token).eq('card_enabled',true).maybeSingle();
 if(error)throw Error('Card lookup failed');if(!customer)return null;
 const [{data:business,error:be},{data:movements,error:me}]=await Promise.all([
  client.from('npr_businesses').select('name,reward_goal,reward_name').eq('id',customer.business_id).single(),
  readAll((start,end)=>client.from('npr_movements').select('points').eq('customer_id',customer.id).eq('business_id',customer.business_id).order('happened_at').order('id').range(start,end))
 ]);
 if(be||me||!business||!movements)throw Error('Card data unavailable');
 return {businessName:business.name,rewardName:business.reward_name,...cardProgress(movements.reduce((sum,m)=>sum+m.points,0),business.reward_goal)};
}
