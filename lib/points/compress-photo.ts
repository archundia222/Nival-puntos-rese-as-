export async function compressPhoto(file:File):Promise<File>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)throw Error('Elige JPEG, PNG o WebP de hasta 15 MB.');
 const image=await createImageBitmap(file);
 try{
 const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo preparar la foto.');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('No se pudo comprimir la foto.')),'image/jpeg',0.8));
 if(blob.size>3*1024*1024)throw Error('La foto comprimida supera 3 MB.');return new File([blob],'canje.jpg',{type:'image/jpeg'});
 }finally{image.close();}
}
