# Grok Scheduled Task Specification

## Purpose
Generate a small list of new Wenku dictionary term candidates for a requested domain, while excluding already adopted terms.

## Inputs
1. Published `grok-dictionary-index.html` page
2. Domain prompt (for example: behavioral economics, learning science, neuroscience)

## Task Behavior
1. Read the published adopted-term page.
2. Extract adopted terms from stable `BEGIN_ENTRY ... END_ENTRY` blocks and/or the JSON snapshot.
3. Treat extracted terms as the exclusion list.
4. Propose only new candidates relevant to the requested domain.
5. Keep output concise and in English.

## Output Format
Return a limited candidate list for human review. For each candidate include:
- `term`
- short rationale for domain relevance

## Scope Boundaries
- Do not perform missing/incomplete detection.
- Do not compare repository files.
- Do not require `dictionary_detail.md` during scheduled runs.
- Human review decides acceptance; accepted terms are then added to `dictionary_index.md`.
