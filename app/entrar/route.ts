import {NextResponse} from 'next/server';
import {foundationEnabled,query,authScope} from '../../lib/foundation/db';
import {emailActor,routeCookie,staffCookie,cookieOptions,secret} from '../../lib/foundation/session';
import {getAuth} from '../../lib/backend/auth';
import {administratorEmail} from '../../lib/security/admin-policy.mjs';
import {signedHint,roleHome} from '../../lib/foundation/security.mjs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  if(!foundationEnabled())return NextResponse.redirect(new URL('/panel',request.url));
  let actor=await emailActor();
  if(!actor){
    const {data,error}=await getAuth().getSession();
    const user=data?.user;
    if(!error&&user?.id&&typeof user.email==='string'&&user.email.trim().toLowerCase()!==administratorEmail){
      await query(authScope(user.id),'select nival_pr_private.ensure_owner($1)',[user.name]);
      actor=await emailActor();
    }
  }
  if(!actor)return NextResponse.redirect(new URL('/acceso',request.url));
  const response=NextResponse.redirect(new URL(roleHome(actor.role),request.url));
  response.cookies.delete(staffCookie);
  response.cookies.set(routeCookie,signedHint(actor.role,secret()),cookieOptions);
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
