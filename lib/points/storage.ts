import "server-only";
import sharp from "sharp";
export async function validatePhoto(file: File) {
  if (file.size < 12 || file.size > 3 * 1024 * 1024)
    throw Error("La foto debe pesar menos de 3 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext =
    bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? "jpg"
      : bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? "png"
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
            bytes.toString("ascii", 8, 12) === "WEBP"
          ? "webp"
          : null;
  if (!ext) throw Error("Sube una foto JPEG, PNG o WebP.");
  const mime=ext==="jpg"?"image/jpeg":"image/"+ext;
  if(file.type!==mime)throw Error("El tipo de archivo no coincide con la foto.");
  const decoded=sharp(bytes,{limitInputPixels:20000000,animated:false});
  const metadata=await decoded.metadata();
  if(!metadata.width||!metadata.height||(metadata.pages||1)>1)throw Error("Foto inválida.");
  await decoded.resize({width:1600,height:1600,fit:"inside",withoutEnlargement:true}).raw().toBuffer();
  return { bytes, ext, type: ext === "jpg" ? "image/jpeg" : "image/" + ext };
}
