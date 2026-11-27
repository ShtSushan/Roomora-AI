import { PALETTES, ROOM_TYPES, STYLES } from "../designOptions";
import { CheckIcon } from "./icons";

// A row of clickable pills. Used for room type and style.
function ChipGroup({ label, hint, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                selected
                  ? "border-brand bg-brand text-white"
                  : "border-line-strong bg-surface text-ink-soft hover:border-brand hover:text-brand"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function DesignSettings({ settings, onChange }) {
  // Copies the current settings and changes one field.
  const update = (field) => (value) => onChange({ ...settings, [field]: value });

  return (
    <div className="flex flex-col gap-7">
      <ChipGroup
        label="Room"
        options={ROOM_TYPES}
        value={settings.roomType}
        onChange={update("roomType")}
      />

      <ChipGroup
        label="Style"
        options={STYLES}
        value={settings.style}
        onChange={update("style")}
      />

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Colours</legend>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PALETTES.map((palette) => {
            const selected = palette.id === settings.palette;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => update("palette")(palette.id)}
                aria-pressed={selected}
                className={`overflow-hidden rounded-xl border bg-surface text-left transition-colors ${
                  selected ? "border-brand ring-2 ring-brand" : "border-line-strong hover:border-brand"
                }`}
              >
                {/* Looks like a paint chip: the colours on top, the name below. */}
                <span className="relative flex h-14">
                  {palette.colors.map((color) => (
                    <span key={color} className="flex-1" style={{ backgroundColor: color }} />
                  ))}
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                  )}
                </span>
                <span className="block px-3 py-2 text-sm text-ink">{palette.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}