'use server';
import {getAuth} from '../../lib/backend/auth';
import {randomBytes} from 'node:crypto';
import {systemQuery} from '../../lib/foundation/db';
import {limitAdminAccess, authorizeOwnAdministrator} from '../../lib/security/admin-access';
export type AdminResult = {ok: boolean; message: string; enter?: boolean};
export async function administratorAccess(mode: 'login'|'setup'|'recover', form: FormData): Promise<AdminResult> {
  try {
    const email = String(form.get('email') || '').trim().toLowerCase();
    const password = String(form.get('password') || '');
    const origin = await limitAdminAccess(email);
    if (!['login','setup','recover'].includes(mode)) return {ok:false,message:'Solicitud inválida.'};
    if (mode === 'login' && (password.length > 128 || password.length < 1)) return {ok:false,message:'Escribe tu contraseña privada.'};
    if (mode === 'setup') {
      const [existing]=await systemQuery('select id from neon_auth."user" where lower(email)=$1',[email]);
      if(!existing){
        // An anonymous requester cannot choose or know the founder's password.
        const {error} = await getAuth().signUp.email({email,password:randomBytes(48).toString('base64url'),name:'Rodrigo',callbackURL:origin+'/acceso-administrador'});
        if (error) return {ok:false,message:'No se pudo configurar el acceso. Intenta de nuevo más tarde.'};
        // Revoke any auto-created signup session before the email is confirmed.
        await getAuth().signOut();
      }
      const verification = await getAuth().sendVerificationEmail({email,callbackURL:origin+'/acceso-administrador'});
      if(verification.error)return {ok:false,message:'Tu cuenta se creó, pero no se pudo enviar la confirmación. Vuelve a intentarlo desde este acceso privado.'};
      const recovery=await getAuth().requestPasswordReset({email,redirectTo:origin+'/acceso-administrador/restablecer'});
      if(recovery.error)return {ok:false,message:'Confirma tu correo y solicita recuperar tu acceso para definir tu contraseña.'};
      return {ok:true,message:'Revisa tu correo: confirma tu dirección y abre el enlace para definir tu contraseña privada. Después vuelve aquí para entrar.'};
    }
    if (mode === 'recover') {
      const recovery = await getAuth().requestPasswordReset({email,redirectTo:origin+'/acceso-administrador/restablecer'});
      if(recovery.error)return {ok:false,message:'No se pudo enviar el enlace de recuperación. Intenta de nuevo más tarde.'};
      return {ok:true,message:'Si tu cuenta está configurada, recibirás un enlace para recuperar tu acceso.'};
    }
    const {error} = await getAuth().signIn.email({email,password});
    if (error) return {ok:false,message:'No se pudo verificar el acceso. Revisa tu contraseña y la confirmación de tu correo.'};
    if (!await authorizeOwnAdministrator()) return {ok:false,message:'Confirma tu correo antes de entrar. Solo la cuenta autorizada puede administrar Nival.'};
    return {ok:true,enter:true,message:'Acceso verificado.'};
  } catch {
    return {ok:false,message:'No se pudo verificar el acceso. Comprueba tus datos; si hiciste varios intentos, espera 15 minutos.'};
  }
}
