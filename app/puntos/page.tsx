"use client";
import {useEffect,useState} from "react";
type Cliente={id:number;nombre:string;telefono:string;puntos:number};
type Config={meta:number;premio:string;resenas:string};
export default function Negocio(){
 const [clientes,setClientes]=useState<Cliente[]>([]);
 const [nombre,setNombre]=useState(""); const [telefono,setTelefono]=useState("");
 const [config,setConfig]=useState<Config>({meta:5,premio:"Premio por definir",resenas:""});
 const [cargado,setCargado]=useState(false);
 useEffect(()=>{try{const c=localStorage.getItem("nival-clientes");const f=localStorage.getItem("nival-config");if(c)setClientes(JSON.parse(c));if(f)setConfig(JSON.parse(f))}finally{setCargado(true)}},[]);
 useEffect(()=>{if(cargado)localStorage.setItem("nival-clientes",JSON.stringify(clientes))},[clientes,cargado]);
 useEffect(()=>{if(cargado)localStorage.setItem("nival-config",JSON.stringify(config))},[config,cargado]);
 function alta(e:React.FormEvent){e.preventDefault();if(!nombre.trim())return;setClientes([...clientes,{id:Date.now(),nombre:nombre.trim(),telefono,puntos:0}]);setNombre("");setTelefono("")}
 function sumar(id:number){setClientes(clientes.map(c=>c.id===id?{...c,puntos:c.puntos+1}:c))}
 function restar(id:number){setClientes(clientes.map(c=>c.id===id?{...c,puntos:Math.max(0,c.puntos-1)}:c))}
 return <main className="dashboard"><header className="dashHead"><div><small>NIVAL · PUNTOS</small><h1>Mi programa de puntos</h1><p>Clientes, puntos y recompensa</p></div><a href="/negocio">← Mi negocio</a></header>
 <section className="panel"><div><h2>Nuevo cliente</h2><p>Registra al cliente y comienza a llevar sus puntos.</p></div><form onSubmit={alta}><input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Nombre"/><input value={telefono} onChange={e=>setTelefono(e.target.value)} placeholder="Teléfono (opcional)"/><button>Registrar</button></form></section>
 <section className="businesses"><h2>Clientes</h2>{clientes.length===0&&<div className="empty">Todavía no hay clientes. Registra el primero arriba.</div>}{clientes.map(c=><article key={c.id}><div><h3>{c.nombre}</h3><p>{c.telefono||"Sin teléfono"} · {c.puntos>=config.meta?"Premio disponible":"Faltan "+(config.meta-c.puntos)+" puntos"}</p></div><div className="points"><button onClick={()=>restar(c.id)}>−</button><strong>{c.puntos} pts</strong><button onClick={()=>sumar(c.id)}>+</button></div></article>)}</section>
 <section className="reviewBox"><h2>Configuración de puntos</h2><div className="configGrid"><label>Meta de puntos<input type="number" min="1" value={config.meta} onChange={e=>setConfig({...config,meta:Math.max(1,Number(e.target.value))})}/></label><label>Premio<input value={config.premio} onChange={e=>setConfig({...config,premio:e.target.value})}/></label></div><p>Los datos y seguimiento de Google se administran por separado desde Nival.</p></section>
 </main>}