import 'server-only';
import {query,authScope,type Actor} from './db';
import {requireBusiness} from './session';
import {entitlements} from './entitlements.mjs';
export async function requireTool(actor:Actor,businessId:string,tool:'points'|'reviews'|'replies'='points') {
 await requireBusiness(actor,businessId);
 const [row]=await query(authScope(actor.id),'select nival_pr_private.tool_context($1) data',[businessId]);
 const b=row?.data;
 if(!b)throw Error('Negocio no autorizado.');
 const access=entitlements(b);
 if(!access[tool])throw Error(access.reason);
 return access;
}
