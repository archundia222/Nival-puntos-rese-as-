'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="dashboard"><h1>No pudimos cargar esta página</h1><p>Inténtalo nuevamente. Si el problema continúa, contacta a Nival para revisar la configuración de tu cuenta.</p><div className="actions"><button onClick={reset}>Reintentar</button><a href="/acceso">Volver al acceso</a></div></main>}
