export type CardImageKind = "logo" | "squareLogo" | "background";

const limits: Record<CardImageKind, { dimension: number; bytes: number }> = {
  logo: { dimension: 640, bytes: 55_000 },
  squareLogo: { dimension: 640, bytes: 55_000 },
  background: { dimension: 1600, bytes: 150_000 },
};

function loadImage(file: File): Promise<{ image: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).then((bitmap) => ({
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    }));
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo abrir la foto."));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo optimizar la imagen.")), "image/webp", quality);
  });
}

function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(blob);
  });
}

/** Compress gallery photos before storing them with the card design. */
export async function optimizeCardImage(file: File, kind: CardImageKind): Promise<string> {
  if (!/^image\/(png|jpeg|webp|heic|heif|avif)$/i.test(file.type)) {
    throw new Error("Elige una foto PNG, JPEG, WebP, HEIC o AVIF.");
  }
  if (file.size > 12 * 1024 * 1024) throw new Error("La foto debe pesar menos de 12 MB.");

  const limit = limits[kind];
  const loaded = await loadImage(file);
  try {
    const ratio = Math.min(1, limit.dimension / Math.max(loaded.width, loaded.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(loaded.width * ratio));
    canvas.height = Math.max(1, Math.round(loaded.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la imagen.");
    context.drawImage(loaded.image, 0, 0, canvas.width, canvas.height);

    let blob: Blob | undefined;
    for (const quality of [0.84, 0.74, 0.64, 0.54, 0.44]) {
      blob = await canvasBlob(canvas, quality);
      if (blob.type === "image/webp" && blob.size <= limit.bytes) break;
    }
    if (!blob || blob.type !== "image/webp") throw new Error("Este navegador no pudo optimizar la foto. Prueba con una imagen JPEG o WebP.");
    if (blob.size > limit.bytes) throw new Error("La foto sigue pesando mucho. Elige otra imagen más sencilla.");
    return await dataUrl(blob);
  } finally {
    loaded.release();
  }
}
