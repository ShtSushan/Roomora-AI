// Class strings for buttons. Kept in a plain file so links (<Link>, <a>) can
// look exactly like buttons by calling buttonClasses(...).
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-hover disabled:bg-line-strong disabled:text-muted",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-canvas disabled:text-muted",
  ghost: "text-ink-soft hover:bg-brand-soft hover:text-brand disabled:text-muted",
  danger: "bg-danger text-white hover:bg-red-800 disabled:opacity-60",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function buttonClasses(variant = "primary", size = "md", extra = "") {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`.trim();
}