import { generatedImageUrl } from "../services/api";

export default function VersionHistory({ versions, activeIndex, onSelect, disabled }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">Versions</h3>
      <p className="mb-3 mt-1 text-sm text-muted">
        Click a version to view it. Changes apply to the one you are viewing.
      </p>
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
              aria-label={`View ${version.label}`}
              className={`shrink-0 rounded-lg border-2 p-1 text-center transition-colors disabled:opacity-60 ${
                active ? "border-brand" : "border-transparent hover:border-line-strong"
              }`}
            >
              <img
                src={generatedImageUrl(version.generated_id)}
                alt=""
                className="h-24 w-auto rounded-md object-cover"
              />
              <span
                className={`mt-1 block text-xs ${active ? "font-medium text-brand" : "text-muted"}`}
              >
                {version.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}