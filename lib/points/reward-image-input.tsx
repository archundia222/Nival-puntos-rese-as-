"use client";
import {useState,type ChangeEvent} from "react";
export function RewardImageInput({value=""}:{value?:string}){
 const [src,setSrc]=useState(value),[error,setError]=useState("");
 async function pick(e:ChangeEvent<HTMLInputElement>){
  const file=e.currentTarget.files?.[0];if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setError("Formato permitido: JPG, PNG o WebP.");return;}
  if(file.size>8*1024*1024){setError("Selecciona una imagen menor de 8 MB.");return;}
  const url=URL.createObjectURL(file),img=new window.Image();
  img.onload=()=>{try{const scale=Math.min(1,600/Math.max(img.width,img.height));const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
   const ctx=canvas.getContext("2d");if(!ctx)throw Error("No se pudo abrir la foto.");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const data=canvas.toDataURL("image/jpeg",.64);if(data.length>300000)throw Error("La foto pesa demasiado después de comprimirla. Prueba otra.");
   setSrc(data);setError("");}catch(err){setError(err instanceof Error?err.message:"No se pudo preparar la imagen.");}finally{URL.revokeObjectURL(url);}};
  img.onerror=()=>{setError("No se pudo abrir la foto.");URL.revokeObjectURL(url)};img.src=url;
  e.currentTarget.value="";
 }
 return <label className="rewardImageInput">Foto del producto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick}/><input type="hidden" name="photoUrl" value={src}/><small>Elige una foto de tu galería · JPG, PNG o WebP · hasta 8 MB.</small>{src&&<img src={src} alt="Vista previa del premio" width="108" height="108"/>}{error&&<small role="alert" className="error">{error}</small>}</label>;
}