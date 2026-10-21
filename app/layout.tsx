import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import './design-tokens.css';
import '../lib/owner/workspace.css';
import '../lib/owner/workspace-overrides.css';
import '../lib/owner/visual-polish.css';
import '../lib/owner/home-reference-redesign.css';
import '../lib/owner/sidebar-reference-redesign.css';
import '../lib/owner/cards-reference-redesign.css';
import '../lib/owner/clients-reference-redesign.css';
import '../lib/owner/card-share-reference-redesign.css';
import '../lib/owner/reviews-reference-redesign.css';
import '../lib/owner/reports-reference-redesign.css';
import '../lib/owner/final-reference-redesign.css';
import '../lib/owner/campaigns-reference-redesign.css';
import '../lib/owner/reference-fidelity-fixes.css';
import '../lib/owner/reviews-structure-fix.css';
import '../lib/owner/campaigns-flow-layout-fix.css';

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
  return <html lang="es-MX"><head><link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="anonymous" /></head><body>{children}</body></html>;
}
