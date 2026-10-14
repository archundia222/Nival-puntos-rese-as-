import QRCode from 'qrcode';
import {systemQuery,foundationEnabled} from '../../../../lib/foundation/db';

export async function GET(req:Request){
 const url=new URL(req.url),business=url.searchParams.get('business')||'';
 if(!foundationEnabled()||!/^[0-9a-f-]{36}$/i.test(business))return new Response(null,{status:404});
 const [row]=await systemQuery('select pay_card_url from nival_pr.businesses where id=$1 and pay_card_url is not null',[business]);
 if(!row?.pay_card_url)return new Response(null,{status:404});
 const svg=await QRCode.toString(row.pay_card_url,{type:'svg',errorCorrectionLevel:'H',margin:4,width:900});
 return new Response(svg,{headers:{'Content-Type':'image/svg+xml','Content-Disposition':'inline; filename="nival-pay-card.svg"','Cache-Control':'no-store'}});
}
