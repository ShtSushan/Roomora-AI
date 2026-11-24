import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import Editor from "./pages/Editor";
import History from "./pages/History";
import { checkHealth } from "./services/api";

// The key makes React rebuild the editor from scratch when the project
// changes, so no state from one project leaks into the next.
function EditorRoute() {
  const { projectId } = useParams(); // undefined on "/"
  return <Editor key={projectId ?? "new"} projectId={projectId} />;
}

function NotFound() {
  return (
    <div className="text-center">
      <p className="text-neutral-300">That page does not exist.</p>
      <Link to="/" className="mt-3 inline-block text-indigo-400 hover:text-indigo-300">
        Back to the editor
      </Link>
    </div>
  );
}

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-1.5 text-sm transition-colors ${
    isActive ? "bg-indigo-500/20 text-indigo-100" : "text-neutral-300 hover:text-white"
  }`;

export default function App() {
  const [backendStatus, setBackendStatus] = useState("checking...");

  useEffect(() => {
    checkHealth()
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("unreachable"));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Roomora AI</h1>
        <p className="mt-2 text-neutral-400">Redesign your room with AI</p>
        <nav className="mt-4 flex justify-center gap-2" aria-label="Main">
          <NavLink to="/" end className={navClass}>
            New design
          </NavLink>
          <NavLink to="/history" className={navClass}>
            History
          </NavLink>
        </nav>
        <p className="mt-3 text-xs">
          Backend:{" "}
          <span className={backendStatus === "ok" ? "text-green-400" : "text-amber-400"}>
            {backendStatus}
          </span>
        </p>
      </header>

      <Routes>
        <Route path="/" element={<EditorRoute />} />
        <Route path="/project/:projectId" element={<EditorRoute />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}