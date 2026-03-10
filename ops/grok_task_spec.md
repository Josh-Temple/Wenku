# Grok Scheduled Task Specification

## Purpose
Generate candidate Wenku dictionary terms for a user-specified domain while excluding terms that are already adopted.

## Inputs
1. Published `grok-dictionary-index.html` page
2. Domain prompt (example: behavioral economics, learning science, neuroscience)

## Core Rules
1. Treat the published index page as the exclusion source of truth.
2. Extract existing terms from the page before generating candidates.
3. Do not return a candidate if its term already appears in the adopted list.
4. Focus only on the requested domain.
5. Output must be in English only.

## Output
Return a concise candidate list for human review. Each candidate should include:
- `term`
- short rationale for why it fits the requested domain

## Safety and Scope
- Do not compare repository files for missing or incomplete entries.
- Do not require `dictionary_detail.md` for scheduled generation.
- Human review decides what gets accepted and added to `dictionary_index.md`.
