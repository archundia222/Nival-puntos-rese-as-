import type {Statement} from '../foundation/db';
import {periodRange} from './domain.mjs';
export function ownerStatements(businessId:string,range:ReturnType<typeof periodRange>):Statement[];
