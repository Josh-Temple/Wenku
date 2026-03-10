# Wenku

Wenku is a GitHub Pages-ready **viewer-first** Markdown publishing repository with an optional in-browser editor.

## Product direction

- **Primary role: Viewer**
  - Wenku should be optimized for reading and referencing Markdown notes published in this repository.
- **Secondary role: Editor (optional)**
  - Editing is available only when explicitly enabled in the UI.
- **Integration model**
  - Another note app (in a different repository) can write Markdown files into this repository via a GitHub App installation token.
  - Wenku focuses on rendering and lightweight fallback edits when needed.
- **AI reference use case**
  - The page includes a reference context block (path/blob/raw links), a generated document outline, and an AI Context JSON snapshot so external AI systems (e.g. Grok) can consume/share canonical source links plus structure.

## What this project does

- Manages **multiple Markdown documents** under a content directory (default: `content/`).
- Renders Markdown preview with:
  - GitHub Flavored Markdown (GFM)
  - Syntax highlighting
  - Mermaid diagrams
- Supports **Light / Dark / System** themes.
- Commits edited Markdown directly to GitHub using the REST API (with a token that has repository read/write access).

## Repository structure

- `index.html` - Viewer-first UI for repository connection, document list, reference context, outline, AI context JSON, preview, and optional editor.
- `app.js` - GitHub API integration + markdown rendering + mode control (view/edit) + reference context/outline/AI context generation.
- `styles.css` - Responsive layout and light/dark styles with viewer emphasis.
- `content/` - Markdown documents to publish.
- `.github/workflows/deploy-pages.yml` - GitHub Pages deployment workflow.

## Viewer-first UX

1. Connect to a target repository and content directory.
2. Browse documents from the left-side list.
3. Read rendered Markdown in the main viewer panel.
4. Use **Reference Context** links (path/blob/raw) when sharing content with external agents.
5. Enable editing only when you need emergency/manual edits.


## AI-friendly page composition

The viewer now surfaces three machine/helpful context layers above the rendered markdown:

1. **Reference Context**: canonical `path`, `blob`, and `raw` links.
2. **Document Outline**: heading-based structure for fast navigation and chunking.
3. **AI Context (JSON)**: compact snapshot (mode/repo/path/title/headings/links) that can be copied and passed to external AI agents.

## Publish on GitHub Pages

1. Push this repository to GitHub.
2. In **Settings → Pages**, ensure source is **GitHub Actions**.
3. The workflow `.github/workflows/deploy-pages.yml` deploys the repository content to Pages on push to `main`.
4. Keep `.nojekyll` in the repository root (empty file) so Pages serves the static site without Jekyll processing side effects.
5. For project pages (`https://<user>.github.io/<repo>/`), keep local asset paths relative (or explicitly prefixed with `/<repo>/`).
6. Keep `HANDOFF.md` updated after each deployment cycle.

## Use the editor (optional)

1. Open the Pages URL (or local `index.html`).
2. Fill in Owner / Repository / Branch / Content Directory / GitHub token.
3. Click **Connect**.
4. Keep using **View mode** for regular operations.
5. Click **Enable Editing** only when you need to edit and commit.

> Security note: token is stored in browser `localStorage` for convenience in this MVP. For production, use a GitHub App/OAuth token exchange backend and avoid persisting long-lived tokens in the browser.

## Local preview

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

To regenerate the static Grok index page locally:

```bash
node scripts/build_grok_dictionary_index.mjs
```


## Accessibility and dark mode contrast

- Dark mode button/link colors are tuned to avoid low-contrast combinations (especially primary button foreground/background).
- When changing theme tokens, verify readable contrast for:
  - Primary and secondary buttons
  - Accent buttons (`New`, `Commit & Publish`)
  - Link text in cards and outline
- Run a quick visual check in both Light and Dark theme before release.

## Dictionary pipeline for Grok and Ingrain

This repository now includes a dictionary workflow designed for scheduled AI enrichment and flashcard export.

- `content/dictionary/dictionary_index.md`
  - Canonical term registry (`id` + `term` only).
- `content/dictionary/dictionary_detail.md`
  - Structured details per term.
- `ops/grok_task_spec.md`
  - Fixed instructions for Grok scheduled tasks (missing/incomplete detection + payload generation).
- `ops/ingrain_export_spec.md`
  - Output contract for Ingrain-ready card payloads.

### Recommended operating flow

1. Keep `dictionary_index.md` updated with approved IDs and terms.
2. Run the Grok scheduled task with both dictionary files plus the two `ops/` specs.
3. Review Grok output (Missing Report + Ingrain Payload).
4. Apply approved updates to `dictionary_detail.md` and import payload files as needed.
5. Re-run a quick consistency check: every index ID should exist in detail with required fields.


### Grok-friendly dictionary index page

- Added `grok-dictionary-index.html` as a machine-friendly snapshot view for `content/dictionary/dictionary_index.md`.
- The page is generated at build/deploy time from `content/dictionary/dictionary_index.md` (no runtime fetch for core content).
- Initial HTML already includes stable `BEGIN_ENTRY ... END_ENTRY` blocks plus a JSON snapshot (`<script type="application/json">` + visible `<pre>`).
- Generator script: `scripts/build_grok_dictionary_index.mjs` (fails loudly on malformed/empty-parsed source).
- The top page (`index.html`) now includes a **Grok Index Page** link in the header for direct navigation.

## Grok ingestion URL strategy (guidance)

When deciding which URL Grok should read, prefer this order:

1. **GitHub Pages (LLM-optimized single page)**
   - Best when you can publish a slim, deterministic page specifically for machine ingestion.
   - Keep only required fields, fixed section markers, and minimal/no JavaScript.
2. **GitHub raw file URL**
   - Best for quickly feeding canonical source markdown/text with minimal UI noise.
   - Good default for immediate trials against `dictionary_index.md` or `dictionary_detail.md`.
3. **GitHub blob page URL**
   - Avoid when possible; includes human UI chrome and extra page noise.

Versioning policy:

- Use branch-based URLs (`main`) when Grok should read the latest state.
- Use commit-fixed permalinks when reproducibility is required.
