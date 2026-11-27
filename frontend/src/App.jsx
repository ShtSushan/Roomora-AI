import { useCallback, useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import Logo from "./components/logo";
import { buttonClasses } from "./components/buttonStyles";
import Editor from "./pages/Editor";
import History from "./pages/History";
import usePageTitle from "./hooks/usePageTitle";
import { checkHealth } from "./services/api";

// The key makes React rebuild the editor from scratch when the project
// changes, so no state from one project leaks into the next.
function EditorRoute() {
  const { projectId } = useParams(); // undefined on "/"
  return <Editor key={projectId ?? "new"} projectId={projectId} />;
}

function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="py-16 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted">The page you are looking for does not exist.</p>
      <Link to="/" className={buttonClasses("primary", "md", "mt-6")}>
        Go to the studio
      </Link>
    </div>
  );
}

function NavItem({ to, active, children }) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
        active ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-black/5 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

// Checks the backend now and every 15 seconds. Nothing is shown to the user
// while it is fine; a banner appears only when the server cannot be reached.
function useBackendOnline() {
  const [online, setOnline] = useState(true);

  const check = useCallback(() => {
    checkHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [check]);

  return { online, recheck: check };
}

export default function App() {
  const { pathname } = useLocation();
  const { online, recheck } = useBackendOnline();

  const studioActive = pathname === "/" || pathname.startsWith("/project/");
  const historyActive = pathname.startsWith("/history");

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-brand" aria-label="Roomora AI home">
            <Logo className="h-8 w-8" />
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Roomora
            </span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            <NavItem to="/" active={studioActive}>
              Studio
            </NavItem>
            <NavItem to="/history" active={historyActive}>
              My projects
            </NavItem>
          </nav>
        </div>
      </header>

      {!online && (
        <div role="alert" className="border-b border-red-200 bg-danger-soft">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-danger sm:px-6">
            <p>
              <span className="font-semibold">Can't reach the Roomora server.</span> Start the
              backend, then try again.
            </p>
            <button
              type="button"
              onClick={recheck}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium text-danger hover:bg-red-50"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Routes>
          <Route path="/" element={<EditorRoute />} />
          <Route path="/project/:projectId" element={<EditorRoute />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted sm:px-6">
          Roomora AI runs on your computer. Your photos stay on this machine.
        </p>
      </footer>
    </div>
  );
}