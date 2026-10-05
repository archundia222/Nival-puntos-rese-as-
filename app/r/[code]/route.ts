import {foundationEnabled,systemQuery} from '../../../lib/foundation/db';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!foundationEnabled()||!/^[A-Za-z0-9_-]{3,64}$/.test(code))return new Response('Link no encontrado',{status:404});
 const [row]=await systemQuery('select target_url from nival_pr.short_links where code=$1',[code]);
 if(!row?.target_url)return new Response('Link no encontrado',{status:404});
 return new Response(null,{status:302,headers:{Location:row.target_url,'Cache-Control':'no-store'}});
}
