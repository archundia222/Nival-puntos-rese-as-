export default function WhatsAppFab({ href }: { href: string }) {
  return <a className="refWhats" href={href} target="_blank" rel="noreferrer" aria-label="Hablar con Nival por WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M9 8.5c.4 2 2 3.6 4 4l1-1 2 1.2c-.3 1.5-1.2 2.2-2.6 2.1-3.7-.4-6.7-3.4-7.1-7.1-.1-1.4.6-2.3 2.1-2.6l1.2 2-1 1.4Z" fill="currentColor"/></svg></a>;
}
