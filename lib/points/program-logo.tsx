"use client";
import { useState } from "react";
export function ProgramLogo({ initial,name="logo",label="Logo del negocio" }: { initial: string;name?:string;label?:string }) {
  const [value, setValue] = useState(initial),
    [error, setError] = useState("");
  async function pick(file?: File) {
    setError("");
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 250000
    ) {
      setError("Usa PNG, JPEG o WebP de menos de 250 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setValue(String(reader.result));
    reader.readAsDataURL(file);
  }
  return (
    <div className="wide">
      <label>
        {label}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </label>
      <input type="hidden" name={name} value={value} />
      {value && (
        <>
          <img src={value} alt={label} width="80" height="80" />
          <button type="button" onClick={() => setValue("")}>
            Quitar logo
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
