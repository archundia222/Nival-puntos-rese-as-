export const segmentKeys:string[];
export const checklistLabels:Record<string,string>;
export function mexicoToday(now?:Date):string;
export function periodRange(kind?:string,value?:string,now?:Date):{kind:string;key:string;start:string;end:string;previous:string;today:string};
export function generateAdvice(segment:string,businessContext:{templates:{segment:string;text:string}[];variant:number;count:number;businessName?:string}):string;
export function validateGoogle(input:{rating:number;total:number;fresh:number;answered:number;distribution:Record<string,number>}):string|null;
