# HANDOFF FOR CODEX (Target: GitHub Pages Repository)

## Purpose
This repository is deployed to **GitHub Pages** and is intended to serve a static web app (`index.html`, `styles.css`, `app.js`, and `content/`).

## Current Deployment Baseline
- Hosting: GitHub Pages
- Pages source: **GitHub Actions**
- Workflow: `.github/workflows/deploy-pages.yml`
- Artifact path: repository root (`path: .`)
- Jekyll bypass marker: `.nojekyll` (must remain present)

## Important Behavior to Preserve
1. Keep asset/script paths project-page safe:
   - Prefer relative paths (already used for local assets such as `styles.css` and `app.js`).
2. If SPA routing is introduced in the future:
   - Add a fallback strategy (for example, `404.html` redirect handling).
3. If a custom domain is used:
   - Ensure `CNAME` is committed and DNS settings are valid.

## Required Checks Before/After Deployment
1. Confirm GitHub Settings → Pages is configured for **GitHub Actions**.
2. Confirm workflow artifact path still matches expected static output.
3. Run local smoke check:
   - `python3 -m http.server 4173`
   - open `http://localhost:4173`
4. Verify in browser/devtools:
   - Top page loads without 404
   - JS/CSS/assets load correctly
   - No mixed-content/CORS errors for required resources
5. After push, confirm Actions deployment succeeded and record details below.

## Session Update (Most Recent)
- Reviewed and updated documentation (`README.md`, `HANDOFF.md`) for Pages operation clarity.
- Added/kept `.nojekyll` at repository root.
- Runtime behavior updates: path validation now enforces writes under `contentDir/` and blocks traversal/absolute paths; Base64 conversion is chunked for larger markdown stability; connecting gracefully handles missing content directories.
- UI refresh applied to `styles.css` with card-based spacing, neutral + low-saturation accent palette, stronger hierarchy for buttons/labels, and short tactile motion feedback.

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
