export type BusinessPlan = 'puntos' | 'esencial' | 'plus';

export const PLAN_DETAILS: Record<BusinessPlan, {label:string; price:number}> = {
  puntos: {label:'Puntos', price:299},
  esencial: {label:'Esencial', price:399},
  plus: {label:'Plus', price:549},
};

export function businessPlan(value:unknown):BusinessPlan {
  return value==='esencial'||value==='plus'?value:'puntos';
}

export function businessMenu(plan:BusinessPlan) {
  return [
    {label:'Inicio',href:'/panel',section:'inicio'},
    {label:'Tarjetas',href:'/panel/tarjetas',section:'tarjetas'},
    {label:'Clientes',href:'/panel/clientes',section:'clientes'},
    ...(plan==='puntos'?[]:[{label:'Reseñas',href:'/panel/resenas',section:'resenas'}]),
    {label:'Promociones',href:'/panel/promociones',section:'promociones'},
    {label:'Informes',href:'/panel/informes',section:'informes'},
    {label:'Configuración',href:'/panel/configuracion',section:'configuracion'},
    {label:'Complementos',href:'/panel/complementos',section:'complementos'},
  ];
}
