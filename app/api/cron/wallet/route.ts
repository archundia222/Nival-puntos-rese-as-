import { runWalletJobs } from '../../../../lib/wallet/server';
export const maxDuration=60;
export async function GET(req:Request) {
 if(!process.env.CRON_SECRET || req.headers.get('authorization')!=='Bearer '+process.env.CRON_SECRET)return Response.json({error:'Unauthorized'},{status:401});
 try{return Response.json(await runWalletJobs(10));}catch{return Response.json({error:'Wallet worker unavailable'},{status:503});}
}
