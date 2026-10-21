'use client';
export function CardBackButton({onClick,label='Regresar'}:{onClick:()=>void;label?:string}){
 return <button type="button" className="workspaceSecondary cardReturnButton" onClick={onClick}><span aria-hidden="true">←</span> {label}</button>;
}
