'use client';

import { useEffect, useState } from 'react';

const items = [
  { href: '#como', label: 'Cómo funciona' },
  { href: '#precio', label: 'Precios' },
  { href: '/demo', label: 'Ver demo' },
  { href: '#contacto', label: 'Contacto' },
];

export default function LandingMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <div className="nxMobileMenu">
      <button type="button" aria-expanded={open} aria-controls="nx-mobile-nav" onClick={() => setOpen(value => !value)}>
        <i/><i/><span>{open ? 'Cerrar' : 'Menú'}</span>
      </button>
      {open && <nav id="nx-mobile-nav" aria-label="Navegación móvil">
        {items.map(item => <a href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}
        <a className="nxMobileLogin" href="/acceso" onClick={() => setOpen(false)}>Ya tengo cuenta · Entrar</a>
        <a className="menuCta" href="/acceso?modo=registro" onClick={() => setOpen(false)}>Crear cuenta de negocio</a>
      </nav>}
    </div>
  );
}
