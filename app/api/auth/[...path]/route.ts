import {getAuth} from '../../../../lib/backend/auth';
export const dynamic='force-dynamic';
export async function GET(request:Request,context:any){return getAuth().handler().GET(request,context);}
export async function POST(request:Request,context:any){return getAuth().handler().POST(request,context);}
