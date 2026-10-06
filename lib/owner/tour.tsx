'use client';
export const tourSteps=[
 {key:'inicio',title:'Mira cómo va tu negocio',text:'Consulta visitas, clientes nuevos y premios. Compara los resultados con el periodo anterior.'},
 {key:'clientes',title:'Encuentra a tus próximos clientes frecuentes',text:'Abre el menú: cada grupo tiene su propia sección. Busca clientes, recorre las páginas y exporta la lista. Prueba buscar “Cliente 5”.'},
 {key:'google',title:'Revisa tu reputación en Google',text:'Revisa los elogios y quejas más frecuentes, qué mejorar y qué mantener. El análisis de reseñas lo carga Nival con cada reporte.'},
 {key:'equipo',title:'Conoce la actividad de tu equipo',text:'Revisa quién registra visitas y canjes. En tu cuenta puedes administrar los accesos de tus meseros.'},
 {key:'compartir',title:'Invita a tus clientes a volver',text:'Prueba copiar el enlace o descargar el QR. En tu negocio, este QR abre tu tarjeta de lealtad.'},
 {key:'ajustes',title:'Hazlo tuyo',text:'Desde tu cuenta configuras premios, colores, logo y equipo. La demo no modifica ningún negocio real.'},
] as const;
export function DemoTour({section,active,navigate,setActive}:{section:string;active:boolean;navigate:(key:string)=>void;setActive:(active:boolean)=>void}){
 const index=Math.max(0,tourSteps.findIndex(step=>step.key===(section.startsWith('clientes-')?'clientes':section))),step=tourSteps[index];
 if(!active)return <div className="demoTourRestart"><button onClick={()=>{setActive(true);navigate('inicio');}}>Iniciar recorrido guiado</button></div>;
 return <section className="demoTour" aria-label="Recorrido guiado del panel"><div className="demoTourProgress" aria-label={`Paso ${index+1} de ${tourSteps.length}`}>{tourSteps.map((s,i)=><button key={s.key} onClick={()=>navigate(s.key)} aria-label={`Paso ${i+1}: ${s.title}`} aria-current={i===index?'step':undefined}>{i+1}</button>)}</div><div className="demoTourText" aria-live="polite"><small>PASO {index+1} DE {tourSteps.length}</small><h2>{step.title}</h2><p>{step.text}</p></div><div className="demoTourActions"><button onClick={()=>setActive(false)}>Explorar libremente</button><div>{index>0&&<button onClick={()=>navigate(tourSteps[index-1].key)}>Anterior</button>}<button className="workspacePrimary" onClick={()=>index===tourSteps.length-1?setActive(false):navigate(tourSteps[index+1].key)}>{index===tourSteps.length-1?'Terminar recorrido':'Siguiente paso'}</button></div></div></section>;
}
