export const draftNotice:string;
export const legalDefaults:Record<string,string>;
export const marketingConsent:string;
export function publishedLegal(key:string,row?:{value_published?:{text?:unknown}}|null):string;
export function validateLegalDraft(key:string,text:string):boolean;
