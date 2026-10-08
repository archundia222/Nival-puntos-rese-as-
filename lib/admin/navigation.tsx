export function AdminNavigation({view}:{view:string}){
 return <aside className="adminSidebar" aria-label="Menú de administración"><a className="adminBrand" href="/admin?view=inicio"><span>N</span><b>Nival<small>ADMINISTRACIÓN</small></b></a><nav>{[['inicio','Inicio'],['negocios','Negocios'],['tareas','Tareas de hoy'],['reportes','Diagnósticos y reseñas'],['testimonios','Testimonios'],['actividad','Actividad']].map(([key,label])=><a key={key} href={key==='reportes'?'/admin/reportes':'/admin?view='+key} aria-current={view===key?'page':undefined}>{label}</a>)}</nav></aside>;
}
