"use client";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { saveProgram } from "../foundation/actions";
import { cardColor,readableCardText } from "./card-color";

type Design = {
  theme:string; headline:string; footer:string; background:string;
  backgroundX:number; backgroundY:number; logoX:number; logoY:number;
  secondaryColor:string; textColor:string; pointIcon:string; pointActive:string; pointInactive:string;
  pointView:string; expiryMonths:string; askBirthday:boolean; terms:string; whatsapp:string;
  address:string; instagram:string; facebook:string; squareLogo:string;
};
type CampaignRules={strategy?:"manual"|"random";targets?:Record<string,string[]>};
type Program = { name?:string;color?:string;mode?:string;points_per_visit?:number;card_enabled?:boolean;rules?:{min_hours_between_visits?:number;max_visits_per_day?:number;double_points_weekday?:number|null;card_design?:Partial<Design>;campaign_rules?:CampaignRules};logo_url?:string|null };
type Reward={id?:string;name?:string;points_cost?:number};
type Promotion={id:string;name?:string;points_cost?:number};
type SetupState={steps:{done:boolean;label:string}[];complete:boolean;completed:number};
const defaults:Design={theme:"minimal",headline:"Cliente de ejemplo",footer:"Un lugar al que vale la pena volver.",background:"",backgroundX:50,backgroundY:50,logoX:50,logoY:50,secondaryColor:"#cfe87a",textColor:"#17352f",pointIcon:"coffee",pointActive:"#7fa9dc",pointInactive:"#e4e8eb",pointView:"grid",expiryMonths:"",askBirthday:false,terms:"",whatsapp:"",address:"",instagram:"",facebook:"",squareLogo:""};
const weekdays=[["1","Lunes"],["2","Martes"],["3","Miércoles"],["4","Jueves"],["5","Viernes"],["6","Sábado"],["0","Domingo"]];
const campaignAudiences=[["all","Todos"],["new","Nuevos"],["frequent","Frecuentes"],["at_risk","En riesgo"],["lost","Perdidos"],["absent","Sin ...[truncated]