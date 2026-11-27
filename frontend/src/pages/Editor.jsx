import { useEffect, useRef, useState } from "react";
import BeforeAfter from "../components/BeforeAfter";
import DesignSettings from "../components/DesignSettings";
import EditPanel from "../components/EditPanel";
import GenerationProgress from "../components/GenerationProgress";
import ImageUploader from "../components/ImageUploader";
import PromptEditor from "../components/PromptEditor";
import VersionHistory from "../components/VersionHistory";
import { buttonClasses } from "../components/buttonStyles";
import { DownloadIcon } from "../components/icons";
import { Alert, Button, Segmented, Sheet, Spinner } from "../components/ui";
import { PALETTES } from "../designOptions";
import usePageTitle from "../hooks/usePageTitle";
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

const SWATCH_HEIGHTS = ["h-28", "h-36", "h-24", "h-32", "h-20", "h-28"];

// First thing a new visitor sees. The paint-chip strip ties the page to the
// colour palettes offered further down.
function Hero() {
  return (
    <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-xl">
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          See your room redesigned.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          Upload a photo, choose a style, and get a new look for the same space. Then adjust it
          with plain sentences like &ldquo;make the sofa dark grey.&rdquo;
        </p>
      </div>
      <div className="flex items-end gap-2" aria-hidden="true">
        {PALETTES.map((palette, index) => (
          <div
            key={palette.id}
            className={`flex w-10 flex-col overflow-hidden rounded-t-xl rounded-b-md ${
              SWATCH_HEIGHTS[index % SWATCH_HEIGHTS.length]
            }`}
          >
            {palette.colors.map((color) => (
              <span key={color} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [projectName, setProjectName] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [variationCount, setVariationCount] = useState(1);
  const [variations, setVariations] = useState([]);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState("slider"); // "slider" | "side"
  const resultsRef = useRef(null);

  usePageTitle(projectId ? projectName || "Project" : "Studio");

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

        setProjectName(project.name);
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

  // Brings the results into view after a design is ready.
  function scrollToResults() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(
      () =>
        resultsRef.current?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        }),
      120
    );
  }

  // Choosing (or removing) a photo starts a brand-new project.
  function handleFileSelected(file) {
    setSelectedFile(file);
    setUploaded(null);
    setProjectName(null);
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
        setVariations([...results]); // each option appears as soon as it is ready
        if (i === 1) {
          setVersions([{ ...generated, label: "Redesign" }]);
          setActiveIndex(0);
          scrollToResults();
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStage("idle");
    }
  }

  // Choosing another option starts a fresh edit history from that design.
  function handlePickVariation(variation) {
    setVersions([{ ...variation, label: "Redesign" }]);
    setActiveIndex(0);
  }

  // Returns true on success so EditPanel knows whether to clear its text box.
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
      scrollToResults();
      return true;
    } catch (err) {
      setEditError(getErrorMessage(err));
      return false;
    } finally {
      setStage("idle");
    }
  }

  const isBusy = stage !== "idle";
  const generating = stage === "uploading" || stage === "generating";
  // A reopened project already has its photo on the server, so no new file is needed.
  const hasPhoto = Boolean(selectedFile) || Boolean(uploaded);
  const canGenerate = hasPhoto && !isBusy;
  const active = versions[activeIndex];

  const pendingOption = stage === "generating" && progress > variations.length;
  const showOptions = variations.length > 1 || (variations.length >= 1 && pendingOption);

  let buttonLabel = "Add a photo to start";
  if (hasPhoto) buttonLabel = versions.length ? "Create a new design" : "Create design";
  if (stage === "uploading") buttonLabel = "Uploading photo";
  if (stage === "generating") buttonLabel = "Creating your design";

  if (stage === "loading") {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-line motion-reduce:animate-none" />
        <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <>
      {active ? (
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {projectName ?? "Your redesign"}
          </h1>
          {projectId && (
            <p className="mt-2 text-muted">
              Saved project. Change the brief and create a new design, or refine a version below.
            </p>
          )}
        </div>
      ) : (
        <Hero />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <Sheet className="lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold">Room photo</h2>
          <p className="mb-5 mt-1 text-sm text-muted">
            Start from a photo of the room you want to change.
          </p>
          <ImageUploader
            onFileSelected={handleFileSelected}
            savedImageUrl={
              projectId && uploaded && !selectedFile ? imageUrl(uploaded.image_id) : null
            }
          />
          {!hasPhoto && (
            <p className="mt-5 text-sm text-muted">
              A straight-on, well-lit photo that shows the whole room works best.
            </p>
          )}
        </Sheet>

        <Sheet>
          <h2 className="font-display text-xl font-semibold">Design brief</h2>
          <p className="mb-6 mt-1 text-sm text-muted">Choose the look you want for this room.</p>

          <div className="flex flex-col gap-7">
            <DesignSettings settings={settings} onChange={setSettings} />
            <PromptEditor value={prompt} onChange={setPrompt} />

            <hr className="border-line" />

            <div>
              <p className="text-sm font-semibold text-ink">Designs to create</p>
              <p className="mb-3 mt-1 text-sm text-muted">
                Each design takes about 20 to 40 seconds.
              </p>
              <Segmented
                label="Number of designs"
                options={[
                  { value: 1, label: "1" },
                  { value: 2, label: "2" },
                  { value: 3, label: "3" },
                ]}
                value={variationCount}
                onChange={setVariationCount}
                disabled={isBusy}
              />
            </div>

            <div className="flex flex-col gap-4">
              <Button
                size="lg"
                className="w-full"
                loading={generating}
                disabled={!generating && !canGenerate}
                onClick={handleGenerate}
              >
                {buttonLabel}
              </Button>

              <GenerationProgress
                key={progress}
                active={stage === "generating"}
                label={`Creating design ${progress} of ${variationCount}`}
              />

              {error && <Alert>{error}</Alert>}
            </div>
          </div>
        </Sheet>
      </div>

      {active && uploaded && (
        <section ref={resultsRef} className="mt-14 scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Before and after</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                label="Comparison view"
                options={[
                  { value: "slider", label: "Slider" },
                  { value: "side", label: "Side by side" },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
              <a
                href={generatedDownloadUrl(active.generated_id)}
                className={buttonClasses("secondary", "md")}
              >
                <DownloadIcon className="h-4 w-4" />
                Download
              </a>
            </div>
          </div>

          <Sheet className="p-3 sm:p-4">
            {viewMode === "slider" ? (
              <BeforeAfter
                beforeSrc={imageUrl(uploaded.image_id)}
                afterSrc={generatedImageUrl(active.generated_id)}
                afterLabel={active.label}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <figure>
                  <figcaption className="mb-2 text-sm text-muted">Original</figcaption>
                  <img
                    src={imageUrl(uploaded.image_id)}
                    alt="Original room"
                    className="w-full rounded-xl object-contain"
                  />
                </figure>
                <figure>
                  <figcaption className="mb-2 text-sm text-muted">{active.label}</figcaption>
                  <img
                    src={generatedImageUrl(active.generated_id)}
                    alt={`AI design: ${active.label}`}
                    className="w-full rounded-xl object-contain"
                  />
                </figure>
              </div>
            )}
          </Sheet>

          <details className="mt-4 text-sm text-muted">
            <summary className="cursor-pointer font-medium text-ink-soft hover:text-brand">
              Show the prompt used
            </summary>
            <p className="mt-2 max-w-3xl leading-relaxed">{active.prompt_used}</p>
          </details>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="flex flex-col gap-8">
              {showOptions && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Options</h3>
                  <p className="mb-3 mt-1 text-sm text-muted">
                    Choose the one you like best to keep editing it.
                  </p>
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
                          aria-label={`Use ${v.label}`}
                          className={`shrink-0 rounded-lg border-2 p-1 text-center transition-colors disabled:opacity-60 ${
                            chosen ? "border-brand" : "border-transparent hover:border-line-strong"
                          }`}
                        >
                          <img
                            src={generatedImageUrl(v.generated_id)}
                            alt=""
                            className="h-28 w-auto rounded-md object-cover"
                          />
                          <span
                            className={`mt-1 block text-xs ${
                              chosen ? "font-medium text-brand" : "text-muted"
                            }`}
                          >
                            {v.label}
                          </span>
                        </button>
                      );
                    })}
                    {pendingOption && (
                      <div
                        role="status"
                        className="flex h-28 w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-xs text-muted"
                      >
                        <Spinner />
                        Option {progress}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <VersionHistory
                versions={versions}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
                disabled={isBusy}
              />
            </div>

            <div className="flex flex-col gap-4">
              <EditPanel
                activeLabel={active.label}
                onSubmit={handleEdit}
                busy={stage === "editing"}
              />
              <GenerationProgress active={stage === "editing"} label="Applying your change" />
              {editError && <Alert>{editError}</Alert>}
            </div>
          </div>
        </section>
      )}
    </>
  );
}