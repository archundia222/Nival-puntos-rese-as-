'use client';
import LandingIcon from './landing-icon';
import {useState} from 'react';
export default function LandingInteractions({mode,wa}:{mode:'menu'|'arrows'|'billing',wa?:string}){
 const [open,setOpen]=useState(false);const [annual,setAnnual]=useState(false);
 if(mode==='menu')return <div className="refMobileMenu"><button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}>Menú</button>{open&&<nav className="refMobileLinks"><a href="#como" onClick={()=>setOpen(false)}>Cómo funciona</a><a href="#precios" onClick={()=>setOpen(false)}>Precios</a><a href="/demo">Ver demo</a><a href={wa}>Pedir informes</a><a href="/acceso?modo=registro">Registrarse</a></nav>}</div>;
 if(mode==='arrows')return <div className="refArrows"><button aria-label="Anterior" onClick={()=>document.getElementById('refSteps')?.scrollBy({left:-270,behavior:'smooth'})}><LandingIcon name="arrow-left"/></button><button aria-label="Siguiente" onClick={()=>document.getElementById('refSteps')?.scrollBy({left:270,behavior:'smooth'})}><LandingIcon name="arrow"/></button></div>;
 return <div className="refBilling" aria-label="Periodo de pago"><button className={!annual?'active':''} onClick={()=>setAnnual(false)} aria-pressed={!annual}>Mensual</button><button className={annual?'active':''} onClick={()=>setAnnual(true)} aria-pressed={annual}>Anual</button>{annual&&<span className="refAnnualNotice">Consulta las condiciones anuales por WhatsApp.</span>}</div>;
}