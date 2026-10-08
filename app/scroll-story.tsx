const steps = [
  { title: 'Te encuentran', text: 'Tu negocio aparece con información clara para que las personas sepan dónde estás y qué ofreces.' },
  { title: 'Te visitan y compran', text: 'Cuando una persona hace una compra, tu equipo registra la visita y entrega los puntos que configuraste.' },
  { title: 'Ven cuánto les falta', text: 'Cada cliente puede revisar su tarjeta y saber cuántas visitas le faltan para llegar al premio.' },
  { title: 'Canjean su premio', text: 'Al completar la meta, tu equipo confirma el canje. El historial queda guardado.' },
];

export default function ScrollStory() {
  return (
    <section id="como" className="nxStory" aria-labelledby="nxStoryTitle">
      <div className="nxStoryIntro">
        <span className="nxStoryEyebrow">FÁCIL PARA TU EQUIPO Y TUS CLIENTES</span>
        <h2 id="nxStoryTitle">Así funciona Nival</h2>
        <p>Cuatro pasos claros para invitar a tus clientes a volver.</p>
      </div>
      <ol className="nxStorySteps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="nxStoryStepNumber" aria-hidden="true">{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <p className="nxStoryRule">
        <strong>Una regla importante:</strong> las reseñas son voluntarias. Los puntos se entregan por visitas con compra, nunca por dejar una reseña.
      </p>
    </section>
  );
}
