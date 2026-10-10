'use client';
import LandingIcon from './landing-icon';
import {useEffect,useState} from 'react';
type Benefit={symbol:string;label:string;detail:string};
export default function LandingInteractions({mode,wa,items=[]}:{mode:'menu'|'arrows'|'benefits'|'billing';wa?:string;items?:Benefit[]}){
 const [open,setOpen]=useState(false);const [selected,setSelected]=useState(0);
 useEffect(()=>{
  if(mode!=='arrows')return;
  const section=document.getElementById('como');
  const steps=Array.from(document.querySelectorAll<HTMLElement>('#refSteps .refStep'));
  if(!section||!steps.length)return;
  let frame=0;
  const update=()=>{
   if(frame)return;
   frame=requestAnimationFrame(()=>{
    frame=0;
    if(window.matchMedia('(max-width:760px)').matches){
     section.style.removeProperty('--story-progress');
     delete section.dataset.activeStep;
     steps.forEach(step=>delete step.dataset.active);
     return;
    }
    const travel=Math.max(1,section.offsetHeight-window.innerHeight);
    const progress=Math.max(0,Math.min(0.9999,-section.getBoundingClientRect().top/travel));
    const active=Math.min(steps.length-1,Math.floor(progress*steps.length));
    section.style.setProperty('--story-progress',String(progress));
    section.dataset.activeStep=String(active);
    steps.forEach((step,index)=>{step.dataset.active=index===active?'true':'false';});
   });
  };
  update();
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);if(frame)cancelAnimationFrame(frame);};
 },[mode]);
 function move(direction:-1|1){
  if(window.matchMedia('(min-width:761px)').matches){
   window.scrollBy({top:direction*Math.max(360,window.innerHeight*.75),behavior:'smooth'});
   return;
  }
  document.getElementById('refSteps')?.scrollBy({left:direction*270,behavior:'smooth'});
 }
 if(mode==='menu')return <div className="refMobileMenu"><button type="button" aria-expanded={open} aria-label={open?'Cerrar menú':'Abrir menú'} onClick={()=>setOpen(!open)}><span aria-hidden="true">{open?'×':'☰'}</span><span>Menú</span></button>{open&&<nav className="refMobileLinks" aria-label="Menú móvil"><a href="#como" onClick={()=>setOpen(false)}>Cómo funciona</a><a href="#precios" onClick={()=>setOpen(false)}>Precios</a><a href="#preguntas" onClick={()=>setOpen(false)}>Preguntas</a><a href="/demo" onClick={()=>setOpen(false)}>Ver demo</a><a className="refMobileCreate" href="/acceso?modo=registro" onClick={()=>setOpen(false)}>Crear cuenta</a><span className="refMobileLabel">Accesos</span><a href="/acceso" onClick={()=>setOpen(false)}>Acceso a negocios</a><a href="/staff/acceso" onClick={()=>setOpen(false)}>Acceso de personal</a><a href="/acceso-administrador" onClick={()=>setOpen(false)}>Acceso de administradores</a></nav>}</div>;
 if(mode==='arrows')return <div className="refArrows"><button type="button" aria-label="Paso anterior" onClick={()=>move(-1)}><LandingIcon name="arrow-left"/></button><button type="button" aria-label="Paso siguiente" onClick={()=>move(1)}><LandingIcon name="arrow"/></button></div>;
 if(mode==='benefits')return <div className="refBenefitPicker"><div className="refBenefitGrid">{items.map((item,index)=><button type="button" key={item.label} className={selected===index?'isSelected':''} aria-pressed={selected===index} onClick={()=>setSelected(index)}><span><LandingIcon name={item.symbol}/></span><p>{item.label}</p><LandingIcon name="arrow"/></button>)}</div><div className="refBenefitWhy" aria-live="polite"><span><LandingIcon name={items[selected]?.symbol||'star'}/></span><div><small>¿POR QUÉ IMPORTA?</small><strong>{items[selected]?.label}</strong><p>{items[selected]?.detail}</p></div></div></div>;
 return null;
}
