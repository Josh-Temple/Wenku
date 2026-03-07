# Wenku

Wenku is a GitHub Pages-ready Markdown publishing repository with an in-browser editor.

## What this project does

- Manages **multiple Markdown documents** under a content directory (default: `content/`).
- Renders Markdown preview with:
  - GitHub Flavored Markdown (GFM)
  - Syntax highlighting
  - Mermaid diagrams
- Supports **Light / Dark / System** themes.
- Commits edited Markdown directly to GitHub using the REST API (with a token that has repository read/write access).

## Repository structure

- `index.html` - UI for repository connection, document list, editor, and preview.
- `app.js` - GitHub API integration + Markdown rendering + theme handling.
- `styles.css` - Responsive layout and light/dark styles.
- `content/` - Markdown documents to publish.
- `.github/workflows/deploy-pages.yml` - GitHub Pages deployment workflow.

## Publish on GitHub Pages

1. Push this repository to GitHub.
2. In **Settings → Pages**, ensure source is **GitHub Actions**.
3. The workflow `.github/workflows/deploy-pages.yml` deploys the repository content to Pages on push to `main`.
4. Keep `.nojekyll` in the repository root (empty file) so Pages serves the static site without Jekyll processing side effects.
5. For project pages (`https://<user>.github.io/<repo>/`), keep local asset paths relative (or explicitly prefixed with `/<repo>/`).
6. Keep `HANDOFF.md` updated after each deployment cycle for the next session.

## Use the editor

1. Open the Pages URL (or local `index.html`).
2. Fill in:
   - Owner
   - Repository
   - Branch (e.g. `main`)
   - Content Directory (e.g. `content`)
   - GitHub token with repository read/write permissions
3. Click **Connect** to load markdown documents.
4. Edit content and click **Commit & Publish**.

> Security note: token is stored in browser `localStorage` for convenience in this MVP. For production, use a GitHub App/OAuth token exchange backend and avoid persisting long-lived tokens in the browser.

## Supported Markdown capabilities

- Headings, lists, tables, blockquotes
- Fenced code blocks with highlighting
- Mermaid blocks using:

~~~markdown
```mermaid
flowchart LR
  A --> B
```
~~~

## Local preview

You can serve locally with:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Refactoring notes

- `app.js` was refactored to improve maintainability by separating concerns into smaller functions (bootstrap, config, GitHub API, rendering, and document operations).
- Deprecated `escape` / `unescape` based Base64 conversion was replaced with `TextEncoder` / `TextDecoder` implementations for Unicode-safe encoding and decoding.
- Event handling now uses a shared error wrapper for cleaner async error reporting.
- File save/load path validation (must stay under configured content directory and avoid traversal patterns).
- Unicode-safe Base64 handling uses chunked conversion for better stability with larger markdown files.


## UI notes

- The UI styling follows an "Engineered Play & Logic" direction: card-based layout, neutral base colors, low-saturation accents, and short interaction feedback transitions.
- Primary actions use darker/accent emphasis, while secondary actions use white surfaces with subtle borders for hierarchy.
