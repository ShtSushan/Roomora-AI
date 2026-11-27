import { MAX_PROMPT_LENGTH } from "../designOptions";

export default function PromptEditor({ value, onChange }) {
  return (
    <div>
      <label htmlFor="custom-prompt" className="block text-sm font-semibold text-ink">
        Anything else?
      </label>
      <p id="prompt-hint" className="mb-3 mt-1 text-sm text-muted">
        Optional. Say what you want to see rather than what to avoid.
      </p>
      <textarea
        id="custom-prompt"
        aria-describedby="prompt-hint"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_PROMPT_LENGTH}
        rows={3}
        placeholder="e.g. Solid walls with no windows, a large oak desk, and warm lighting."
        className="w-full resize-none rounded-xl border border-line-strong bg-surface p-3 text-sm text-ink placeholder:text-muted/80"
      />
      <p className="mt-1 text-right text-xs text-muted">
        {value.length}/{MAX_PROMPT_LENGTH}
      </p>
    </div>
  );
}