import { useEffect, useRef, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 15;

export default function ImageUploader({ onFileSelected }) {
  const inputRef = useRef(null); // lets us open the hidden file picker
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  // A preview URL holds memory in the browser. When the URL changes or the
  // component disappears, this cleanup releases the old one.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(selected) {
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      setError(`That file is larger than ${MAX_MB} MB.`);
      return;
    }

    setError("");
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    onFileSelected?.(selected); // tell the parent component
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

  return (
    <div className="w-full max-w-xl">
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openPicker();
        }}
        onDragOver={(e) => {
          e.preventDefault(); // required, or the drop event never fires
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex min-h-72 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? "border-indigo-400 bg-indigo-950/40"
            : "border-neutral-700 hover:border-neutral-500"
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Selected room preview"
            className="max-h-96 rounded-lg object-contain"
          />
        ) : (
          <div className="text-center">
            <p className="text-lg font-medium">Drop your room photo here</p>
            <p className="mt-1 text-sm text-neutral-400">
              or click to browse (JPG, PNG, WEBP, up to {MAX_MB} MB)
            </p>
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

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {file && (
        <div className="mt-3 flex items-center justify-between text-sm text-neutral-300">
          <span className="truncate">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
          <button
            onClick={handleRemove}
            className="ml-4 rounded-md border border-neutral-700 px-3 py-1 hover:bg-neutral-800"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}