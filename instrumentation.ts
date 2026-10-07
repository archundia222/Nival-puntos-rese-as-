import {captureServerError} from "./lib/monitoring/sentry.mjs";
export async function register(){}
export async function onRequestError(error:unknown,request:{path?:string},context:{routePath?:string}){
 await captureServerError(error,{route:context?.routePath,url:request?.path});
}
