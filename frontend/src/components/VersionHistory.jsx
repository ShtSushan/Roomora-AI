import { generatedImageUrl } from "../services/api";

export default function VersionHistory({ versions, activeIndex, onSelect, disabled }) {
  return (
    <div className="w-full">
      <h3 className="mb-2 text-sm font-medium text-neutral-300">Versions</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {versions.map((version, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={version.generated_id}
              type="button"
              onClick={() => onSelect(index)}
              disabled={disabled}
              aria-pressed={active}
              className={`shrink-0 rounded-lg border p-1 text-left transition-colors disabled:opacity-60 ${
                active ? "border-indigo-400" : "border-neutral-700 hover:border-neutral-500"
              }`}
            >
              <img
                src={generatedImageUrl(version.generated_id)}
                alt={version.label}
                className="h-24 w-auto rounded-md object-cover"
              />
              <span className="mt-1 block text-center text-xs text-neutral-300">{version.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}