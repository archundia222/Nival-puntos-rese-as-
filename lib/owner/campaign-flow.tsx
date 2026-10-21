'use client';
import {useMemo,useState} from 'react';
import {ActionForm} from '../foundation/forms';
import {Hidden} from '../foundation/fields';
import {saveMessageTemplate,markCampaignSent,markCampaignContact} from './actions';
import {Icon} from './icons';
type Segment='new'|'risk'|'frequent'|'near_reward';
type Customer=Record<string,any>;
type History=Record<string,any>;
const goals:{key:Segment;label:string;goal:string;icon:string}[]=[
 {key:'risk',label:'Te extrañamos',goal:'Traer de vuelta',icon:'clock'},
 {key:'new',label:'Bienvenida',goal:'Dar la bienvenida',icon:'clientes'},
 {key:'frequent',label:'Gracias por volver',goal:'Agradecer visitas',icon:'check'},
 {key:'near_reward',label:'Cerca del premio',goal:'Recordar el premio',icon:'gift'}
];
export function CampaignFlow({businessId,customers,counts,messages,defaults,history,demo=false}:{businessId:string;customers:Customer[];counts:Record<Segment,number>;messages:History[];defaults:Record<string,string>;history:History[];demo?:boolean}){
 const [selected,setSelected]=useState<Segment>('risk'),[step,setStep]=useState(0),[copied,setCopied]=useState(false);
 const def=goals.find(x=>x.key===selected)!;
 const eligible=useMemo(()=>customers.filter(c=>selected==='new'?c.is_new:selected==='risk'?c.is_risk&&!c.is_lost:selected==='frequent'?c.is_frequent:Number(c.balance||0)>0),[customers,selected]);
 const initial=(k:Segment)=>messages.find(x=>x.segment===k)?.body||defaults[k]||'';
 const [texts,setTexts]=useState<Record<string,string>>(()=>Object.fromEntries(goals.map(g=>[g.key,initial(g.key)])));
 const msg=texts[selected]||'';
 const contacted=new Map<string,string>();for(const entry of history.filter(h=>h.segment===selected))for(const id of (entry.customer_ids||[])){const previous=contacted.get(String(id));if(!previous||previous<String(entry.sent_at))contacted.set(String(id),String(entry.sent_at));}
 const pending=eligible.filter(c=>!contacted.has(String(c.id))),done=eligible.filter(c=>contacted.has(String(c.id)));
 const daysSince=(c:Customer)=>c.last_visit?Math.max(0,Math.floor((Date.now()-new Date(c.last_visit).getTime())/86400000)):null;
 const reason=(c:Customer)=>selected==='risk'?('Inactivo '+(daysSince(c)??30)+' días'):selected==='new'?'Cliente nuevo':selected==='frequent'?'Cliente frecuente':'Premio pendiente';
 function choose(key:Segment){setSelected(key);setStep(1);setCopied(false);}
 async function copy(){try{await navigator.clipboard.writeText(msg);setCopied(true);}catch{setCopied(false);}}
 return <section className="campaignFlow">
  <div className="campaignGoalGrid" role="group" aria-label="Objetivo de tu campaña">{goals.map(g=><button type="button" className={"campaignGoalCard"+(selected===g.key&&step>0?' isSelected':'')} key={g.key} aria-pressed={selected===g.key&&step>0} onClick={()=>choose(g.key)}>
   <span className="campaignGoalIcon"><Icon name={g.icon} size={24}/></span><strong>{g.goal}</strong><small>{g.label}</small><span className="campaignAudienceCount">{counts[g.key]||0} clientes</span><span className="campaignGoalArrow">Configurar →</span>
  </button>)}</div>
  {step===0?<div className="campaignIntro"><strong>¿Qué quieres lograr hoy?</strong><p>Elige un objetivo para preparar el mensaje y ver los clientes a quienes aplica.</p></div>:<div className="ownerCard campaignComposer">
   <header className="campaignComposerHeader"><div><small>PASO {step} DE 3</small><h3>{def.label}</h3></div><button className="workspaceSecondary" type="button" onClick={()=>setStep(0)}>Cambiar objetivo</button></header>
   <div className="campaignStepBar" aria-hidden="true">{[1,2,3].map(i=><i key={i} className={i<=step?'done':''}/>)}</div>
   {step===1&&<><div className="campaignAudienceHero"><strong>{counts[selected]||0}</strong><span>clientes en este grupo</span></div><details open={eligible.length<=5} className="campaignAudienceList"><summary>Ver lista de clientes ({eligible.length})</summary>{eligible.length?<ul>{eligible.slice(0,30).map(c=><li key={c.id}><span>{c.name}</span><small>{c.visits||0} visitas</small></li>)}</ul>:<p className="ownerEmpty">No hay clientes en este grupo todavía.</p>}{eligible.length>30&&<small>Los demás clientes aparecen en Clientes.</small>}</details><div className="campaignFooter"><button type="button" className="workspacePrimary" onClick={()=>setStep(2)}>Continuar al mensaje →</button></div></>}
   {step===2&&<><div className="campaignMessageGrid"><div><h4>Escribe tu mensaje</h4>{demo?<textarea aria-label="Mensaje de ejemplo" value={msg} onChange={e=>setTexts(v=>({...v,[selected]:e.target.value}))}/>:<ActionForm action={saveMessageTemplate} label="Guardar mensaje" preserveOnError><Hidden name="businessId" value={businessId}/><Hidden name="segment" value={selected}/><textarea aria-label="Mensaje" name="body" required maxLength={1500} value={msg} onChange={e=>setTexts(v=>({...v,[selected]:e.target.value}))}/></ActionForm>}</div><div className="campaignPhonePreview"><span>VISTA PREVIA</span><p>{msg||'Tu mensaje aparecerá aquí.'}</p><small>Mensaje editable · envío manual</small></div></div><div className="campaignFooter"><button type="button" className="workspaceSecondary" onClick={()=>setStep(1)}>← Clientes</button><button type="button" className="workspaceSecondary" onClick={copy}>{copied?'Copiado ✓':'Copiar mensaje'}</button><button type="button" className="workspacePrimary" onClick={()=>setStep(3)}>Ver envío →</button></div></>}
   {step===3&&<><div className="campaignSendSummary"><Icon name="check" size={28}/><strong>Tu mensaje está listo</strong><p>Cópialo y envíalo por el canal que elijas. Nival no lo envía automáticamente.</p><button type="button" className="workspaceSecondary" onClick={copy}>{copied?'Mensaje copiado ✓':'Copiar mensaje'}</button></div>
    <div className="campaignFooter"><button type="button" className="workspaceSecondary" onClick={()=>setStep(2)}>← Editar</button>{demo?<span className="workspaceExampleTag">Ejemplo · no se guardan envíos</span>:<ActionForm action={markCampaignSent} label="Marcar como enviada"><Hidden name="businessId" value={businessId}/><Hidden name="segment" value={selected}/><Hidden name="channel" value="manual"/></ActionForm>}</div></>}
  </div>}
  {step>0&&<div className="campaignContactGroups"><section className="ownerCard campaignContactGroup"><h3>Pendientes · {pending.length}</h3>{pending.length?pending.map(c=><article className="campaignContactItem" key={c.id}><div><strong>{c.name}</strong><small>{daysSince(c)===null?'Sin visitas':daysSince(c)+' días sin venir'} · {reason(c)}</small></div>{!demo&&(()=>{const digits=String(c.phone||'').replace(/\\D/g,'');const number=digits.length===10?'52'+digits:digits;return c.marketing_consent===true&&/^52\\d{10}$/.test(number)?<ActionForm action={markCampaignContact} label="Enviar por WhatsApp" onSuccess={()=>window.location.assign('https://wa.me/'+number+'?text='+encodeURIComponent(msg))}><Hidden name="businessId" value={businessId}/><Hidden name="customerId" value={String(c.id)}/><Hidden name="segment" value={selected}/></ActionForm>:<small>Sin WhatsApp autorizado</small>})()}</article>):<p className="ownerEmpty">Sin pendientes</p>}</section><section className="ownerCard campaignContactGroup"><h3>Contactados · {done.length}</h3>{done.length?done.map(c=><article className="campaignContactItem" key={c.id}><div><strong>{c.name}</strong><small>{daysSince(c)===null?'Sin visitas':daysSince(c)+' días sin venir'} · {reason(c)}</small><small>Contactado: {new Date(contacted.get(String(c.id))!).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'})}</small></div></article>):<p className="ownerEmpty">Aún no hay contactos</p>}</section></div>}
  <article className="ownerCard campaignHistory"><h3>Resultados registrados</h3>{history.length?history.map(h=><div className="campaignHistoryRow" key={h.id}><span><strong>{goals.find(g=>g.key===h.segment)?.label||h.segment}</strong><small>{new Date(h.sent_at).toLocaleDateString('es-MX')} · {h.channel==='manual'?'Manual':'Wallet'}</small></span><strong>{h.audience_count?Math.round(100*Number(h.returned_count||0)/Number(h.audience_count)):0}%</strong><small>Volvieron {h.returned_count} de {h.audience_count} en 14 días</small></div>):<p className="ownerEmpty">Tus campañas enviadas aparecerán aquí con cuántos clientes volvieron.</p>}</article>
  {!demo&&<details className="campaignExtraTemplates"><summary>Otros mensajes guardados</summary>{(['active','lost'] as const).map(key=><div key={key} className="ownerCard"><h4>{key==='active'?'Clientes activos':'Clientes inactivos'}</h4><ActionForm action={saveMessageTemplate} label="Guardar mensaje"><Hidden name="businessId" value={businessId}/><Hidden name="segment" value={key}/><textarea name="body" aria-label={key==='active'?'Mensaje para activos':'Mensaje para inactivos'} required maxLength={1500} defaultValue={messages.find(m=>m.segment===key)?.body||defaults[key]||''}/></ActionForm></div>)}</details>}
 </section>;
}
