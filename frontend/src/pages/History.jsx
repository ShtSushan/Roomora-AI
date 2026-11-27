import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buttonClasses } from "../components/buttonStyles";
import { FolderIcon, TrashIcon } from "../components/icons";
import { Alert, Button } from "../components/ui";
import usePageTitle from "../hooks/usePageTitle";
import {
  deleteProject,
  generatedImageUrl,
  getErrorMessage,
  imageUrl,
  listProjects,
} from "../services/api";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function History() {
  usePageTitle("My projects");

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

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">My projects</h1>
          <p className="mt-2 text-muted">Every design you create is saved here automatically.</p>
        </div>
        <Link to="/" className={buttonClasses("primary", "md")}>
          New design
        </Link>
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}

      {projects === null && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              className="h-72 animate-pulse rounded-2xl border border-line bg-surface motion-reduce:animate-none"
            />
          ))}
        </div>
      )}

      {projects !== null && projects.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
            <FolderIcon />
          </span>
          <h2 className="font-display text-xl font-semibold">No projects yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Create your first design and it will appear here, ready to reopen.
          </p>
          <Link to="/" className={buttonClasses("primary", "md", "mt-6")}>
            Create a design
          </Link>
        </div>
      )}

      {projects !== null && projects.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <article
              key={p.project_id}
              className="overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <img
                src={
                  p.latest_generated_id
                    ? generatedImageUrl(p.latest_generated_id)
                    : imageUrl(p.original_image_id)
                }
                alt={`Latest design of ${p.name}`}
                className="aspect-[4/3] w-full bg-canvas object-cover"
              />
              <div className="p-5">
                <h2 className="font-display text-lg font-semibold">{p.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {p.version_count} {p.version_count === 1 ? "version" : "versions"}
                </p>
                <p className="text-sm text-muted">Updated {formatDate(p.updated_at)}</p>

                {confirmingId === p.project_id ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-danger-soft p-4">
                    <p className="text-sm text-danger">
                      Delete this project and all its images? This cannot be undone.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletingId === p.project_id}
                        onClick={() => handleDelete(p.project_id)}
                      >
                        Delete project
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={deletingId === p.project_id}
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      to={`/project/${p.project_id}`}
                      className={buttonClasses("primary", "sm")}
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(p.project_id)}
                      aria-label={`Delete ${p.name}`}
                      className={buttonClasses("ghost", "sm")}
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}