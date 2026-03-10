import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE_PATH = 'content/dictionary/dictionary_index.md';
const OUTPUT_PATH = 'grok-dictionary-index.html';
const REPOSITORY = process.env.GITHUB_REPOSITORY || 'Josh-Temple/Wenku';
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
    repository: REPOSITORY,
    source_path: SOURCE_PATH,
    entry_count: entries.length,
    format_version: FORMAT_VERSION,
  };

  const payload = {
    format_version: FORMAT_VERSION,
    generated_at: GENERATED_AT,
    repository: REPOSITORY,
    source_path: SOURCE_PATH,
    entry_count: entries.length,
    entries,
  };

  const jsonText = JSON.stringify(payload, null, 2)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
  const visibleJson = jsonText
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  const stableBlocks = entries
    .map(({ id, term }) => `BEGIN_ENTRY\nid: ${escapeHtml(id)}\nterm: ${escapeHtml(term)}\nEND_ENTRY`)
    .join('\n\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wenku Adopted Dictionary Terms (Grok Exclusion List)</title>
  </head>
  <body>
    <main>
      <h1>Wenku Adopted Dictionary Terms</h1>
      <p>This page is the adopted Wenku dictionary term list for AI exclusion checks.</p>
      <p>Grok scheduled tasks should extract terms from this page and avoid proposing terms already listed here.</p>

      <h2>Meta</h2>
      <ul>
        <li>generated_at: ${escapeHtml(meta.generated_at)}</li>
        <li>repository: ${escapeHtml(meta.repository)}</li>
        <li>source_path: ${escapeHtml(meta.source_path)}</li>
        <li>entry_count: ${meta.entry_count}</li>
        <li>format_version: ${meta.format_version}</li>
      </ul>

      <section aria-labelledby="entries-heading">
        <h2 id="entries-heading">Adopted Entries</h2>
        ${entries
          .map(
            ({ id, term }) => `<article class="entry" data-entry-id="${escapeHtml(id)}">
          <h3>${escapeHtml(term)}</h3>
          <dl>
            <dt>ID</dt>
            <dd>${escapeHtml(id)}</dd>
            <dt>Term</dt>
            <dd>${escapeHtml(term)}</dd>
          </dl>
        </article>`
          )
          .join('\n        ')}
      </section>

      <h2>Stable Entry Blocks</h2>
      <pre>${stableBlocks}</pre>

      <h2>JSON Snapshot</h2>
      <script id="dictionary-json" type="application/json">${jsonText}</script>
      <pre><code>${visibleJson}</code></pre>
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
