"use client";
import { useEffect, useState } from "react";
export function InstallStaff() {
  const [prompt, setPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/staff-sw.js", { scope: "/staff" }).catch(() => {});
    const listener = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", listener);
    return () => window.removeEventListener("beforeinstallprompt", listener);
  }, []);
  if (dismissed) return null;
  return (
    <aside className="installStaff" aria-label="Instalar Nival en el celular">
      <div>
        <strong>Acceso rápido desde tu celular</strong>
        <p>Agrega Nival a la pantalla de inicio. En iPhone, abre en Safari y toca Compartir → Agregar a pantalla de inicio.</p>
      </div>
      <div className="installStaffActions">
        {prompt && (
          <button type="button" onClick={async () => { await prompt.prompt(); setPrompt(null); }}>
            Instalar
          </button>
        )}
        <button type="button" className="installDismiss" aria-label="Cerrar aviso de instalación" onClick={() => setDismissed(true)}>×</button>
      </div>
    </aside>
  );
}
