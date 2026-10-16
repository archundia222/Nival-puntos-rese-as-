import type { Metadata } from "next";
import {
  Button,
  EmptyState,
  Field,
  Skeleton,
  Status,
  Surface,
} from "../../lib/design-system/ui";
import "./design-system.css";

export const metadata: Metadata = { title: "Sistema de diseño | Nival" };

const tokens = [
  { label: "Fondo", token: "--color-background", color: "background" },
  { label: "Superficie", token: "--color-surface", color: "surface" },
  { label: "Borde", token: "--color-border", color: "border" },
  { label: "Texto", token: "--color-text", color: "text" },
  { label: "Texto suave", token: "--color-text-muted", color: "muted" },
  { label: "Acento", token: "--color-accent", color: "accent" },
  { label: "Éxito", token: "--color-success", color: "success" },
  { label: "Advertencia", token: "--color-warning", color: "warning" },
  { label: "Peligro", token: "--color-danger", color: "danger" },
];

export default function DesignPage() {
  return (
    <main className="designPage">
      <header className="designHeader">
        <a className="designWordmark" href="/" aria-label="Nival, inicio">
          <span aria-hidden="true">N</span>NIVAL
        </a>
        <a className="designBack" href="/">
          Volver al sitio <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="designIntro" aria-labelledby="design-title">
        <div>
          <p className="designEyebrow">NIVAL · FUNDAMENTOS VISUALES</p>
          <h1 id="design-title">
            Claro al verlo.
            <br />
            <em>Fácil al usarlo.</em>
          </h1>
          <p className="designLead">
            Sistema visual para que cada pantalla se sienta parte de la misma
            herramienta.
          </p>
        </div>
        <div className="designIntroNote">
          <span>ETAPA 1</span>
          <p>
            Verde profundo, lima y crema. Un lenguaje directo, pensado para el
            mostrador y el celular.
          </p>
        </div>
      </section>

      <nav className="designNav" aria-label="Contenido del sistema de diseño">
        <a href="#colores">Colores</a>
        <a href="#tipografia">Tipografía</a>
        <a href="#controles">Controles</a>
        <a href="#estados">Estados</a>
      </nav>

      <section
        className="designSection"
        id="colores"
        aria-labelledby="colors-title"
      >
        <div className="designSectionHeading">
          <p className="designEyebrow">01 · POR FUNCIÓN</p>
          <h2 id="colors-title">Color con propósito.</h2>
          <p>
            El lima destaca acciones; el texto sobre el acento conserva
            contraste.
          </p>
        </div>
        <div className="designTokenGrid">
          {tokens.map((item) => (
            <article
              className={`designToken designToken--${item.color}`}
              key={item.token}
            >
              <span className="designTokenSwatch" aria-hidden="true" />
              <div>
                <b>{item.label}</b>
                <code>{item.token}</code>
              </div>
            </article>
          ))}
        </div>
        <div className="designDarkSample">
          <div>
            <span className="designEyebrow">ACCIÓN PRINCIPAL</span>
            <h3>
              Una visita más
              <br />
              te acerca al premio.
            </h3>
          </div>
          <Button>Registrar visita</Button>
        </div>
      </section>

      <section
        className="designSection designTypeSection"
        id="tipografia"
        aria-labelledby="type-title"
      >
        <div className="designSectionHeading">
          <p className="designEyebrow">02 · JERARQUÍA</p>
          <h2 id="type-title">Primero lo importante.</h2>
          <p>
            Una escala clara en saltos de 8 px. Lectura cómoda en pantallas
            pequeñas.
          </p>
        </div>
        <div className="designTypeSamples">
          <p className="designTypeDisplay">
            Cada visita
            <br />
            cuenta.
          </p>
          <div>
            <h3>Resumen del negocio</h3>
            <p>Visitas, premios y clientes en una sola vista.</p>
            <small>DETALLE Y AYUDA · 16 PX</small>
          </div>
        </div>
      </section>

      <section
        className="designSection"
        id="controles"
        aria-labelledby="controls-title"
      >
        <div className="designSectionHeading">
          <p className="designEyebrow">03 · COMPONENTES BASE</p>
          <h2 id="controls-title">Listos para cada tarea.</h2>
          <p>
            Botones, campos, superficies y estados comparten las mismas reglas.
          </p>
        </div>
        <div className="designComponentGrid">
          <Surface>
            <p className="designComponentLabel">
              BOTONES · HOVER Y FOCO CON TECLADO
            </p>
            <div className="designButtonRow">
              <Button>Acción principal</Button>
              <Button tone="secondary">Acción secundaria</Button>
              <Button tone="quiet">Ver detalles</Button>
            </div>
            <div className="designButtonRow">
              <Button disabled>Deshabilitado</Button>
              <Button loading>Guardando</Button>
            </div>
          </Surface>
          <Surface>
            <p className="designComponentLabel">
              CAMPO · DEFAULT, FOCO Y ERROR
            </p>
            <Field
              label="Nombre del negocio"
              name="business"
              placeholder="Ej. Café Nube"
              hint="Así aparecerá en la tarjeta."
            />
            <Field
              label="Teléfono"
              name="phone"
              placeholder="55 1234 5678"
              error="Revisa el número e inténtalo de nuevo."
            />
          </Surface>
        </div>
      </section>

      <section
        className="designSection designStateSection"
        id="estados"
        aria-labelledby="states-title"
      >
        <div className="designSectionHeading">
          <p className="designEyebrow">04 · RESPUESTA DEL SISTEMA</p>
          <h2 id="states-title">Nada se queda en silencio.</h2>
          <p>La interfaz explica qué pasó y cuál es el siguiente paso.</p>
        </div>
        <div className="designStateGrid">
          <Surface>
            <p className="designComponentLabel">CONFIRMACIÓN</p>
            <div className="designStateContent">
              <Status tone="success">Visita registrada</Status>
              <p>El cliente ya tiene un punto más.</p>
            </div>
          </Surface>
          <Surface>
            <p className="designComponentLabel">AVISO</p>
            <div className="designStateContent">
              <Status tone="warning">Revisa el dato</Status>
              <p>Falta confirmar la sucursal antes de continuar.</p>
            </div>
          </Surface>
          <Surface>
            <p className="designComponentLabel">ERROR</p>
            <div className="designStateContent">
              <Status tone="danger">No se guardó</Status>
              <p>Inténtalo de nuevo. El saldo no cambió.</p>
            </div>
          </Surface>
          <Surface>
            <p className="designComponentLabel">CARGA</p>
            <Skeleton label="Cargando resumen de actividad" />
          </Surface>
          <Surface className="designEmptySurface">
            <p className="designComponentLabel">VACÍO</p>
            <EmptyState title="Aún no hay clientes">
              Comparte tu QR para que alguien se registre.
            </EmptyState>
            <Button tone="secondary">Ver QR del negocio</Button>
          </Surface>
        </div>
      </section>

      <footer className="designFooter">
        <span>NIVAL · SISTEMA DE DISEÑO</span>
        <span>Contraste, foco y estados incluidos en cada componente.</span>
      </footer>
    </main>
  );
}
