import Image from "next/image";

const industries = [
  ["industry-cafe.webp", "Cafeterías", "Interior de una cafetería local"],
  ["industry-taqueria.webp", "Taquerías", "Preparación de tacos en una taquería"],
  ["landing/6107.webp", "Panaderías", "Pan dulce recién horneado en un mostrador"],
  ["industry-restaurant.webp", "Restaurantes", "Mesa servida en un restaurante local"],
  ["industry-barber.webp", "Barberías", "Barbero atendiendo a un cliente"],
  ["industry-salon.webp", "Salones", "Espacio de atención de un salón"],
  ["industry-clinic.webp", "Consultorios", "Interior de un consultorio"],
  ["industry-ice-cream.webp", "Heladerías", "Vitrina de una heladería local"],
] as const;

export default function LandingIndustryCarousel() {
  return (
    <section className="nvIndustrySection" id="giros" aria-labelledby="industry-title">
      <div className="nvContainer">
        <div className="nvIndustryHeading" data-reveal>
          <div>
            <span className="nvEyebrow">DE UN MOSTRADOR A CUALQUIER NEGOCIO</span>
            <h2 id="industry-title">Nival cabe en tu día a día.</h2>
          </div>
          <small>Imágenes ilustrativas</small>
        </div>
        <div className="nvIndustryViewport" aria-label="Ejemplos de negocios donde puede usarse Nival">
          <div className="nvIndustryTrack">
            {[...industries, ...industries].map(([src, label, alt], index) => {
              const repeated = index >= industries.length;
              return (
                <article className="nvIndustryTile" key={`${label}-${index}`} aria-hidden={repeated || undefined}>
                  <Image src={`/assets/img/${src}`} alt={repeated ? "" : alt} fill sizes="(max-width: 760px) 74vw, 28vw" />
                  <b>{label}</b>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
