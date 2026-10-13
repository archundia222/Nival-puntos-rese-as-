import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import '../lib/owner/workspace.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://nival-puntos-resenas.vercel.app'),
  title: 'Nival | Tarjeta de puntos y reseñas de Google para negocios locales',
  description: 'Tarjeta digital de puntos y apoyo para responder tus reseñas de Google. Sin apps, con QR y NFC. Planes desde $299 MXN al mes.',
  openGraph: {
    title: 'Nival | Tarjeta de puntos y reseñas de Google para negocios locales',
    description: 'Tarjeta digital de puntos y apoyo para responder tus reseñas de Google. Sin apps, con QR y NFC. Planes desde $299 MXN al mes.',
    url: 'https://nival-puntos-resenas.vercel.app',
    siteName: 'Nival',
    locale: 'es_MX',
    type: 'website',
    images: [{ url: '/assets/img/barista.webp', alt: 'Una barista usando una tablet en un negocio local' }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es-MX"><body>{children}</body></html>;
}
