import {NextResponse,type NextRequest} from 'next/server';
export async function GET(request:NextRequest){const response=NextResponse.redirect(new URL('/acceso?confirmacion=error',request.url));response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');return response;}
