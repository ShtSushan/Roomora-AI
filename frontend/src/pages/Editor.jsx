import { useEffect, useState } from "react";
import BeforeAfter from "../components/BeforeAfter"; // NEW
import DesignSettings from "../components/DesignSettings";
import EditPanel from "../components/EditPanel";
import ImageUploader from "../components/ImageUploader";
import PromptEditor from "../components/PromptEditor";
import VersionHistory from "../components/VersionHistory";
import {
  editDesign,
  generateDesign,
  generatedDownloadUrl,
  generatedImageUrl,
  getErrorMessage,
  getProject,
  imageUrl,
  uploadImage,
} from "../services/api";

// projectId comes from the address (/project/<id>); it is undefined on a new design.
export default function Editor({ projectId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [settings, setSettings] = useState({
    roomType: "living_room",
    style: "modern",
    palette: "beige_white",
  });
  const [prompt, setPrompt] = useState("");

  // "idle" | "loading" | "uploading" | "generating" | "editing"
  const [stage, setStage] = useState(projectId ? "loading" : "idle");
  const [uploaded, setUploaded] = useState(null); // stored original
  const [versions, setVersions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [variationCount, setVariationCount] = useState(1);
  const [variations, setVariations] = useState([]);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState("slider"); // NEW: "slider" | "side"

  // Reopen a saved project: fetch it and rebuild the screen from the database.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false; // ignore the answer if the user left the page meanwhile

    getProject(projectId)
      .then((project) => {
        if (cancelled) return;

        let redesigns = 0;
        let edits = 0;
        const loaded = project.versions.map((v) =>
          v.kind === "edit"
            ? { ...v, label: `Edit ${++edits}` }
            : { ...v, label: `Redesign ${++redesigns}` }
        );

        setUploaded({ image_id: project.original_image_id });
        setVersions(loaded);
        setActiveIndex(Math.max(loaded.length - 1, 0));

        // Restore the settings of the most recent redesign into the form.
        const lastRedesign = [...project.versions]
          .reverse()
          .find((v) => v.kind === "redesign" && v.settings);
        if (lastRedesign) {
          const s = lastRedesign.settings;
          setSettings({ roomType: s.room_type, style: s.style, palette: s.palette });
          setPrompt(s.custom_prompt ?? "");
        }
        setStage("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getErrorMessage(err));
        setStage("idle");
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Choosing (or removing) a photo starts a brand-new project.
  function handleFileSelected(file) {
    setSelectedFile(file);
    setUploaded(null);
    setVersions([]);
    setActiveIndex(0);
    setStage("idle");
    setError("");
    setEditError("");
    setVariations([]);
  }

  async function handleGenerate() {
    setError("");
    setEditError("");
    setVariations([]);
    try {
      let current = uploaded;
      if (!current) {
        setStage("uploading");
        current = await uploadImage(selectedFile);
        setUploaded(current);
      }

      setStage("generating");
      const results = [];
      for (let i = 1; i <= variationCount; i++) {
        setProgress(i);
        const generated = await generateDesign({
          imageId: current.image_id,
          roomType: settings.roomType,
          style: settings.style,
          palette: settings.palette,
          prompt: prompt.trim(),
        });
        results.push({ ...generated, label: `Option ${i}` });
        setVariations([...results]);
        if (i === 1) {
          setVersions([{ ...generated, label: "Redesign" }]);
          setActiveIndex(0);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStage("idle");
    }
  }

  function handlePickVariation(variation) {
    setVersions([{ ...variation, label: "Redesign" }]);
    setActiveIndex(0);
  }

  async function handleEdit(instruction) {
    const base = versions[activeIndex];
    setEditError("");
    setStage("editing");
    try {
      const edited = await editDesign({
        generatedId: base.generated_id,
        instruction,
      });
      const editCount = versions.filter((v) => v.label.startsWith("Edit")).length;
      const next = [
        ...versions,
        { ...edited, label: `Edit ${editCount + 1}`, instruction },
      ];
      setVersions(next);
      setActiveIndex(next.length - 1);
      return true;
    } catch (err) {
      setEditError(getErrorMessage(err));
      return false;
    } finally {
      setStage("idle");
    }
  }

  const isBusy = stage !== "idle";
  // A reopened project already has its photo on the server, so no new file is needed.
  const hasPhoto = Boolean(selectedFile) || Boolean(uploaded);
  const canGenerate = hasPhoto && !isBusy;
  const active = versions[activeIndex];

  let buttonLabel = "Upload a photo to continue";
  if (hasPhoto) buttonLabel = versions.length ? "Generate a new redesign" : "Generate design";
  if (stage === "uploading") buttonLabel = "Uploading...";
  if (stage === "generating")
    buttonLabel = `Generating ${progress} of ${variationCount}... (20 to 40 seconds each)`;

  if (stage === "loading") {
    return <p className="text-center text-neutral-400">Loading project...</p>;
  }

  return (
    <>
      <main className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <section className="flex flex-col items-center gap-4">
          <ImageUploader onFileSelected={handleFileSelected} />
          {projectId && uploaded && !selectedFile && (
            <p className="max-w-xl text-center text-sm text-neutral-500">
              This is a saved project. Choose a different photo above to start a new one.
            </p>
          )}
        </section>

        <section className="flex flex-col items-center gap-6">
          <DesignSettings settings={settings} onChange={setSettings} />
          <PromptEditor value={prompt} onChange={setPrompt} />

          <div className="w-full max-w-xl">
            <p className="mb-2 text-sm font-medium text-neutral-300">Number of designs</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setVariationCount(n)}
                  aria-pressed={variationCount === n}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors disabled:opacity-60 ${
                    variationCount === n
                      ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                      : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!canGenerate}
            onClick={handleGenerate}
            className="w-full max-w-xl rounded-xl bg-indigo-500 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            {buttonLabel}
          </button>

          {error && (
            <p role="alert" className="w-full max-w-xl rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </section>
      </main>

      {active && uploaded && (
        <section className="mx-auto mt-12 flex max-w-6xl flex-col gap-6">
          <h2 className="text-xl font-semibold">Your redesign</h2>

          {/* NEW: switch between the slider and the old side-by-side view */}
          <div className="flex gap-2" role="group" aria-label="Comparison view">
            {[
              ["slider", "Slider"],
              ["side", "Side by side"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  viewMode === mode
                    ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                    : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* NEW: the comparison itself (this replaces the old two-figure block) */}
          {viewMode === "slider" ? (
            <BeforeAfter
              beforeSrc={imageUrl(uploaded.image_id)}
              afterSrc={generatedImageUrl(active.generated_id)}
              afterLabel={active.label}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <figure>
                <figcaption className="mb-2 text-sm text-neutral-400">Original</figcaption>
                <img src={imageUrl(uploaded.image_id)} alt="Original room" className="w-full rounded-lg object-contain" />
              </figure>
              <figure>
                <figcaption className="mb-2 text-sm text-neutral-400">{active.label}</figcaption>
                <img
                  src={generatedImageUrl(active.generated_id)}
                  alt={`AI design: ${active.label}`}
                  className="w-full rounded-lg object-contain"
                />
              </figure>
            </div>
          )}
           <a
            href={generatedDownloadUrl(active.generated_id)}
            className="inline-block self-start rounded-xl border border-neutral-700 px-5 py-2.5 text-sm text-neutral-200 transition-colors hover:bg-neutral-800"
            >
            Download this design
            </a>

          <details className="text-sm text-neutral-400">
            <summary className="cursor-pointer">Prompt sent to the model</summary>
            <p className="mt-2">{active.prompt_used}</p>
          </details>

          {variations.length > 1 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-300">
                Options (click one to continue editing it)
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {variations.map((v) => {
                  const chosen = versions[0]?.generated_id === v.generated_id;
                  return (
                    <button
                      key={v.generated_id}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handlePickVariation(v)}
                      aria-pressed={chosen}
                      className={`shrink-0 rounded-lg border p-1 disabled:opacity-60 ${
                        chosen ? "border-indigo-400" : "border-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      <img
                        src={generatedImageUrl(v.generated_id)}
                        alt={v.label}
                        className="h-32 w-auto rounded-md object-cover"
                      />
                      <span className="mt-1 block text-center text-xs text-neutral-300">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <VersionHistory
            versions={versions}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            disabled={isBusy}
          />

          <EditPanel
            activeLabel={active.label}
            onSubmit={handleEdit}
            busy={stage === "editing"}
          />

          {editError && (
            <p role="alert" className="rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
              {editError}
            </p>
          )}
        </section>
      )}
    </>
  );
}