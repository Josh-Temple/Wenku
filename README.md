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


## Accessibility and dark mode contrast

- Dark mode button/link colors are tuned to avoid low-contrast combinations (especially primary button foreground/background).
- When changing theme tokens, verify readable contrast for:
  - Primary and secondary buttons
  - Accent buttons (`New`, `Commit & Publish`)
  - Link text in cards and outline
- Run a quick visual check in both Light and Dark theme before release.
