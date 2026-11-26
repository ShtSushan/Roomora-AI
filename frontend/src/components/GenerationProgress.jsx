import { useEffect, useState } from "react";

export default function GenerationProgress({ active, label }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    setSeconds(0);
    // Measure from the real clock, so the timer stays right even when the
    // browser slows its timers in a background tab.
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt) / 1000)),
      500
    );
    return () => clearInterval(timer); // stops the timer when the job ends
  }, [active]);

  if (!active) return null;

  return (
    <div className="w-full max-w-xl rounded-xl border border-indigo-900 bg-indigo-950/30 p-4">
      <div className="mb-3 flex items-center justify-between text-sm">
        {/* role="status" lets screen readers announce the label once. */}
        <p role="status" className="font-medium text-indigo-100">
          {label}
        </p>
        {/* Hidden from screen readers: reading out every second would be noise. */}
        <span aria-hidden="true" className="tabular-nums text-neutral-300">
          {seconds} s
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-neutral-800" aria-hidden="true">
        <div
          className="roomora-bar h-full w-1/3 rounded-full bg-indigo-400"
          style={{ animation: "roomora-slide 1.4s ease-in-out infinite" }}
        />
      </div>

      <p className="mt-3 text-xs text-neutral-400">
        {seconds < 45
          ? "Usually 20 to 40 seconds. The first design after starting ComfyUI takes longer because the AI models are loading."
          : "Taking longer than usual. The first run after starting ComfyUI can take over a minute. The request gives up after 5 minutes."}
      </p>
    </div>
  );
}