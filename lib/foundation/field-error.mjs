export function fieldErrorMessage({label,type,validity,minLength,validationMessage}){
 if(validity.valueMissing)return type==='checkbox'?'Debes aceptar los Términos y el Aviso de Privacidad.':`Completa el campo «${label}».`;
 if(validity.typeMismatch)return type==='email'?'Escribe un correo válido, por ejemplo nombre@correo.com.':'Pega un enlace completo que empiece con https://.';
 if(validity.tooShort)return `«${label}» necesita al menos ${minLength} caracteres.`;
 if(validity.patternMismatch)return `Revisa el formato de «${label}».`;
 return `Revisa «${label}»: ${validationMessage}`;
}
