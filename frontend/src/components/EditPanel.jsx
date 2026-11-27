import { useState } from "react";
import { Button } from "./ui";

const SUGGESTIONS = ["Make the lighting warmer", "Change the sofa to dark grey", "Add a large rug"];

export default function EditPanel({ activeLabel, onSubmit, busy }) {
  const [text, setText] = useState("");

  async function handleSubmit() {
    const succeeded = await onSubmit(text.trim());
    if (succeeded) setText(""); // keep the text if it failed, so the user can retry
  }

  return (
    <div>
      <label htmlFor="edit-instruction" className="block font-display text-xl font-semibold text-ink">
        Refine this design
      </label>
      <p id="edit-hint" className="mb-4 mt-1 text-sm text-muted">
        Describe one change at a time. It is applied to the version you are viewing ({activeLabel}).
      </p>

      <textarea
        id="edit-instruction"
        aria-describedby="edit-hint"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={3}
        disabled={busy}
        placeholder="e.g. Change the curtains to dark grey."
        className="w-full resize-none rounded-xl border border-line-strong bg-surface p-3 text-sm text-ink placeholder:text-muted/80 disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={busy}
            onClick={() => setText(suggestion)}
            className="rounded-full border border-line-strong px-3 py-1 text-xs text-ink-soft transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <Button
        className="mt-5"
        loading={busy}
        disabled={!busy && text.trim().length === 0}
        onClick={handleSubmit}
      >
        {busy ? "Applying change" : "Apply change"}
      </Button>
    </div>
  );
}