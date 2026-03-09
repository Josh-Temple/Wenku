# Ingrain Export Specification for Dictionary Pipeline

## Goal
Define a stable output format that Grok can generate and Codex can apply with minimal editing.

## Primary Format
Use Markdown cards with YAML front matter.

## Card Template
```markdown
---
deck: "Concepts"
tags: ["dictionary", "{{domain_slug}}", "{{id_slug}}"]
concept_domain: "{{domain}}"
concept_one_liner: "{{one_liner_definition}}"
concept_proposer: "{{proposer_or_empty}}"
concept_year: "{{year_or_empty}}"
canonical_example: "{{canonical_example}}"
counter_example: "{{counter_example_or_empty}}"
common_misuse: "{{common_misuse}}"
contrast_points: "{{contrast_points_or_empty}}"
evidence_level: "{{evidence_level_or_empty}}"
sources: ["{{source_1_or_empty}}"]
confusion_cluster: ["{{related_concept_1_or_empty}}"]
source_id: "{{id}}"
source_term: "{{term}}"
---

## Front
{{term}} — core recall

## Back
Definition: {{clear_definition}}

Why it matters: {{practical_relevance}}

Canonical example: {{canonical_example}}

Common misuse: {{common_misuse}}
```

## Delimiter Rule
Use `===` between cards.

## Field Rules
- `deck`, `source_id`, and `source_term` are required.
- `front` and `back` are required.
- Keep `front` under 90 characters when possible.
- Keep `back` under 1200 characters.
- Use plain English and avoid unexplained abbreviations.

## Fallback Rules
- If `proposer` or `year` is unknown, use empty string.
- If no reliable source is available, keep `sources` as an empty list.
- If no meaningful counter-example exists, use empty string.

## Optional Compatibility Format
If explicitly requested, output JSON Lines with fields:
- `deck`
- `front`
- `back`
- `source_id`
- `source_term`
- `concept_domain`
