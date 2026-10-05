import PasswordForm from './form';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function ResetPassword({searchParams}:{searchParams:Promise<{token?:string;error?:string}>}){
 const {token,error}=await searchParams;
 if(!token||token.length>2048||error)return <main className="dashboard"><h1>Solicita un nuevo enlace</h1><p>El enlace puede haber caducado o ya haberse utilizado. Vuelve al acceso y selecciona «Olvidé mi contraseña».</p><a href="/acceso">Volver al acceso</a></main>;
 return <main className="dashboard"><h1>Elige tu nueva contraseña</h1><PasswordForm token={token}/></main>;
}
