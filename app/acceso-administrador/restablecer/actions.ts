'use server';
import {getAuth} from '../../../lib/backend/auth';
import {assertSameOrigin} from '../../../lib/points/security';
export async function resetAdministratorPassword(form:FormData){
  try{
    await assertSameOrigin();
    const password=String(form.get('password')||'');const token=String(form.get('token')||'');
    if(password.length<12||password.length>128||!token||token.length>2048)return false;
    const {error}=await getAuth().resetPassword({newPassword:password,token});
    return !error;
  }catch{return false;}
}
