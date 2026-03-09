# Grok Scheduled Task Specification

## Purpose
This task compares dictionary index entries against detailed entries and generates missing concept content in an Ingrain-ready format.

## Inputs
1. `content/dictionary/dictionary_index.md`
2. `content/dictionary/dictionary_detail.md`
3. `ops/ingrain_export_spec.md`

## Core Rules
1. Treat `id` as the canonical key. Do not match by title alone.
2. Only process IDs that exist in `dictionary_index.md`.
3. Never invent new IDs.
4. If an ID exists in index but has no detail block, mark it as missing.
5. If a detail block exists but required fields are empty, mark it as incomplete.
6. Output must be in English only.

## Required Output Sections
Produce output in exactly two sections and keep this order:

### 1) Missing Report
Provide a markdown table with these columns:
- `id`
- `term`
- `status` (`missing` or `incomplete`)
- `reason`

### 2) Ingrain Payload
Generate import-ready payload for missing/incomplete IDs using the rules in `ops/ingrain_export_spec.md`.

## Quality Constraints
- Keep `front` concise and recall-oriented.
- Keep `back` clear and practical.
- Include one canonical example when possible.
- Include one common misuse when possible.
- Avoid unsupported factual claims.
- Avoid domain drift: stay aligned with the listed term.

## Safety and Scope
- Do not process items outside dictionary files.
- Do not rewrite existing complete entries unless asked.
- Do not add implementation commentary outside the two required output sections.

## Deterministic Output Style
- Use stable heading names exactly:
  - `## Missing Report`
  - `## Ingrain Payload`
- Keep order consistent with index file order.
