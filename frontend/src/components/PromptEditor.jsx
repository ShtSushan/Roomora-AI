import { MAX_PROMPT_LENGTH } from "../designOptions";

export default function PromptEditor({ value, onChange }) {
  return (
    <div className="w-full max-w-xl">
      <label
        htmlFor="custom-prompt"
        className="mb-2 block text-sm font-medium text-neutral-300"
      >
        Additional instructions (optional)
      </label>
      <textarea
        id="custom-prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_PROMPT_LENGTH}
        rows={4}
        placeholder="e.g. Add a king-size bed, wooden flooring, warm lighting and a wardrobe."
        className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-900 p-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-indigo-400 focus:outline-none"
      />
      <p className="mt-1 text-right text-xs text-neutral-500">
        {value.length}/{MAX_PROMPT_LENGTH}
      </p>
    </div>
  );
}