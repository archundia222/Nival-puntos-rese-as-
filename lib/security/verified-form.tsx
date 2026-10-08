'use client';
import {useState} from 'react';
import {ActionForm} from '../foundation/forms';
import type {Result} from '../foundation/actions';
import {TurnstileWidget} from './turnstile-widget';
export function VerifiedActionForm({action,label,children,siteKey,needsVerification}:{action:(state:Result,form:FormData)=>Promise<Result>;label:string;children:React.ReactNode;siteKey:string;needsVerification:boolean}){
 const [token,setToken]=useState(''),[attempt,setAttempt]=useState(0);
 async function submit(state:Result,form:FormData){const result=await action(state,form);if(needsVerification){setToken('');setAttempt(v=>v+1);}return result;}
 return <ActionForm action={submit} label={label} preserveOnError submitDisabled={needsVerification&&!token}>{children}{needsVerification&&<div className="wide"><p>Completa la verificación para crear tu tarjeta.</p><TurnstileWidget key={attempt} siteKey={siteKey} onTokenChange={setToken}/></div>}</ActionForm>;
}
