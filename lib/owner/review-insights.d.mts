export type ReviewTheme={theme:string;count:number};
export type ReviewAnalysis={analyzed:number;positive:ReviewTheme[];negative:ReviewTheme[];improve:string;keep:string};
export function encodeReviewInsights(form:FormData,total:number):{value?:string;error?:string};
export function decodeReviewInsights(value:unknown):{notes:string;analysis:ReviewAnalysis|null};
