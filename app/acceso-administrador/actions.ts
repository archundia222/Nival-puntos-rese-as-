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
    if (!['login','setup','recover'].includes(mode)) return {ok:false,message:'Solicitud inválida.'};
    if (mode === 'login' && (password.length > 128 || password.length < 1)) return {ok:false,message:'Escribe tu contraseña privada.'};
    const origin = await limitAdminAccess(email);
    if (mode === 'setup') {
      const [existing]=await systemQuery('select id from neon_auth."user" where lower(email)=$1',[email]);
      if(!existing){
        const {error} = await getAuth().signUp.email({email,password:randomBytes(48).toString('base64url'),name:'Rodrigo',callbackURL:origin+'/acceso-administrador'});
        if (error) return {ok:false,message:'No se pudo configurar el acceso. Intenta de nuevo más tarde.'};
        await getAuth().signOut();
      }
      const verification = await getAuth().sendVerificationEmail({email,callbackURL:origin+'/acceso-administrador'});
      if(verification.error)return {ok:false,message:'No se pudo enviar la confirmación. Intenta de nuevo más tarde.'};
      const recovery=await getAuth().requestPasswordReset({email,redirectTo:origin+'/acceso-administrador/restablecer'});
      if(recovery.error)return {ok:false,message:'No se pudo enviar el enlace para definir tu contraseña.'};
      return {ok:true,message:'Revisa tu correo para terminar de configurar tu acceso.'};
    }
    if (mode === 'recover') {
      const recovery = await getAuth().requestPasswordReset({email,redirectTo:origin+'/acceso-administrador/restablecer'});
      if(recovery.error)return {ok:false,message:'No se pudo enviar el enlace de recuperación. Intenta de nuevo más tarde.'};
      return {ok:true,message:'Si tu cuenta está configurada, recibirás un enlace para recuperar tu acceso.'};
    }
    const {error} = await getAuth().signIn.email({email,password});
    if (error) return {ok:false,message:'Correo o contraseña incorrectos.'};
    if (!await authorizeOwnAdministrator()) {
      await getAuth().signOut();
      return {ok:false,message:'La cuenta inició sesión, pero no tiene autorización de fundador.'};
    }
    return {ok:true,enter:true,message:'Acceso verificado.'};
  } catch (error) {
    console.error('administratorAccess failed', error instanceof Error ? error.message : 'unknown');
    return {ok:false,message:'No se pudo completar el acceso. Intenta nuevamente en unos minutos.'};
  }
}
