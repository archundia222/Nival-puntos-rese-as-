const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function filterCustomers(customers,search='',segment='all',sort='visits'){
 const flags={new:'is_new',frequent:'is_frequent',risk:'is_risk',lost:'is_lost',absent:'absent_month'};
 return customers.filter(c=>normalize(c.name).includes(normalize(search))&&(segment==='all'||c[flags[segment]]===true)).sort((a,b)=>sort==='name'?String(a.name).localeCompare(String(b.name),'es'):sort==='recent'?String(b.last_visit||'').localeCompare(String(a.last_visit||'')):Number(b.visits||0)-Number(a.visits||0)||String(a.name).localeCompare(String(b.name),'es'));
}
export function customerCsv(customers){
 const cell=value=>'"'+String(value??'').replace(/^[\s]*[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
 return '\uFEFF'+[['Cliente','Visitas','Última visita','Mensajes autorizados'],...customers.map(c=>[c.name,c.visits,c.last_visit?String(c.last_visit).slice(0,10):'Sin visitas',c.marketing_consent===true?'Sí':'No'])].map(row=>row.map(cell).join(',')).join('\r\n');
}
