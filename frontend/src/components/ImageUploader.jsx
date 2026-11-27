import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "./icons";
import { Button } from "./ui";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 15;

// savedImageUrl: when a saved project is reopened, its photo is shown here.
export default function ImageUploader({ onFileSelected, savedImageUrl = null }) {
  const inputRef = useRef(null); // lets us open the hidden file picker
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  // A preview URL holds memory in the browser. This releases the old one.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(selected) {
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Choose a JPG, PNG or WEBP image.");
      return;
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      setError(`That file is larger than ${MAX_MB} MB. Choose a smaller photo.`);
      return;
    }

    setError("");
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    onFileSelected?.(selected);
  }

  function handleDrop(event) {
    event.preventDefault(); // stop the browser from opening the file itself
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  function handleInputChange(event) {
    handleFile(event.target.files[0]);
    event.target.value = ""; // allows choosing the same file again later
  }

  function handleRemove() {
    setFile(null);
    setPreviewUrl(null);
    setError("");
    onFileSelected?.(null);
  }

  const openPicker = () => inputRef.current?.click();
  const shownUrl = previewUrl ?? savedImageUrl;

  let zoneClasses = "border-line-strong bg-canvas hover:border-brand";
  if (isDragging) zoneClasses = "border-brand bg-brand-soft";
  else if (shownUrl) zoneClasses = "border-transparent bg-canvas";

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose a room photo"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault(); // required, or the drop event never fires
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex min-h-72 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-3 transition-colors ${zoneClasses}`}
      >
        {shownUrl ? (
          <img
            src={shownUrl}
            alt="Your room"
            className="max-h-[28rem] w-auto max-w-full rounded-lg object-contain"
          />
        ) : (
          <div className="px-4 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <ImageIcon />
            </span>
            <p className="font-medium text-ink">Drop a photo here</p>
            <p className="mt-1 text-sm text-muted">or choose a file from your computer</p>
            <p className="mt-4 text-xs text-muted">JPG, PNG or WEBP, up to {MAX_MB} MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {file && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{file.name}</p>
            <p className="text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" onClick={openPicker}>
              Replace
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </div>
      )}

      {!file && savedImageUrl && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <p className="text-muted">Photo saved with this project</p>
          <Button variant="secondary" size="sm" onClick={openPicker}>
            Use a different photo
          </Button>
        </div>
      )}
    </div>
  );
}