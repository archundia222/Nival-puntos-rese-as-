import {notFound} from 'next/navigation';

const sections:Record<string,{title:string;description:string}>={
  tarjetas:{title:'Tarjetas',description:'Editor y métricas de la tarjeta de puntos.'},
  clientes:{title:'Clientes',description:'Clientes organizados por su actividad.'},
  resenas:{title:'Reseñas',description:'Actividad y recomendaciones de reseñas.'},
  promociones:{title:'Promociones',description:'Promociones para tus clientes.'},
  informes:{title:'Informes',description:'Resumen de periodos de 30 días.'},
  configuracion:{title:'Configuración',description:'Datos y reglas de tu negocio.'},
  complementos:{title:'Complementos',description:'Servicios incluidos en tu plan.'},
};

export default async function UpcomingSection({params}:{params:Promise<{section:string}>}){
  const {section}=await params;
  const item=sections[section];
  if(!item)notFound();
  return <main className="dashboard"><header className="dashHead"><div><small>NIVAL · TU NEGOCIO</small><h1>{item.title}</h1><p>{item.description}</p></div></header><section className="panelState"><span className="comingSoon">Próximamente</span><h2>Estamos preparando esta sección</h2><p>Esta opción estará disponible cuando terminemos su fase de construcción.</p></section></main>;
}
