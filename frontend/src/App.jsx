import { useEffect, useState } from "react";
import DesignSettings from "./components/DesignSettings";
import ImageUploader from "./components/ImageUploader";
import PromptEditor from "./components/PromptEditor";

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  const [backendStatus, setBackendStatus] = useState("checking...");
  const [selectedFile, setSelectedFile] = useState(null);
  const [settings, setSettings] = useState({
    roomType: "living_room",
    style: "modern",
    palette: "beige_white",
  });
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => response.json())
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("unreachable"));
  }, []);

  const canGenerate = Boolean(selectedFile);

  function handleGenerate() {
    // Phase 5 will send this to the backend. For now we only display it.
    setPreview({ ...settings, prompt: prompt.trim(), photo: selectedFile.name });
  }

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
          <ImageUploader onFileSelected={setSelectedFile} />
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
            {canGenerate ? "Generate design" : "Upload a photo to continue"}
          </button>

          {preview && (
            <pre className="w-full max-w-xl overflow-x-auto rounded-xl bg-neutral-900 p-4 text-xs text-neutral-300">
              {JSON.stringify(preview, null, 2)}
            </pre>
          )}
        </section>
      </main>
    </div>
  );
}