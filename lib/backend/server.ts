import 'server-only';
import {getAuth} from './auth';
import {scopedClient} from './query';
export async function createClient(){
 const auth=getAuth();const {data,error}=await auth.getSession();const user=data?.user||null;
 if(error)throw Error('Session unavailable');
 const client=scopedClient(user?'npr_app':'npr_anon',user?.id||'');
 return {...client,auth:{getUser:async()=>({data:{user},error:user?null:{message:'Login required'}}),getClaims:async()=>({data:user?{claims:{sub:user.id}}:null,error:user?null:{message:'Login required'}}),signOut:async()=>auth.signOut()}};
}
export function createPublicClient(){return scopedClient('npr_anon','');}
export function createCardClient(token:string){return scopedClient('npr_card_reader',token);}
