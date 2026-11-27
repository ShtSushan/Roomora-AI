// The Roomora mark: a doorway arch on a rounded square.
// It takes its fill from the text colour, so set it with a text-* class.
export default function Logo({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M10 24v-9a6 6 0 0 1 12 0v9M7 24h18"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}