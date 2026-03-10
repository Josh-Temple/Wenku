# HANDOFF FOR CODEX (Target: GitHub Pages Repository)

## Purpose
This repository serves as a **viewer-first Markdown surface** on GitHub Pages.
It is intended to display content that may be written by another note app via GitHub App integration, while keeping optional in-place editing for fallback/manual updates.

## Current Product Policy
1. Default mode is **View mode**.
2. Editing is a secondary operation and must be explicitly enabled.
3. Keep the page structure optimized for:
   - Human reading
   - Fast navigation by document list
   - AI-friendly references (path/blob/raw links for each active document)
   - AI-readable structure (outline + AI Context JSON)

## Current Deployment Baseline
- Hosting: GitHub Pages
- Pages source: **GitHub Actions**
- Workflow: `.github/workflows/deploy-pages.yml`
- Artifact path: repository root (`path: .`)
- Jekyll bypass marker: `.nojekyll` (must remain present)

## Important Behavior to Preserve
1. Keep asset/script paths project-page safe:
   - Prefer relative paths for local assets.
2. Keep viewer-first hierarchy:
   - Document list + main preview are primary.
   - Editor pane is optional and hidden until edit mode is enabled.
3. Preserve reference context and AI context sections:
   - Path
   - Blob URL
   - Raw URL
   - Document outline generated from headings
   - AI Context JSON copy payload
4. Keep path validation strict:
   - File operations must stay under configured `contentDir/`.
   - Block traversal / absolute-like paths.
5. Dark mode contrast must remain readable:
   - Primary/secondary button foreground/background contrast
   - Accent button label readability (`New`, `Commit & Publish`)
   - Link readability in outline/meta cards

## Required Checks Before/After Deployment
1. Confirm GitHub Settings → Pages is configured for **GitHub Actions**.
2. Confirm workflow artifact path still matches expected static output.
3. Run local smoke check:
   - `python3 -m http.server 4173`
   - open `http://localhost:4173`
4. Verify in browser/devtools:
   - Top page loads without 404
   - JS/CSS/assets load correctly
   - View/Edit mode toggle behavior works
   - Reference context links update with active document
   - Outline and AI Context JSON update after document changes
   - Dark mode contrast is readable for buttons and links
5. After push, confirm Actions deployment succeeded and record details below.

## Session Update (Most Recent)
- Updated product direction to viewer-first with optional editing.
- Reworked layout to prioritize document reading and added explicit mode badge/toggle.
- Added reference context card with active path + blob/raw URLs for AI and external link sharing.
- Added heading-based outline and copyable AI Context JSON snapshot for easier external AI grounding.
- Updated README and HANDOFF to reflect integration model (external note app writes, Wenku displays).
- Adjusted dark mode tokens for safer button/link contrast in viewer controls and docs.

- Documented Grok ingestion URL decision guidance (Pages-optimized > raw > blob) in README.
- Added policy note for latest-vs-reproducible URL selection (branch URL vs commit permalink).

- Reworked `grok-dictionary-index.html` into a build-generated static snapshot so the first HTML response already contains all dictionary entries and JSON (no JS fetch dependency).
- Added `scripts/build_grok_dictionary_index.mjs` to parse `content/dictionary/dictionary_index.md`, preserve order, emit stable `BEGIN_ENTRY ... END_ENTRY` blocks, and fail loudly on malformed/empty-parsed input.
- Updated `.github/workflows/deploy-pages.yml` to run the generator before uploading the Pages artifact.
- Kept the top-header shortcut link (`Grok Index Page`) from `index.html` to the snapshot page.

## Deployment Record Template (update every release)
- Deployed URL:
- Deployed commit SHA:
- Base-path/routing adjustments:
- Known limitations:
- Follow-up tasks:

## Rollback Plan
- Revert to the last known-good deployment commit.
- Re-run Pages deployment via push or manual workflow dispatch.
- Document root cause and preventive fix in the next PR.

## Dictionary Pipeline Handoff Notes
- Added dictionary workflow files for scheduled AI enrichment:
  - `content/dictionary/dictionary_index.md`
  - `content/dictionary/dictionary_detail.md`
  - `ops/grok_task_spec.md`
  - `ops/ingrain_export_spec.md`
- Grok scheduled task should read the two dictionary files and both `ops/` specs.
- Grok output contract must remain exactly two sections:
  1. `## Missing Report`
  2. `## Ingrain Payload`
- Canonical matching key is `id`; do not rely on term text matching only.
- Keep all generated payload text in English (UI/content policy alignment for Ingrain).
- Before release, validate that each ID in `dictionary_index.md` has a corresponding detail block in `dictionary_detail.md`.

