'use client';

import { useEffect, useState } from 'react';
import LandingIcon from './landing-icon';

const products = [
  ['#puntos', 'Tarjeta de puntos', 'Una tarjeta digital con tu marca y tu premio.'],
  ['#como-funciona', 'Registro con QR', 'Tus clientes se unen desde su celular.'],
  ['#mostrador', 'Tarjetas NFC + QR', 'Invita a tus clientes desde el mostrador.'],
  ['#panel', 'Panel del dueño', 'Consulta visitas, premios y actividad.'],
  ['#resenas', 'Reseñas de Google', 'Invita a opinar y recibe apoyo para responder.'],
];

const industries = [
  ['#cafeterias', 'Cafeterías'], ['#restaurantes', 'Restaurantes'], ['#taquerias', 'Taquerías'],
  ['#barberias', 'Barberías'], ['#esteticas', 'Estéticas'], ['#consultorios', 'Consultorios y salud'],
  ['#heladerias', 'Heladerías'], ['#industrias', 'Gimnasios y estudios'],
];

const whatsapp = 'https://wa.me/525539044988?text=' + encodeURIComponent('Hola, quiero cotizar Nival Puntos + Reseñas para mi negocio.');

export default function LandingMobileNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return <div className="nvMobileMenu">
    <button type="button" aria-expanded={open} aria-controls="nv-mobile-nav" aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} onClick={() => setOpen(value => !value)}>
      <span className="nvHamburger" aria-hidden="true"><i /><i /></span><span>{open ? 'Cerrar' : 'Menú'}</span>
    </button>
    {open && <nav className="nvMobilePanel" id="nv-mobile-nav" aria-label="Navegación móvil">
      <details><summary>Producto</summary><div className="nvDropdownPanel">{products.map(([href, title, detail]) => <a href={href} key={href} onClick={() => setOpen(false)}><b>{title}</b><small>{detail}</small></a>)}</div></details>
      <details><summary>Industrias</summary><div className="nvDropdownPanel nvIndustryDropdown">{industries.map(([href, title]) => <a href={href} key={href} onClick={() => setOpen(false)}><b>{title}</b><small>Un programa de puntos para tu negocio.</small></a>)}</div></details>
      <a href="#como-funciona" onClick={() => setOpen(false)}>Cómo funciona</a><a href="#planes" onClick={() => setOpen(false)}>Planes</a><a href="#preguntas" onClick={() => setOpen(false)}>Preguntas</a>
      <a className="nvMobileLogin" href="/acceso" onClick={() => setOpen(false)}>Iniciar sesión</a>
      <a className="nvButton nvButtonPrimary" href={whatsapp} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>Hablemos <LandingIcon name="arrow" /></a>
    </nav>}
  </div>;
}
