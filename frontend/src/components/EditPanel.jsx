import { useState } from "react";

export default function EditPanel({ activeLabel, onSubmit, busy }) {
  const [text, setText] = useState("");

  async function handleSubmit() {
    const succeeded = await onSubmit(text.trim());
    if (succeeded) setText(""); // keep the text if it failed, so the user can retry
  }

  return (
    <div className="w-full">
      <label htmlFor="edit-instruction" className="mb-2 block text-sm font-medium text-neutral-300">
        Refine this design{" "}
        <span className="font-normal text-neutral-500">(edits: {activeLabel})</span>
      </label>
      <textarea
        id="edit-instruction"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={3}
        disabled={busy}
        placeholder="e.g. Change the curtains to dark grey and add warm LED lighting behind the TV."
        className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-900 p-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-indigo-400 focus:outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy || text.trim().length === 0}
        className="mt-3 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {busy ? "Applying... (20 to 40 seconds)" : "Apply change"}
      </button>
    </div>
  );
}