# Roomora AI

Upload a photo of a room, pick a style, and get an AI-redesigned version of that same room. Then keep refining it with plain-language edits such as "change the chair to black leather".

Roomora AI is a personal learning and portfolio project. Everything runs **locally and for free**: no paid APIs and no cloud GPUs. The AI model runs on a 6 GB laptop GPU.

## Table of contents

1. [What it does](#1-what-it-does)
2. [How it works](#2-how-it-works)
3. [Tech stack](#3-tech-stack)
4. [Requirements](#4-requirements)
5. [Setup, step by step](#5-setup-step-by-step)
6. [Using the app](#6-using-the-app)
7. [Configuration reference](#7-configuration-reference)
8. [Project structure](#8-project-structure)
9. [Backend in detail](#9-backend-in-detail)
10. [Frontend in detail](#10-frontend-in-detail)
11. [Developing and extending](#11-developing-and-extending)
12. [Troubleshooting](#12-troubleshooting)
13. [Performance](#13-performance)
14. [Design decisions and lessons learned](#14-design-decisions-and-lessons-learned)
15. [Limitations](#15-limitations)
16. [Possible future work](#16-possible-future-work)
17. [Licences and credits](#17-licences-and-credits)

---

## 1. What it does

- **Redesign a real room.** Works on empty rooms (the AI furnishes them) and on furnished rooms.
- **Guided settings.** Room type, interior style, colour palette and an optional custom instruction.
- **Design options.** Generate 1 to 3 alternatives and continue from the one you like.
- **Edit by text.** Apply one change at a time to any version. Every version is kept.
- **Version history.** Click back to any earlier version, or branch from it.
- **Before/after slider.** Compare the original with any version, or switch to side by side.
- **Projects.** Everything is saved in a local database. Reopen a project, refresh the page, or delete a project from the History page.
- **Download** any generated design as a PNG.
- **No masks.** Users never draw anything. The model works out which object an instruction refers to.

## 2. How it works

```text
Browser (React, port 5173)
    |  upload, generate, edit, list, delete
    v
FastAPI backend (port 8000)
    |-- image service    validates and stores photos and results
    |-- prompt service   turns the selected options into one instruction
    |-- SQLite           projects and versions (a version tree)
    v
ComfyUI (local server, port 8188, one job at a time)
    v
FLUX.2 Klein 4B Distilled (FP8) on the local GPU
```

Key ideas:

- The browser never talks to the AI directly. FastAPI validates every request, builds the prompt, and asks ComfyUI to run a saved workflow.
- Only `backend/app/services/comfyui_service.py` knows about ComfyUI. The workflow is an exported JSON file, so the model can be swapped without rewriting the app.
- Each generated image is saved as a **version** that records its parent. Edits therefore form a tree, and the History page can rebuild any project exactly.
- The GPU can only run one job at a time. The backend uses a lock and answers `429` instead of queueing a second job.

### Request flow: generating a design

1. The browser sends the photo to `POST /api/upload`. The backend validates it, stores it as a PNG under a random id, and returns `image_id`.
2. The browser sends `image_id` and the settings to `POST /api/design/generate`.
3. The backend builds the prompt (`prompt_service.py`) and calls `generate_image()` (`comfyui_service.py`).
4. `generate_image()` uploads the photo to ComfyUI, loads the workflow JSON, fills in the image name, prompt and a random seed, queues the job, polls ComfyUI's history until it finishes, and downloads the result.
5. The backend re-validates the result with Pillow, saves it in `backend/generated/`, writes the database rows (creating the project if this photo is new), and returns `generated_id`.

### Request flow: editing

`POST /api/design/edit` looks up the chosen version in the database, uses that version's image as the source, and sends only the user's instruction to the model. The new image is saved as a child version.

## 3. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS (v4), React Router, Axios, ESLint |
| Backend | Python 3.11, FastAPI, Uvicorn, SQLAlchemy, Pillow, requests |
| Database | SQLite (a single file, `backend/roomora.db`) |
| AI engine | ComfyUI Desktop |
| AI model | FLUX.2 Klein 4B Distilled (FP8), Qwen 3 4B text encoder, Flux2 VAE |

## 4. Requirements

Developed and tested on **Windows 11** with an **NVIDIA RTX 4050 Laptop GPU (6 GB VRAM)** and **16 GB RAM**. Other systems may work but have not been tested.

| Requirement | Notes |
|---|---|
| NVIDIA GPU | Tested with 6 GB VRAM. Klein's published memory needs are higher, so it relies on ComfyUI moving parts of the model to system RAM |
| 16 GB RAM | The text encoder alone is about 7.5 GB |
| Python 3.11 | For the backend |
| Node.js 22 and npm | For the frontend |
| Git | To clone the repository |
| ComfyUI Desktop | Runs the model. Has its own Python environment, separate from the backend |
| About 12 GB of disk space | For the three model files |

## 5. Setup, step by step

Do the steps in order. Each ends with a check, so you know it worked before moving on.

### Step 1. Get the code

```bash
git clone https://github.com/ShtSushan/Roomora-AI.git
cd Roomora-AI
```

### Step 2. Install ComfyUI and the model

1. Install [ComfyUI Desktop](https://www.comfy.org/download) and choose the **local** setup.
2. Open **Workflow, Browse Templates, Images** and load **Flux.2 Klein 4B: Image Edit**.
3. ComfyUI lists three missing models. Download them (about 11.6 GB in total):

   | File | Size | Role |
   |---|---|---|
   | `flux-2-klein-4b-fp8.safetensors` | 3.79 GB | Diffusion model (does the editing) |
   | `qwen_3_4b.safetensors` | 7.49 GB | Text encoder (reads the prompt) |
   | `flux2-vae.safetensors` | 320 MB | VAE (converts between images and the model's internal format) |

4. Load an image in the template's Load Image node, type an instruction, and click **Run**.

**Check:** a changed image appears in the Save Image node. Leave ComfyUI running for the rest of the setup.

### Step 3. Confirm ComfyUI's address

Open http://127.0.0.1:8188/system_stats in a browser.

**Check:** you see JSON that includes your GPU's name. If the page cannot be reached, find the port ComfyUI uses and set it in `backend/app/config.py` (`COMFYUI_URL`). See [Configuration reference](#7-configuration-reference).

### Step 4. Start the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- If PowerShell blocks the activation script, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once and try again.
- On macOS or Linux, activate with `source venv/bin/activate` (not tested by the author).
- Always start `uvicorn` from inside the `backend` folder. The `app.main:app` path is relative to it.

**Check:**
- http://127.0.0.1:8000/health returns `{"status":"ok","service":"roomora-backend"}`.
- http://127.0.0.1:8000/docs shows the interactive API page.
- A file `backend/roomora.db` now exists (the database is created on first start).

### Step 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

**Check:** http://localhost:5173 loads, and the header shows **Backend: ok** in green. If it says `unreachable`, the backend is not running.

### Step 6. Test the AI connection without the website (optional but useful)

This script runs the whole backend-to-ComfyUI round trip on its own. It is the quickest way to find out whether a problem is in ComfyUI or in the app. From the `backend` folder with the venv active, and with a photo that is already in `backend/uploads/` (upload one through the website or `/docs` first):

```powershell
python scripts\test_comfyui.py uploads\<some-file>.png "Change the sofa to dark grey."
```

**Check:** it prints five numbered steps and finally `Done in ...s -> ...generated\test_xxxxxxxx.png`. Open that file to see the result.

### Setup checklist

| # | Check | Expected |
|---|---|---|
| 1 | ComfyUI template runs | An edited image appears |
| 2 | http://127.0.0.1:8188/system_stats | JSON with your GPU |
| 3 | http://127.0.0.1:8000/health | `{"status":"ok", ...}` |
| 4 | http://localhost:5173 | Header shows `Backend: ok` |
| 5 | Generate a design in the app | Result appears after 20 to 40 seconds |

## 6. Using the app

1. Choose a room photo (JPG, PNG or WEBP, up to 15 MB, at least 512 px on each side).
2. Pick the room type, style and colour palette. Optionally add an instruction. Describe what is true ("The room has solid walls with no windows") rather than what to avoid.
3. Choose how many designs you want (1 to 3) and click **Generate**. Each design takes roughly 20 to 40 seconds. The first one after starting ComfyUI is slower because the models load.
4. Use the **slider** to compare the original with the result, the **version strip** to move between versions, and the **edit box** to apply one more change.
5. Click **Download this design** to save the current version.
6. Open **History** to reopen a project or delete it.

## 7. Configuration reference

Everything configurable lives in `backend/app/config.py`, except the frontend's backend address.

| Setting | Default | Meaning |
|---|---|---|
| `UPLOAD_DIR`, `GENERATED_DIR` | `backend/uploads`, `backend/generated` | Where photos and results are stored (created automatically) |
| `ALLOWED_FORMATS` | JPEG, PNG, WEBP | Accepted image types, detected from file content |
| `MAX_UPLOAD_MB` | 15 | Largest accepted upload |
| `MIN_SIDE_PX` | 512 | Smallest accepted image side |
| `COMFYUI_URL` | `http://127.0.0.1:8188` | Where ComfyUI listens |
| `WORKFLOW_PATH` | `comfyui/workflows/klein_image_edit_api.json` | The workflow the backend sends to ComfyUI |
| `WORKFLOW_NODES` | see below | Node IDs the backend overwrites |
| `GENERATION_TIMEOUT_S` | 300 | How long to wait for one job |
| `DATABASE_URL` | `sqlite:///backend/roomora.db` | Database location |
| `COMFYUI_OUTPUT_PREFIX` | `roomora` | Name prefix of results saved by ComfyUI, so the clean-up job can recognise them |
| `COMFYUI_SHARED_DIR` | author's Windows path | ComfyUI's input and output folders. **Used only by the clean-up script.** Change it if you use that script |

Other places to know:

| File | Setting |
|---|---|
| `frontend/src/services/api.js` | `API_URL`, the backend address (default `http://127.0.0.1:8000`) |
| `backend/app/main.py` | CORS: the allowed frontend origins (`http://localhost:5173` and `http://127.0.0.1:5173`) |

### Workflow node IDs

The backend loads the workflow JSON and overwrites these entries. They are specific to the exported template.

| What | Node ID | Node type | Field changed |
|---|---|---|---|
| Input image | `76` | LoadImage | `image` |
| Prompt text | `75:74` | CLIPTextEncode | `text` |
| Seed | `75:73` | RandomNoise | `noise_seed` (new random value every run) |
| Output | `9` | SaveImage | read from; `filename_prefix` is set to `roomora` |
| Removed | `81` | LoadImage | leftover demo node, deleted before sending |

If you export a different workflow, update `WORKFLOW_NODES`.

## 8. Project structure

```text
Roomora-AI/
|-- backend/
|   |-- app/
|   |   |-- main.py                 app creation, CORS, startup, /health
|   |   |-- config.py               paths, limits, ComfyUI and database settings
|   |   |-- routes/
|   |   |   |-- upload.py           upload and serve original photos
|   |   |   |-- design.py           generate, edit, serve generated images
|   |   |   `-- projects.py         list, read, delete projects
|   |   |-- services/
|   |   |   |-- image_service.py    validate and store images
|   |   |   |-- prompt_service.py   turn selected options into a prompt
|   |   |   |-- comfyui_service.py  the only code that talks to ComfyUI
|   |   |   `-- cleanup_service.py  find unused files
|   |   `-- database/
|   |       |-- database.py         engine, sessions, table creation
|   |       `-- models.py           Project and Version tables
|   |-- scripts/
|   |   |-- test_comfyui.py         standalone AI round-trip test
|   |   `-- cleanup.py              remove unused files
|   |-- uploads/                    stored photos           (git-ignored)
|   |-- generated/                  stored results          (git-ignored)
|   |-- roomora.db                  SQLite database         (git-ignored)
|   `-- requirements.txt
|-- frontend/
|   `-- src/
|       |-- pages/                  Editor.jsx, History.jsx
|       |-- components/             ImageUploader, DesignSettings, PromptEditor,
|       |                           EditPanel, VersionHistory, BeforeAfter,
|       |                           GenerationProgress
|       |-- services/api.js         every backend call
|       |-- designOptions.js        room types, styles, palettes
|       `-- App.jsx, main.jsx, index.css
|-- comfyui/workflows/              exported ComfyUI workflow (API format)
|-- docs/                           additional documentation
`-- .gitignore
```

## 9. Backend in detail

### API

Interactive documentation is always available at http://127.0.0.1:8000/docs while the server runs.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service status |
| POST | `/api/upload` | Upload and validate a room photo |
| GET | `/api/images/{image_id}` | Stored original photo |
| POST | `/api/design/generate` | Create a redesign from a photo and settings |
| POST | `/api/design/edit` | Apply one change to an existing version |
| GET | `/api/generated/{generated_id}` | Generated image (`?download=true` to download it) |
| GET | `/api/projects` | List projects, newest first |
| GET | `/api/projects/{project_id}` | One project with all its versions |
| DELETE | `/api/projects/{project_id}` | Delete a project and its files (204) |

Examples:

```http
POST /api/upload            (multipart form, field "file")
-> { "image_id": "e9dd...", "filename": "e9dd....png", "width": 975, "height": 1300 }

POST /api/design/generate
{ "image_id": "e9dd...", "room_type": "home_office", "style": "traditional",
  "palette": "earth_green", "prompt": "The room has solid walls with no windows." }
-> { "generated_id": "696f...", "width": 768, "height": 1024,
     "prompt_used": "...", "project_id": "a1b2..." }

POST /api/design/edit
{ "generated_id": "696f...", "instruction": "Change the desk chair to black leather." }
-> { "generated_id": "c3d4...", "parent_id": "696f...", "project_id": "a1b2...",
     "width": 768, "height": 1024, "prompt_used": "..." }
```

Valid values for `room_type`, `style` and `palette` are the ids in `frontend/src/designOptions.js` and `backend/app/services/prompt_service.py`. Unknown values are rejected with `400`.

### Error responses

| Status | Meaning |
|---|---|
| 400 | Invalid input (unknown option, bad image, empty instruction) |
| 404 | Unknown id, or the file no longer exists |
| 422 | A field has the wrong format (ids must be 32 hexadecimal characters) |
| 429 | The AI is busy with another job |
| 502 | The AI engine failed. The details are printed in the backend terminal as `Generation error: ...` |
| 503 | ComfyUI is not running or not reachable |
| 504 | The AI did not finish within `GENERATION_TIMEOUT_S` |

### Upload validation

| Check | Behaviour |
|---|---|
| Content | The file is opened with Pillow, so a renamed text file is rejected whatever its extension |
| Formats | JPEG, PNG, WEBP |
| Size | At most 15 MB (reading stops one byte past the limit) and at least 512 px on each side |
| Orientation | EXIF rotation is applied, so phone photos are not sideways |
| Storage | Saved as lossless PNG under a random 32-character id. The client's file name is never used |
| Reading files back | Ids are checked against a strict pattern before any file is opened, which blocks path tricks |

### Database

SQLite through SQLAlchemy. Tables are created at startup if they do not exist.

| Table | Columns |
|---|---|
| `projects` | `id`, `name`, `original_image_id` (unique: one project per uploaded photo), `created_at`, `updated_at` |
| `versions` | `id` (the generated image's id), `project_id`, `parent_id`, `kind` (`redesign` or `edit`), `prompt_used`, `instruction`, `settings` (JSON, redesigns only), `width`, `height`, `created_at` |

- A project is created by the first successful generation for a photo and reused afterwards. Failed generations leave nothing behind.
- Deleting a project removes its rows (cascade) and then its image files.
- `create_all` never changes existing tables. During development, if you change a column, delete `backend/roomora.db` and restart. For real data, add a migration tool such as Alembic first.

### Prompt construction

`prompt_service.py` builds the text sent to the model.

- A **redesign** prompt combines the room type, style and palette, a sentence that protects the room's existing structure, the user's own text, and a realism sentence. The user's text comes last so it has the final word.
- An **edit** prompt is the user's instruction plus a sentence saying to change only what was described.

### Housekeeping script

Unused files accumulate: photos that never led to a generation, old test images, and the copies ComfyUI keeps of every input and output. The clean-up job removes them safely. From the `backend` folder with the venv active:

```powershell
python -m scripts.cleanup            # dry run: lists what would be deleted
python -m scripts.cleanup --apply    # deletes it
python -m scripts.cleanup --hours 1  # change the 24-hour grace period
```

Safety rules: it never deletes files newer than the grace period, never touches files that do not match this app's naming, and never deletes anything a project still references.

## 10. Frontend in detail

| File | Purpose |
|---|---|
| `App.jsx` | Header, navigation and routes (`/`, `/project/:projectId`, `/history`) |
| `pages/Editor.jsx` | The main screen: holds all state for uploading, generating, editing and variations; reloads a saved project when opened by address |
| `pages/History.jsx` | Lists saved projects with thumbnails; open and delete (with confirmation) |
| `components/ImageUploader.jsx` | Drag-and-drop upload with preview and instant checks |
| `components/DesignSettings.jsx` | Chip selectors and palette cards |
| `components/PromptEditor.jsx` | Optional instruction box (500 characters) |
| `components/EditPanel.jsx` | Edit instruction box and button |
| `components/VersionHistory.jsx` | Thumbnails of every version |
| `components/BeforeAfter.jsx` | Comparison slider (a clipped image plus a transparent range input) |
| `components/GenerationProgress.jsx` | Timer and moving bar while the AI works |
| `services/api.js` | Every call to the backend, plus a helper that turns errors into readable messages |
| `designOptions.js` | The room types, styles and palettes shown in the UI |

Notes:

- Browser-side checks are only a convenience. The backend always validates again.
- Variations are requested one after another, not in parallel, because the GPU runs one job at a time.
- A saved project has its own address (`/project/<id>`), so refreshing the page keeps you in the same project.

## 11. Developing and extending

### Add a style, room type or palette

1. Add it to `frontend/src/designOptions.js` (`id` and `label`; palettes also need two `colors`).
2. Add the same `id` and a plain-language name to the matching dictionary in `backend/app/services/prompt_service.py`.

Both places must match. The backend rejects ids it does not know.

### Use a different model or workflow

1. Build and test the workflow in ComfyUI.
2. Use **Export (API)** and save it in `comfyui/workflows/`.
3. Open the JSON, find the node IDs for the image, prompt text, seed and output, and update `WORKFLOW_PATH` and `WORKFLOW_NODES` in `config.py`.
4. Run `scripts/test_comfyui.py` to check the connection before using the website.

Nothing else in the app needs to change, because only `comfyui_service.py` knows about ComfyUI.

### Replace ComfyUI altogether

Keep the single function `generate_image(source_path, prompt) -> bytes` and the exception types in `comfyui_service.py`. The rest of the app depends only on those.

### Add an API endpoint

Create or extend a file in `backend/app/routes/` and register the router in `main.py` with `app.include_router(...)`.

### Working rules used in this project

- Run `git status` from the project root before every commit. Never commit `venv`, `node_modules`, `.env` files, model files, photos, generated images or `roomora.db`.
- Keep ComfyUI's Python environment and the backend's virtual environment separate.
- Validate every id and every upload on the server.
- Write prompts that describe what is true. Never let fixed prompt text contradict the user's request.

## 12. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Header shows `Backend: unreachable` | The backend is not running, or the frontend's `API_URL` is wrong |
| Browser console shows a CORS error | The frontend is served from an address not listed in `main.py`. Add it to `allow_origins` |
| `No module named app` when starting uvicorn | Start it from inside the `backend` folder |
| `No module named scripts` | Run the script from the `backend` folder, and make sure `backend/scripts/__init__.py` exists |
| Error `503` "The AI engine is not running" | Start ComfyUI Desktop. If it is running, check its port and `COMFYUI_URL` |
| Error `429` "The AI is busy" | Another generation is running. Wait for it to finish |
| Error `502` | Read the backend terminal for `Generation error:`. A message starting "ComfyUI rejected the job" usually means a missing model file or a node ID that does not match the workflow |
| First generation is very slow | Normal. The models load into memory. Later runs are faster |
| Out of GPU memory | Close other programs that use the GPU. The workflow scales the input to about 1 megapixel in its scaling node; lowering that value should reduce memory use (not tested) |
| Image appears as "not found" after clean-up | The file was removed by hand or by an earlier test. Projects in the database are protected by the clean-up job |
| Database errors after changing a model class | Delete `backend/roomora.db` and restart (development only) |
| PowerShell will not activate the venv | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once |
| Commands fail with "not recognized" | You are probably in Command Prompt instead of PowerShell. PowerShell prompts start with `PS` |

## 13. Performance

Measured on the test machine described in [Requirements](#4-requirements):

| Measurement | Result |
|---|---|
| Time per image, models already loaded | about 19 to 30 seconds |
| First image after starting ComfyUI | about 34 to 36 seconds |
| Peak VRAM | about 5.1 GB of 6 GB (sampled once per second with `nvidia-smi`) |
| VRAM held after a job | about 3.2 GB (the models stay cached) |

To measure on your own machine, run `nvidia-smi -l 1` in a terminal during a generation and note the highest memory value.

## 14. Design decisions and lessons learned

- **SDXL was tried first and dropped.** Plain image-to-image either kept the old furniture or lost the room's layout, and masked inpainting does not fit a product where users never draw masks. An instruction-based model (FLUX.2 Klein) handles both full redesigns and single edits from plain text.
- **Prompt wording matters.** A fixed sentence saying "keep the windows and doors" made the model add doors to a room that had none, because it contradicted the user's request. The structure-protecting sentence is now generic, and the user's own text comes last.
- **The distilled model runs at cfg 1,** so negative phrasing ("do not add...") is weak. Describing the desired state works better.
- **One GPU job at a time.** A lock plus a `429` response protects the 6 GB card, instead of letting requests pile up.
- **The AI engine is swappable.** One service file and one workflow file are all that connect the app to ComfyUI.
- **Honest progress feedback.** The app shows a timer and a moving bar, not a fake percentage, because ComfyUI progress is not streamed to the browser.
- **Safe file handling.** Content-based validation, random ids, strict id patterns, and a clean-up job that defaults to a dry run.

## 15. Limitations

- Preserving the room's architecture is not guaranteed. In one empty-room test the model added doors that were not in the photo; changing the prompt wording was the fix.
- Only a small number of rooms have been tested, so results on other photos may differ.
- Edits were checked over a few consecutive passes. Longer chains have not been systematically tested, and quality could drift.
- Designed for one local user: no authentication, and only one generation runs at a time.
- Several photos of the same room are not supported.
- Tested on one hardware and operating system setup.

## 16. Possible future work

- Multiple photos of one room with a consistent design across angles. Klein accepts several reference images, but keeping camera angles consistent has not been tested.
- Depth guidance (ControlNet) if structure drift proves to be a problem.
- Automatic object selection for more precise edits.
- Database migrations (Alembic) and scheduled clean-up.
- Mobile layout and accessibility review.

## 17. Licences and credits

- FLUX.2 Klein 4B is published by Black Forest Labs under the Apache 2.0 licence. Check the licence of every model file before redistributing it. This repository contains no model weights.
- Built with ComfyUI, FastAPI, React, Vite, Tailwind CSS, SQLAlchemy and Pillow.
- No licence has been chosen for this repository's code yet. Until a `LICENSE` file is added, all rights are reserved by the author.