import { useEffect, useRef, useState } from "react";
import { ChevronsIcon } from "./icons";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function BeforeAfter({ beforeSrc, afterSrc, afterLabel }) {
  // Percent of the width that shows the original (the left side).
  // It starts almost fully on the original and slides to the middle once,
  // so the first look at a result is a reveal. Reduced motion skips it.
  const [position, setPosition] = useState(() => (prefersReducedMotion() ? 50 : 98));
  const userMoved = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame;
    const start = performance.now();
    const duration = 1100;
    const step = (now) => {
      if (userMoved.current) return; // the person took over the slider
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setPosition(98 + (50 - 98) * eased);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-xl bg-canvas">
      {/* The redesign sets the size of the frame. */}
      <img src={afterSrc} alt={afterLabel} className="block w-full" draggable={false} />

      {/* The original sits on top, revealed only up to the slider position. */}
      <img
        src={beforeSrc}
        alt="Original room"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      {/* Invisible slider on top: handles mouse, touch and arrow keys. */}
      <input
        type="range"
        min="0"
        max="100"
        step="0.5"
        value={position}
        onChange={(e) => {
          userMoved.current = true;
          setPosition(Number(e.target.value));
        }}
        aria-label="Compare the original with the redesign"
        className="peer absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
      />

      {/* Divider and handle. peer-focus-visible shows a ring for keyboard users. */}
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        style={{ left: `${position}%` }}
      />
      <div
        className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2"
        style={{ left: `${position}%` }}
      >
        <ChevronsIcon className="h-5 w-5" />
      </div>

      <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-ink">
        Original
      </span>
      <span className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-ink">
        {afterLabel}
      </span>
    </div>
  );
}