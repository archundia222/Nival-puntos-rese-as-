import {S3Client,PutObjectCommand,GetObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {createHash} from 'node:crypto';
export const signedPhotoSeconds=60;
export function storageConfig(env=process.env){
 const {R2_ACCOUNT_ID:account,R2_ACCESS_KEY_ID:accessKeyId,R2_SECRET_ACCESS_KEY:secretAccessKey,R2_EVIDENCE_BUCKET:bucket}=env;
 if(!account||! /^[a-f0-9]{32}$/.test(account)||!accessKeyId||!secretAccessKey||!bucket||! /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))throw Error('Configura el almacenamiento privado de evidencias.');
 return {region:'auto',endpoint:`https://${account}.r2.cloudflarestorage.com`,credentials:{accessKeyId,secretAccessKey},bucket};
}
export function objectKey(path){if(!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(path))throw Error('Ruta de evidencia inválida.');return 'evidence/'+path;}
export function digest(bytes){return createHash('sha256').update(bytes).digest('hex');}
export function evidenceStorage(config=storageConfig(),client=new S3Client(config)){
 return {
 async put(path,bytes,mime){const key=objectKey(path);await client.send(new PutObjectCommand({Bucket:config.bucket,Key:key,Body:bytes,ContentType:mime,CacheControl:'private, no-store',Metadata:{sha256:digest(bytes)}}));return key;},
 async sign(key,mime){if(objectKey(key.replace(/^evidence\//,''))!==key)throw Error('Ruta inválida');return getSignedUrl(client,new GetObjectCommand({Bucket:config.bucket,Key:key,ResponseContentType:mime,ResponseCacheControl:'private, no-store',ResponseContentDisposition:'inline'}),{expiresIn:signedPhotoSeconds});},
 async read(key){const r=await client.send(new GetObjectCommand({Bucket:config.bucket,Key:key}));return Buffer.from(await r.Body.transformToByteArray());}
 };
}
// No delete on uncertain database outcomes: it may already be linked to a redemption.
export async function saveEvidence({path,bytes,mime,storage,register}){const key=await storage.put(path,bytes,mime);await register({key,size:bytes.length,hash:digest(bytes)});return path;}
export async function authorizedPhoto({id,actor,lookup,storage}){if(!actor||!['owner','superadmin'].includes(actor.role))throw Error('Forbidden');const row=await lookup(id,actor);if(!row)throw Error('Not found');return storage.sign(row.object_key,row.mime);}
export async function migrateEvidence({row,storage,commit}){const bytes=Buffer.from(row.photo,'base64');const hash=digest(bytes);const key=await storage.put(row.path,bytes,row.mime);const saved=await storage.read(key);if(saved.length!==bytes.length||digest(saved)!==hash)throw Error('La copia no coincide; se conserva la foto original.');await commit({key,size:bytes.length,hash});return row.path;}
