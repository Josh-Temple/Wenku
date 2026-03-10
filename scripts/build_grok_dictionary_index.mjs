import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE_PATH = 'content/dictionary/dictionary_index.md';
const OUTPUT_PATH = 'grok-dictionary-index.html';
const GENERATED_AT = new Date().toISOString();
const FORMAT_VERSION = 2;

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseEntries(markdown) {
  const lines = markdown.split(/\r?\n/);
  const entries = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- id:')) {
      continue;
    }

    const match = /^- id:\s*([^|]+?)\s*\|\s*term:\s*(.+)\s*$/i.exec(trimmed);
    if (!match) {
      throw new Error(`Malformed dictionary entry line: ${line}`);
    }

    const id = match[1].trim();
    const term = match[2].trim();
    if (!id || !term) {
      throw new Error(`Dictionary entry missing id or term: ${line}`);
    }

    entries.push({ id, term });
  }

  return entries;
}

function buildHtml(entries) {
  const meta = {
    generated_at: GENERATED_AT,
    source_path: SOURCE_PATH,
    entry_count: entries.length,
    format_version: FORMAT_VERSION,
  };

  const payload = {
    format_version: FORMAT_VERSION,
    generated_at: GENERATED_AT,
    source_path: SOURCE_PATH,
    entry_count: entries.length,
    entries,
  };

  const jsonText = JSON.stringify(payload, null, 2)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
  const stableBlocks = entries
    .map(({ id, term }) => `BEGIN_ENTRY\nid: ${escapeHtml(id)}\nterm: ${escapeHtml(term)}\nEND_ENTRY`)
    .join('\n\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wenku Adopted Dictionary Terms (Grok Exclusion List)</title>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.5;
        color: #111827;
        background: #ffffff;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
        padding: 1.5rem 1rem 2rem;
      }
      h1,
      h2 {
        line-height: 1.25;
      }
      pre {
        margin: 0;
        padding: 1rem;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        white-space: pre-wrap;
      }
      ul {
        margin-top: 0.5rem;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Wenku Adopted Dictionary Terms</h1>
      <p>This page is the canonical adopted Wenku dictionary term list used as an AI exclusion list.</p>

      <h2>Meta</h2>
      <ul>
        <li>generated_at: ${escapeHtml(meta.generated_at)}</li>
        <li>source_path: ${escapeHtml(meta.source_path)}</li>
        <li>entry_count: ${meta.entry_count}</li>
        <li>format_version: ${meta.format_version}</li>
      </ul>

      <h2>Stable Entry Blocks</h2>
      <pre>${stableBlocks}</pre>

      <script id="dictionary-json" type="application/json">${jsonText}</script>
    </main>
  </body>
</html>
`;
}

const source = readFileSync(SOURCE_PATH, 'utf8');
const entries = parseEntries(source);

if (entries.length === 0 && source.trim().length > 0) {
  throw new Error(`No dictionary entries found in ${SOURCE_PATH}; refusing to publish an empty snapshot.`);
}
const html = buildHtml(entries);
writeFileSync(OUTPUT_PATH, html, 'utf8');

console.log(`Generated ${OUTPUT_PATH} with ${entries.length} entries from ${SOURCE_PATH}.`);
