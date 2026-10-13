'use client';
export default function BusinessPanelError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="dashboard"><section className="panelState panelError"><p className="eyebrow">NIVAL · TU NEGOCIO</p><h1>No se pudo cargar esta sección</h1><p>Comprueba tu conexión e inténtalo de nuevo.</p><button onClick={()=>reset()}>Intentar de nuevo</button></section></main>}
