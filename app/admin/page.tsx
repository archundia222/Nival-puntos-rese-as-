"use client";
import {useEffect,useMemo,useState} from "react";
type Negocio={id:number;nombre:string;premio:string;meta:number;resenas:string;clientes:number};
const demo:Negocio={id:1,nombre:"Negocio demo",premio:"Café gratis",meta:5,resenas:"",clientes:0};
export default function Admin(){
 const [negocios,setNegocios]=useState<Negocio[]>([]);const [nombre,setNombre]=useState("");const [cargado,setCargado]=useState(false);
 useEffect(()=>{try{const raw=localStorage.getItem("nival-negocios");setNegocios(raw?JSON.parse(raw):[demo])}finally{setCargado(true)}},[]);
 useEffect(()=>{if(cargado)localStorage.setItem("nival-negocios",JSON.stringify(negocios))},[negocios,cargado]);
 const total=useMemo(()=>negocios.reduce((a,n)=>a+n.clientes,0),[negocios]);
 function agregar(e:React.FormEvent){e.preventDefault();if(!nombre.trim())return;setNegocios([...negocios,{id:Date.now(),nombre:nombre.trim(),premio:"Premio por definir",meta:5,resenas:"",clientes:0}]);setNombre("")}
 function eliminar(id:number){if(confirm("¿Eliminar este negocio del panel?"))setNegocios(negocios.filter(n=>n.id!==id))}
 return <main className="dashboard"><header className="dashHead"><div><small>NIVAL</small><h1>Panel operativo</h1><p>MVP manual · Puntos + Reseñas</p></div><a href="/">Ver landing</a></header>
 <section className="stats"><article><span>Negocios</span><b>{negocios.length}</b></article><article><span>Clientes registrados</span><b>{total}</b></article><article><span>Operación</span><b className="ok">Manual</b></article></section>
 <section className="panel"><div><h2>Registrar negocio</h2><p>Da de alta un negocio sin API ni integraciones externas.</p></div><form onSubmit={agregar}><input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Nombre del negocio"/><button>Agregar negocio</button></form></section>
 <section className="businesses"><h2>Negocios</h2>{negocios.length===0&&<div className="empty">No hay negocios registrados.</div>}{negocios.map(n=><article key={n.id}><div><span className="status">Activo</span><h3>{n.nombre}</h3><p>Meta inicial: {n.meta} puntos · {n.premio}</p></div><div className="actions"><a href={"/admin/negocio?id="+n.id+"&nombre="+encodeURIComponent(n.nombre)}>Administrar</a><button className="danger" onClick={()=>eliminar(n.id)}>Eliminar</button></div></article>)}</section>
 <p className="notice">Los negocios quedan guardados en este navegador para la etapa de validación manual. La base de datos multi-dispositivo se conectará cuando se defina la infraestructura de producción.</p></main>}