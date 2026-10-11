export function AdminNavigation({view}:{view:string}){
 return <aside className="adminSidebar" aria-label="Menú de administración"><a className="adminBrand" href="/admin?view=tareas"><span>N</span><b>Nival<small>ADMINISTRACIÓN</small></b></a><nav>{[['tareas','Pendientes del día'],['negocios','Negocios'],['comparacion','Comparación con la zona']].map(([key,label])=><a key={key} href={'/admin?view='+key} aria-current={view===key?'page':undefined}>{label}</a>)}</nav></aside>;
}
