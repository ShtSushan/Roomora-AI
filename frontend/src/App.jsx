import { useEffect, useState } from "react";
import ImageUploader from "./components/ImageUploader";

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  const [backendStatus, setBackendStatus] = useState("checking...");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => response.json())
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("unreachable"));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center gap-6 px-4 py-12">
      <header className="text-center">
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

      <ImageUploader onFileSelected={setSelectedFile} />

      <p className="text-sm text-neutral-500">
        {selectedFile ? "Photo ready." : "No photo selected yet."}
      </p>
    </div>
  );
}