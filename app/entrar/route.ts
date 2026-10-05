import {NextResponse} from 'next/server';
import {foundationEnabled} from '../../lib/foundation/db';
import {emailActor,routeCookie,staffCookie,cookieOptions,secret} from '../../lib/foundation/session';
import {signedHint,roleHome} from '../../lib/foundation/security.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!foundationEnabled())return NextResponse.redirect(new URL('/panel',request.url));const actor=await emailActor();if(!actor)return NextResponse.redirect(new URL('/acceso',request.url));const response=NextResponse.redirect(new URL(roleHome(actor.role),request.url));response.cookies.delete(staffCookie);response.cookies.set(routeCookie,signedHint(actor.role,secret()),cookieOptions);response.headers.set('Cache-Control','private, no-store');return response;}
