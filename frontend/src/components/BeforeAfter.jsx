import { useState } from "react";

export default function BeforeAfter({ beforeSrc, afterSrc, afterLabel }) {
  // Percent of the width that shows the original (the left side).
  const [position, setPosition] = useState(50);

  return (
    <div className="relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-lg">
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

      <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs">Original</span>
      <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-xs">{afterLabel}</span>

      {/* Divider line and handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-2 py-1 text-xs font-bold text-neutral-900 shadow">
          ◀ ▶
        </div>
      </div>

      {/* Invisible slider on top: handles mouse, touch and arrow keys. */}
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Compare original and redesign"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}