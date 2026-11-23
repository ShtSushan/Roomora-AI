import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function App() {
  const [backendStatus, setBackendStatus] = useState("checking...");

  // Runs once when the page loads: ask the backend if it is alive.
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => response.json())
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("unreachable"));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold tracking-tight">Roomora AI</h1>
      <p className="text-neutral-400">Redesign your room with AI</p>
      <p className="text-sm">
        Backend status:{" "}
        <span
          className={
            backendStatus === "ok" ? "text-green-400" : "text-amber-400"
          }
        >
          {backendStatus}
        </span>
      </p>
    </div>
  );
}