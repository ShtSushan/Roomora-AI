import { useEffect, useState } from "react";
import DesignSettings from "./components/DesignSettings";
import ImageUploader from "./components/ImageUploader";
import PromptEditor from "./components/PromptEditor";
import {
  checkHealth,
  getErrorMessage,
  imageUrl,
  uploadImage,
} from "./services/api";

export default function App() {
  const [backendStatus, setBackendStatus] = useState("checking...");
  const [selectedFile, setSelectedFile] = useState(null);
  const [settings, setSettings] = useState({
    roomType: "living_room",
    style: "modern",
    palette: "beige_white",
  });
  const [prompt, setPrompt] = useState("");

  // "idle" | "uploading" | "done" | "error"
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploaded, setUploaded] = useState(null); // server response
  const [error, setError] = useState("");

  useEffect(() => {
    checkHealth()
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("unreachable"));
  }, []);

  // Called by the uploader whenever the user picks or removes a photo.
  function handleFileSelected(file) {
    setSelectedFile(file);
    setUploaded(null); // an old server copy no longer matches the selection
    setUploadStatus("idle");
    setError("");
  }

  async function handleGenerate() {
    setUploadStatus("uploading");
    setError("");
    try {
      const result = await uploadImage(selectedFile);
      setUploaded(result);
      setUploadStatus("done");
    } catch (err) {
      setError(getErrorMessage(err));
      setUploadStatus("error");
    }
  }

  const isUploading = uploadStatus === "uploading";
  const canGenerate = Boolean(selectedFile) && !isUploading;

  let buttonLabel = "Upload a photo to continue";
  if (selectedFile) buttonLabel = "Generate design";
  if (isUploading) buttonLabel = "Uploading...";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Roomora AI</h1>
        <p className="mt-2 text-neutral-400">Redesign your room with AI</p>
        <p className="mt-2 text-xs">
          Backend:{" "}
          <span
            className={
              backendStatus === "ok" ? "text-green-400" : "text-amber-400"
            }
          >
            {backendStatus}
          </span>
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <section className="flex flex-col items-center gap-4">
          <ImageUploader onFileSelected={handleFileSelected} />
        </section>

        <section className="flex flex-col items-center gap-6">
          <DesignSettings settings={settings} onChange={setSettings} />
          <PromptEditor value={prompt} onChange={setPrompt} />

          <button
            type="button"
            disabled={!canGenerate}
            onClick={handleGenerate}
            className="w-full max-w-xl rounded-xl bg-indigo-500 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            {buttonLabel}
          </button>

          {error && (
            <p
              role="alert"
              className="w-full max-w-xl rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {uploaded && (
            <div className="w-full max-w-xl">
              <p className="mb-2 text-sm text-green-400">
                Stored on the server ({uploaded.width}×{uploaded.height})
              </p>
              <img
                src={imageUrl(uploaded.image_id)}
                alt="Your room, as stored by the server"
                className="max-h-96 rounded-lg object-contain"
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}