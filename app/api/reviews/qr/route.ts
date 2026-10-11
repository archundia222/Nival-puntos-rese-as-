import QRCode from 'qrcode';
import {systemQuery,foundationEnabled} from '../../../../lib/foundation/db';

export async function GET(req:Request){
 const url=new URL(req.url),code=url.searchParams.get('code')||'';
 if(!foundationEnabled()||!/^[a-f0-9]{18}$/.test(code))return new Response(null,{status:404});
 const [card]=await systemQuery('select c.code from nival_pr.review_cards c where c.code=$1 and c.active',[code]);
 if(!card)return new Response(null,{status:404});
 const origin=process.env.APP_URL&&process.env.VERCEL_ENV!=='preview'?new URL(process.env.APP_URL).origin:url.origin;
 const target=origin+'/r/'+code;
 const svg=await QRCode.toString(target,{type:'svg',errorCorrectionLevel:'H',margin:4,width:900});
 return new Response(svg,{headers:{'Content-Type':'image/svg+xml','Content-Disposition':(url.searchParams.has('download')?'attachment':'inline')+'; filename="nival-resenas-'+code+'.svg"','Cache-Control':'no-store'}});
}
