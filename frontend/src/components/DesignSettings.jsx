import { PALETTES, ROOM_TYPES, STYLES } from "../designOptions";

// A reusable row of clickable chips. Used for room type and style.
function ChipGroup({ label, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-neutral-300">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                selected
                  ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                  : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
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
    <div className="flex w-full max-w-xl flex-col gap-6">
      <ChipGroup
        label="Room type"
        options={ROOM_TYPES}
        value={settings.roomType}
        onChange={update("roomType")}
      />

      <ChipGroup
        label="Interior style"
        options={STYLES}
        value={settings.style}
        onChange={update("style")}
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-300">
          Colour palette
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PALETTES.map((palette) => {
            const selected = palette.id === settings.palette;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => update("palette")(palette.id)}
                aria-pressed={selected}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? "border-indigo-400 bg-indigo-500/10"
                    : "border-neutral-700 hover:border-neutral-500"
                }`}
              >
                <div className="mb-2 flex gap-1">
                  {palette.colors.map((color) => (
                    <span
                      key={color}
                      className="h-6 w-6 rounded-full border border-neutral-600"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-xs text-neutral-300">{palette.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}