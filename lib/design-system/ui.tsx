import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

type ButtonTone = "primary" | "secondary" | "quiet" | "danger";

export function Button({
  children,
  tone = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      className={`dsButton dsButton--${tone}${className ? ` ${className}` : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="dsSpinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const fieldId = id || props.name || label.toLowerCase().replace(/\s+/g, "-");
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div
      className={`dsField${error ? " dsField--error" : ""}${className ? ` ${className}` : ""}`}
    >
      <label htmlFor={fieldId}>{label}</label>
      <input
        {...props}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {hint ? <small id={hintId}>{hint}</small> : null}
      {error ? (
        <small id={errorId} className="dsFieldError">
          {error}
        </small>
      ) : null}
    </div>
  );
}

export function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <span className={`dsStatus dsStatus--${tone}`}>
      <span aria-hidden="true" />
      {children}
    </span>
  );
}

export function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`dsSurface${className ? ` ${className}` : ""}`}>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="dsEmpty">
      <span className="dsEmptyMark" aria-hidden="true">
        +
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function Skeleton({ label = "Cargando contenido" }: { label?: string }) {
  return (
    <div className="dsSkeleton" role="status" aria-label={label}>
      <span />
      <span />
      <span />
    </div>
  );
}
