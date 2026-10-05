"use client";
import { useEffect, useState } from "react";
export function InstallStaff() {
  const [prompt, setPrompt] = useState<any>(null);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/staff-sw.js", { scope: "/staff" })
        .catch(() => {});
    const listener = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", listener);
    return () => window.removeEventListener("beforeinstallprompt", listener);
  }, []);
  return (
    <div className="installStaff">
      {prompt ? (
        <button
          onClick={async () => {
            await prompt.prompt();
            setPrompt(null);
          }}
        >
          Instalar escáner en mi celular
        </button>
      ) : (
        <p>
          Para instalar: abre el menú del navegador y elige «Agregar a pantalla
          de inicio». En iPhone usa Safari → Compartir.
        </p>
      )}
    </div>
  );
}
