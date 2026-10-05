import {notFound,redirect} from 'next/navigation';
import {systemQuery} from '../../../lib/foundation/db';
export const dynamic='force-dynamic';
export default async function ShortLink({params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[A-Za-z0-9_-]{3,64}$/.test(code))notFound();
 const [row]=await systemQuery('select target_url from nival_pr.short_links where code=$1',[code]);
 if(!row?.target_url)notFound();
 redirect(row.target_url);
}