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
        <a className="nxMobileLogin" href="/acceso" onClick={() => setOpen(false)}>Dueño del negocio · Entrar</a>
        <a className="nxMobileLogin" href="/staff/acceso" onClick={() => setOpen(false)}>Personal · Entrar con PIN</a>
        <a className="nxMobileLogin" href="/acceso-administrador" onClick={() => setOpen(false)}>Administrador de Nival</a>
        <a className="menuCta" href="/acceso?modo=registro" onClick={() => setOpen(false)}>Crear cuenta de negocio</a>
      </nav>}
    </div>
  );
}
