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


## What you need to do for GitHub Pages

1. Push this branch to your GitHub repository.
2. Open **Settings → Pages** and set **Build and deployment / Source** to **GitHub Actions**.
3. Open **Actions** tab and confirm `Deploy GitHub Pages` workflow succeeded at least once.
4. In **Settings → Pages**, check the published URL and open it.
5. (If private repo) ensure your plan supports Pages for private repositories.
6. After first publish, use the editor's **Commit & Publish** button; each commit to `main` triggers redeploy.

### Optional but recommended

- Add a custom domain in **Settings → Pages** if needed.
- Protect `main` branch and require workflow checks before merge.
- Rotate tokens regularly and prefer GitHub App/OAuth backend for production security.

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
