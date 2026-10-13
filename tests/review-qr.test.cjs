const assert=require('node:assert/strict');
const {test}=require('node:test');
const QRCode=require('qrcode');

test('review QR is a local PNG for the Nival review page URL',async()=>{
 const url='https://nival.example/opinar/123e4567-e89b-12d3-a456-426614174000';
 const data=await QRCode.toDataURL(url,{width:224,margin:2,errorCorrectionLevel:'M'});
 assert.match(data,/^data:image\/png;base64,/);
 const image=Buffer.from(data.split(',')[1],'base64');
 assert.deepEqual([...image.subarray(0,8)],[137,80,78,71,13,10,26,10]);
});
