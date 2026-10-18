"use client";
import {useState,type ChangeEvent} from "react";
export function RewardImageInput({value=""}:{value?:string}){
 const [src,setSrc]=useState(value),[error,setError]=useState("");
 function pick(e:ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0]; if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setError("Usa JPG, PNG o WebP.");e.target.value="";return;}
  if(file.size>8*1024*1024){setError("La imagen debe pesar menos de 8 MB.");e.target.value="";return;}
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{const max=900,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext("2d");if(!ctx){setError("No se pudo preparar la imagen.");return;}ctx.drawImage(img,0,0,canvas.width,canvas.height);const data=canvas.toDataURL("image/jpeg",.72);URL.revokeObjectURL(url);if(data.length>850000){setError("La foto sigue siendo muy pesada. Prueba otra.");return;}setSrc(data);setError("");};img.onerror=()=>setError("No se pudo abrir la imagen.");img.src=url;
 }
 return <label className="rewardImageInput">Foto del producto<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={pick}/><input type="hidden" name="photoUrl" value={src}/><small>JPG, PNG o WebP · máximo 8 MB. Nival la comprime antes de guardar.</small>{src&&<img src={src} alt="Vista previa del producto"/>}{error&&<span className="error" role="alert">{error}</span>}</label>;
}