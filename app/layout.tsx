import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import "./globals.css";
import "../lib/owner/workspace.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://nival-puntos-resenas.vercel.app'),
  title: 'Nival Puntos + Reseñas | Nival Tech',
  description: 'Puntos digitales y acompañamiento de reseñas para negocios locales en México.',
  openGraph: {
    title: 'Nival Puntos + Reseñas',
    description: 'Que te encuentren. Que vuelvan.',
    url: 'https://nival-puntos-resenas.vercel.app',
    siteName: 'Nival Tech',
    locale: 'es_MX',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es-MX"><body>{children}</body></html>;
}
