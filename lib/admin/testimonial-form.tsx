'use client';
import {useState} from 'react';
import {ActionForm} from '../foundation/forms';
import {saveTestimonial} from './testimonials';
export function TestimonialForm(){
 const [step,setStep]=useState(1);
 return <ActionForm action={saveTestimonial} label="Guardar caso autorizado" showSubmit={step===3} preserveOnError><nav className="programTabs" aria-label="Pasos del testimonio">{['Local','Experiencia','Autorización'].map((label,i)=><button type="button" key={label} aria-current={step===i+1?'step':undefined} onClick={()=>setStep(i+1)}>{i+1}. {label}</button>)}</nav><div hidden={step!==1}><label>Nombre del negocio<input name="businessName" required={step===1} maxLength={100}/></label><label>Fotografía del local<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required={step===1}/></label><p>Una imagen clara del mostrador o fachada del local.</p><button type="button" onClick={()=>setStep(2)}>Continuar a la experiencia</button></div><div hidden={step!==2}><label>Frase del negocio<textarea name="quote" required={step===2} maxLength={600}/></label><label>Nombre y cargo de quien comparte la experiencia<input name="author" required={step===2} maxLength={120}/></label><button type="button" onClick={()=>setStep(3)}>Revisar autorización</button></div><div hidden={step!==3}><label className="consentLabel"><input name="permission" type="checkbox" required={step===3}/>Confirmo la autorización para publicar la foto, nombre y testimonio.</label><p>Se guarda como caso de éxito para revisión antes de incorporarlo a la página pública.</p></div></ActionForm>;
}
