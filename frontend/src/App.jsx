import { useEffect, useState } from "react";
import DesignSettings from "./components/DesignSettings";
import ImageUploader from "./components/ImageUploader";
import PromptEditor from "./components/PromptEditor";
import {
  checkHealth,
  generateDesign,
  generatedImageUrl,
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

  // "idle" | "uploading" | "generating" | "done" | "error"
  const [stage, setStage] = useState("idle");
  const [uploaded, setUploaded] = useState(null); // stored original
  const [result, setResult] = useState(null); // generated design
  const [error, setError] = useState("");

  useEffect(() => {
    checkHealth()
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("unreachable"));
  }, []);

  function handleFileSelected(file) {
    setSelectedFile(file);
    setUploaded(null);
    setResult(null);
    setStage("idle");
    setError("");
  }

  async function handleGenerate() {
    setError("");
    setResult(null);
    try {
      // Upload only once per photo; later regenerations reuse the stored copy.
      let current = uploaded;
      if (!current) {
        setStage("uploading");
        current = await uploadImage(selectedFile);
        setUploaded(current);
      }

      setStage("generating");
      const generated = await generateDesign({
        imageId: current.image_id,
        roomType: settings.roomType,
        style: settings.style,
        palette: settings.palette,
        prompt: prompt.trim(),
      });
      setResult(generated);
      setStage("done");
    } catch (err) {
      setError(getErrorMessage(err));
      setStage("error");
    }
  }

  const isBusy = stage === "uploading" || stage === "generating";
  const canGenerate = Boolean(selectedFile) && !isBusy;

  let buttonLabel = "Upload a photo to continue";
  if (selectedFile) buttonLabel = result ? "Generate again" : "Generate design";
  if (stage === "uploading") buttonLabel = "Uploading...";
  if (stage === "generating") buttonLabel = "Generating... (20 to 40 seconds)";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Roomora AI</h1>
        <p className="mt-2 text-neutral-400">Redesign your room with AI</p>
        <p className="mt-2 text-xs">
          Backend:{" "}
          <span className={backendStatus === "ok" ? "text-green-400" : "text-amber-400"}>
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
        </section>
      </main>

      {result && uploaded && (
        <section className="mx-auto mt-12 max-w-6xl">
          <h2 className="mb-4 text-xl font-semibold">Your redesign</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <figure>
              <figcaption className="mb-2 text-sm text-neutral-400">Original</figcaption>
              <img
                src={imageUrl(uploaded.image_id)}
                alt="Original room"
                className="w-full rounded-lg object-contain"
              />
            </figure>
            <figure>
              <figcaption className="mb-2 text-sm text-neutral-400">Redesigned</figcaption>
              <img
                src={generatedImageUrl(result.generated_id)}
                alt="AI redesigned room"
                className="w-full rounded-lg object-contain"
              />
            </figure>
          </div>
          <details className="mt-4 text-sm text-neutral-400">
            <summary className="cursor-pointer">Prompt sent to the model</summary>
            <p className="mt-2">{result.prompt_used}</p>
          </details>
        </section>
      )}
    </div>
  );
}