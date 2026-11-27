import { buttonClasses } from "./buttonStyles";
import { AlertIcon } from "./icons";

export function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${className} animate-spin motion-reduce:animate-none`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// While `loading` is true the button keeps its colour, shows a spinner and ignores clicks.
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  type = "button",
  onClick,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      className={buttonClasses(variant, size, `${loading ? "cursor-wait" : ""} ${className}`)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

// A white panel with a hairline border.
export function Sheet({ className = "", children, ...props }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 sm:p-7 ${className}`} {...props}>
      {children}
    </section>
  );
}

export function Alert({ children, className = "" }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-red-200 bg-danger-soft p-4 text-sm text-danger ${className}`}
    >
      <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

// A row of mutually exclusive buttons, e.g. "Slider | Side by side".
export function Segmented({ label, options, value, onChange, disabled = false }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-lg border border-line-strong bg-surface p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
              selected ? "bg-brand text-white" : "text-ink-soft hover:bg-brand-soft hover:text-brand"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}