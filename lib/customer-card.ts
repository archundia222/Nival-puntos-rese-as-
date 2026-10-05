export const cardTokenValid=(token:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
export function cardProgress(balance:number,goal:number){
 if(!Number.isSafeInteger(balance)||balance<0||!Number.isSafeInteger(goal)||goal<1)throw Error('Invalid card balance');
 return {balance,goal,remaining:Math.max(goal-balance,0),ready:balance>=goal,percent:Math.min(balance/goal*100,100)};
}
