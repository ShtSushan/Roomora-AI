import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteProject,
  generatedImageUrl,
  getErrorMessage,
  imageUrl,
  listProjects,
} from "../services/api";

export default function History() {
  const [projects, setProjects] = useState(null); // null = still loading
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null); // card awaiting delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setProjects([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(projectId) {
    setDeletingId(projectId);
    setError("");
    try {
      await deleteProject(projectId);
      setProjects((list) => list.filter((p) => p.project_id !== projectId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  if (projects === null) {
    return <p className="text-center text-neutral-400">Loading projects...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-6 text-2xl font-semibold">Your projects</h2>

      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {projects.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-neutral-700 p-10 text-center">
          <p className="text-neutral-300">No saved projects yet.</p>
          <Link to="/" className="mt-3 inline-block text-indigo-400 hover:text-indigo-300">
            Create your first design
          </Link>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <article key={p.project_id} className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
            <img
              src={
                p.latest_generated_id
                  ? generatedImageUrl(p.latest_generated_id)
                  : imageUrl(p.original_image_id)
              }
              alt={`Latest design of ${p.name}`}
              className="h-56 w-full object-cover"
            />
            <div className="p-4">
              <h3 className="font-medium">{p.name}</h3>
              <p className="mt-1 text-xs text-neutral-400">
                {p.version_count} {p.version_count === 1 ? "version" : "versions"} · updated{" "}
                {new Date(p.updated_at).toLocaleString()}
              </p>

              {confirmingId === p.project_id ? (
                <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3">
                  <p className="text-sm text-red-200">
                    Delete this project and all its images? This cannot be undone.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={deletingId === p.project_id}
                      onClick={() => handleDelete(p.project_id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500 disabled:opacity-60"
                    >
                      {deletingId === p.project_id ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === p.project_id}
                      onClick={() => setConfirmingId(null)}
                      className="rounded-md border border-neutral-600 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/project/${p.project_id}`}
                    className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-400"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(p.project_id)}
                    className="rounded-md border border-neutral-700 px-4 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}