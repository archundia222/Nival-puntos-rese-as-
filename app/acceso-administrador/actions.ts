'use server';
import {getAuth} from '../../lib/backend/auth';
import {headers} from 'next/headers';
import {randomBytes} from 'node:crypto';
import {systemQuery} from '../../lib/foundation/db';
import {limitAdminAccess, limitAdminEmailRequest, claimAdminLoginAttempt} from '../../lib/security/admin-access';
export type AdminResult = {ok: boolean; message: string; enter?: boolean};
export async function administratorAccess(mode: 'login'|'setup'|'recover', form: FormData): Promise<AdminResult> {
  try {
    const email = String(form.get('email') || '').trim().toLowerCase();
    const password = String(form.get('password') || '');
    if (!['login','setup','recover'].includes(mode)) return {ok:false,message:'Solicitud inválida.'};
    if (mode === 'login' && (password.length > 128 || password.length < 1)) return {ok:false,message:'Escribe tu contraseña privada.'};
    const origin = await limitAdminAccess(email);
    if (mode === 'setup') {
      await limitAdminEmailRequest('setup');
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
      await limitAdminEmailRequest('recover');
      const recovery = await getAuth().requestPasswordReset({email,redirectTo:origin+'/acceso-administrador/restablecer'});
      if(recovery.error)return {ok:false,message:'No se pudo enviar el enlace de recuperación. Intenta de nuevo más tarde.'};
      return {ok:true,message:'Si tu cuenta está configurada, recibirás un enlace para recuperar tu acceso.'};
    }
    // Enforce a per-client limit before contacting the identity provider.
    await claimAdminLoginAttempt();
    const {error} = await getAuth().signIn.email({email,password});
    if (error) {
      const invalidOrigin = error.message === 'Invalid origin';
      const requestOrigin = invalidOrigin ? (await headers()).get('origin') || '' : '';
      console.error('founder login rejected', {message:error.message,status:'status' in error?error.status:undefined,code:'code' in error?error.code:undefined,...(invalidOrigin?{requestOrigin,officialOrigin:origin}:{})});
      if (invalidOrigin) {
        let normalizedOrigin = '';
        try { normalizedOrigin = new URL(requestOrigin).origin; } catch {}
        if (normalizedOrigin && normalizedOrigin !== origin) {
          return {ok:false,message:'Este acceso se abrió desde otro dominio. Entra desde la URL oficial: '+origin};
        }
        return {ok:false,message:'Neon rechazó el origen oficial. Verifica que esté habilitado en la misma rama de Neon que usa producción.'};
      }
      return {ok:false,message:'Correo o contraseña incorrectos.'};
    }
    return {ok:true,enter:true,message:'Credenciales verificadas. Completando sesión privada…'};
  } catch (error) {
    if(error instanceof Error && error.message.includes('15 minutos'))return {ok:false,message:'Demasiados intentos. Espera 15 minutos antes de volver a intentar.'};
    console.error('administratorAccess failed', error instanceof Error ? error.message : 'unknown');
    return {ok:false,message:'No se pudo completar el acceso. Intenta nuevamente en unos minutos.'};
  }
}
