'use client';

import { useEffect, useState } from 'react';
import LandingIcon from './landing-icon';

const whatsapp = 'https://wa.me/525539044988?text=' + encodeURIComponent('Hola, quiero cotizar Nival Puntos + Reseñas para mi negocio.');

export default function LandingMobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return <div className="nvMobileMenu">
    <button type="button" aria-expanded={open} aria-controls="nv-mobile-nav" aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} onClick={() => setOpen(value => !value)}>
      <span className="nvHamburger" aria-hidden="true"><i /><i /></span><span>{open ? 'Cerrar' : 'Menú'}</span>
    </button>
    {open && <nav className="nvMobilePanel" id="nv-mobile-nav" aria-label="Navegación móvil">
      <a href="#puntos" onClick={() => setOpen(false)}>Producto</a>
      <a href="#como-funciona" onClick={() => setOpen(false)}>Cómo funciona</a>
      <a href="#industrias" onClick={() => setOpen(false)}>Negocios</a>
      <a href="#planes" onClick={() => setOpen(false)}>Planes</a>
      <a href="#preguntas" onClick={() => setOpen(false)}>Preguntas</a>
      <a className="nvMobileLogin" href="/acceso" onClick={() => setOpen(false)}>Iniciar sesión</a>
      <a className="nvMobileQuote" href={whatsapp} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>Cotizar por WhatsApp <LandingIcon name="arrow" /></a>
    </nav>}
  </div>;
}
