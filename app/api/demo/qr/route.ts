import QRCode from 'qrcode';
export async function GET(req:Request){
 const url=new URL(req.url);
 const svg=await QRCode.toString(url.origin+'/demo',{type:'svg',errorCorrectionLevel:'H',margin:4,width:900});
 return new Response(svg,{headers:{'Content-Type':'image/svg+xml','Content-Disposition':(url.searchParams.has('download')?'attachment':'inline')+'; filename="qr-demo-nival.svg"','Cache-Control':'no-store'}});
}
