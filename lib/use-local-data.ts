'use client';
import {useEffect,useState,useCallback} from 'react';

// Prototype storage only. Do not use for production authentication or shared data.
export function useLocalData<T>(key:string,initial:T,validate:(value:unknown)=>value is T) {
  const [data,setData]=useState<T>(initial);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    try { const raw=localStorage.getItem(key); if(raw!==null){const parsed:unknown=JSON.parse(raw);if(!validate(parsed))throw new Error('invalid');setData(parsed);} }
    catch {setError('No se pudieron leer los datos guardados. No se han sobrescrito.');}
    setReady(true);
  },[key,validate]);
  const save=useCallback((next:T)=>{
    try {localStorage.setItem(key,JSON.stringify(next));setData(next);setError('');return true;}
    catch {setError('No se pudo guardar. Revisa el espacio disponible o los permisos de tu navegador.');return false;}
  },[key]);
  return {data,ready,error,save};
}
