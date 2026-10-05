import {NextResponse} from 'next/server';
import {requireRole} from '../../../../lib/foundation/session';
import {query,authScope} from '../../../../lib/foundation/db';
import {uuid} from '../../../../lib/points/security';
import {authorizedPhoto,evidenceStorage} from '../../../../lib/storage/evidence.mjs';
export async function GET(req:Request){
 const actor=await requireRole('owner','superadmin');const id=new URL(req.url).searchParams.get('id')||'';
 if(!uuid(id))return new NextResponse(null,{status:404});
 try{
 const url=await authorizedPhoto({id,actor,storage:evidenceStorage(),lookup:async(id:string)=>{
 const [row]=await query(authScope(actor.id),'select * from nival_pr_private.read_photo_object($1)',[id]);return row;
 }});
 return new NextResponse(null,{status:302,headers:{Location:url,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
 }catch{return new NextResponse(null,{status:404,headers:{'Cache-Control':'private, no-store'}});}
}
