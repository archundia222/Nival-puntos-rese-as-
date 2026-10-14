import {foundationEnabled,systemQuery} from '../../../lib/foundation/db';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!foundationEnabled()||!/^[A-Za-z0-9_-]{3,64}$/.test(code))return new Response('Link no encontrado',{status:404});
 const [row]=await systemQuery('select l.target_url from nival_pr.short_links l left join nival_pr.review_cards c on c.code=l.code where l.code=$1 and (c.code is null or c.active)',[code]);
 if(!row?.target_url)return new Response('Link no encontrado',{status:404});
 return new Response(null,{status:302,headers:{Location:row.target_url,'Cache-Control':'no-store'}});
}
