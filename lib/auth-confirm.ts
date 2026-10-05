import type {SupabaseClient} from '@supabase/supabase-js';
type Auth=Pick<SupabaseClient['auth'],'verifyOtp'|'exchangeCodeForSession'>;
export async function confirmEmail(auth:Auth,params:URLSearchParams):Promise<string>{
 const token=params.get('token_hash');const type=params.get('type');const code=params.get('code');
 const recovery=type==='recovery'||(!token&&params.get('flow')==='recovery');
 const failure=recovery?'/acceso?recuperacion=error':'/acceso?confirmacion=error';
 try{
  if(token){
   if(token.length>2048||(type!=='signup'&&type!=='recovery'))return failure;
   const {error}=await auth.verifyOtp({token_hash:token,type});
   return error?failure:recovery?'/restablecer':'/panel';
  }
  if(code&&code.length<=2048){
   const {error}=await auth.exchangeCodeForSession(code);
   return error?failure:recovery?'/restablecer':'/panel';
  }
 }catch{/* Never expose email tokens or provider errors. */}
 return failure;
}
