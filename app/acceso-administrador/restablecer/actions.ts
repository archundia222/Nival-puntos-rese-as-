'use server';
import {getAuth} from '../../../lib/backend/auth';

export async function resetAdministratorPassword(form:FormData){
  try{
    const password=String(form.get('password')||'');
    const token=String(form.get('token')||'');
    if(password.length<12||password.length>128||!token||token.length>2048)return false;
    const {error}=await getAuth().resetPassword({newPassword:password,token});
    if(error){
      console.error('founder password reset rejected', error.message);
      return false;
    }
    console.log('founder password reset completed');
    return true;
  }catch(error){
    console.error('founder password reset failed',error instanceof Error?error.message:'unknown');
    return false;
  }
}
