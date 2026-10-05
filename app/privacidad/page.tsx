export default async function Privacy({
  searchParams,
}: {
  searchParams: Promise<{ negocio?: string }>;
}) {
  const { negocio } = await searchParams;
  return (
    <main className="dashboard">
      <small>NIVAL PUNTOS · AVISO DE PRIVACIDAD</small>
      <h1>Tu tarjeta, tus datos</h1>
      <p role="alert">Borrador pendiente de revisión legal. La versión completa para el piloto se preparará en el bloque 2.</p>
      <p>Versión del 5 de octubre de 2026.</p>
      <section className="reviewBox">
        <h2>Responsables y contacto</h2>
        <p>
          {negocio || "El negocio en el que te registras"} administra su
          programa de lealtad. Nival Tech proporciona la plataforma. Puedes
          contactar a Nival en el teléfono 55 3904 4788 y solicitar los datos de
          contacto del negocio en su mostrador.
        </p>
        <h2>Datos y finalidad</h2>
        <p>
          Registramos nombre, teléfono, consentimiento, visitas, puntos, premios
          y fotos de evidencia de canje para identificar tu tarjeta, acreditar
          visitas, entregar recompensas y prevenir registros duplicados. No
          solicitamos datos bancarios ni datos sensibles. El teléfono se usa
          para recuperar tu tarjeta a petición tuya; el consentimiento no
          autoriza publicidad.
        </p>
        <h2>Acceso y conservación</h2>
        <p>
          El dueño y personal autorizado del negocio consultan lo necesario para
          atenderte. Cada negocio tiene acceso únicamente a sus propios
          clientes. El servicio utiliza proveedores de alojamiento y
          almacenamiento. Conservamos el historial mientras participe tu tarjeta
          y por el tiempo necesario para resolver aclaraciones sobre premios;
          puedes pedir baja o eliminación de datos que no deban conservarse.
        </p>
        <h2>Tus derechos</h2>
        <p>
          Puedes solicitar acceso, rectificación, cancelación u oposición al
          tratamiento, revocar tu consentimiento y limitar el uso de tus datos
          directamente en el negocio o por WhatsApp al 55 3904 4788. Indica el
          negocio y la solicitud; confirmaremos tu identidad antes de modificar
          o entregar información.
        </p>
        <h2>Cookie de tu tarjeta</h2>
        <p>
          Guardamos una cookie de seguridad durante un año para que puedas
          regresar sin registrarte. El servidor almacena únicamente un hash del
          token. Borrar la cookie no borra tu saldo; solicita un nuevo acceso al
          personal. La plataforma no usa esta cookie para seguimiento
          publicitario.
        </p>
        <p>Las actualizaciones de este aviso se publican en esta página.</p>
      </section>
      <a href="/">Nival Tech</a>
    </main>
  );
}
