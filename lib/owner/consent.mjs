export async function customerPermissions(query,businessId){
 try{
  return await query('select id,marketing_consent from nival_pr.customers where business_id=$1',[businessId]);
 }catch(error){
  if(error?.code!=='42703'||!String(error.message).includes('marketing_consent'))throw error;
  // Older schemas must never imply permission to contact a customer.
  return await query('select id,false as marketing_consent from nival_pr.customers where business_id=$1',[businessId]);
 }
}
