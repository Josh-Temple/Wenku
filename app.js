const STORAGE_KEY = 'wenku.github.config.v1';
const DEFAULT_CONTENT_DIR = 'content';
const DEFAULT_BRANCH = 'main';
const DEFAULT_THEME = 'system';
const BASE64_CHUNK_SIZE = 0x8000;

const DEFAULT_DOC = `# Welcome to Wenku\n\n- Viewer-first reading experience\n- Optional editing mode when needed\n- Markdown + Mermaid + syntax highlight\n\n\`\`\`mermaid\nflowchart LR\n  A[Notes App/GitHub App writes to repo] --> B[Wenku displays content]\n  B --> C[Optional edits in Wenku]\n\`\`\`\n`;

const state = {
  docs: [],
  activePath: '',
  theme: DEFAULT_THEME,
  isEditEnabled: false,
  headings: []
};

const elements = getElements();
const prefersDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');
const hasMarked = typeof window.marked !== 'undefined';
const hasHighlightJs = typeof window.hljs !== 'undefined';
const hasMermaid = typeof window.mermaid !== 'undefined';

configureMarkdown();
bindEvents();
bootstrap();

function getElements() {
  return {
    ownerInput: document.getElementById('ownerInput'),
    repoInput: document.getElementById('repoInput'),
    branchInput: document.getElementById('branchInput'),
    contentDirInput: document.getElementById('contentDirInput'),
    tokenInput: document.getElementById('tokenInput'),
    connectBtn: document.getElementById('connectBtn'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    statusMsg: document.getElementById('statusMsg'),
    docList: document.getElementById('docList'),
    newDocBtn: document.getElementById('newDocBtn'),
    pathInput: document.getElementById('pathInput'),
    commitMessageInput: document.getElementById('commitMessageInput'),
    loadDocBtn: document.getElementById('loadDocBtn'),
    saveDocBtn: document.getElementById('saveDocBtn'),
    toggleEditBtn: document.getElementById('toggleEditBtn'),
    modeBadge: document.getElementById('modeBadge'),
    editorPane: document.getElementById('editorPane'),
    editor: document.getElementById('editor'),
    preview: document.getElementById('preview'),
    outlineList: document.getElementById('outlineList'),
    aiContextJson: document.getElementById('aiContextJson'),
    copyAiContextBtn: document.getElementById('copyAiContextBtn'),
    themeSelect: document.getElementById('themeSelect'),
    hljsLight: document.getElementById('hljs-light'),
    hljsDark: document.getElementById('hljs-dark'),
    contextPath: document.getElementById('contextPath'),
    contextBlob: document.getElementById('contextBlob'),
    contextRaw: document.getElementById('contextRaw')
  };
}

function configureMarkdown() {
  if (!hasMarked) {
    console.warn('marked is not loaded. Preview will use plain-text fallback.');
    return;
  }

  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
    highlight(code, lang) {
      if (!hasHighlightJs) {
        return code;
      }

      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  });

  if (hasMermaid) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict'
    });
  }
}

function bindEvents() {
  elements.saveConfigBtn.addEventListener('click', saveConfig);
  elements.connectBtn.addEventListener('click', withStatus(connectRepository));
  elements.loadDocBtn.addEventListener('click', withStatus(() => loadDocument(getPathInputValue())));
  elements.saveDocBtn.addEventListener('click', withStatus(saveDocument));
  elements.newDocBtn.addEventListener('click', createNewDocumentTemplate);
  elements.toggleEditBtn.addEventListener('click', toggleEditMode);
  elements.copyAiContextBtn.addEventListener('click', withStatus(copyAiContextJson));
  elements.editor.addEventListener('input', () => {
    void renderPreview();
  });

  elements.themeSelect.addEventListener('change', () => {
    state.theme = elements.themeSelect.value || DEFAULT_THEME;
    applyTheme(state.theme);
    saveConfig();
  });

  prefersDarkMedia.addEventListener('change', () => {
    if ((elements.themeSelect.value || DEFAULT_THEME) === DEFAULT_THEME) {
      applyTheme(DEFAULT_THEME);
    }
  });
}

function bootstrap() {
  loadConfig();
  if (!elements.editor.value) {
    elements.editor.value = DEFAULT_DOC;
  }
  updateEditModeUi();
  updateReferenceContext();
  updateAiContextCard();
  applyTheme(elements.themeSelect.value || DEFAULT_THEME);
  void renderPreview();
}

function withStatus(action) {
  return () => {
    Promise.resolve(action()).catch((error) => setStatus(error.message, true));
  };
}

function getConfigFromInputs() {
  return {
    owner: elements.ownerInput.value.trim(),
    repo: elements.repoInput.value.trim(),
    branch: elements.branchInput.value.trim() || DEFAULT_BRANCH,
    contentDir: elements.contentDirInput.value.trim() || DEFAULT_CONTENT_DIR,
    token: elements.tokenInput.value.trim(),
    theme: elements.themeSelect.value || DEFAULT_THEME
  };
}

function loadConfig() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const saved = JSON.parse(raw);
    elements.ownerInput.value = saved.owner || '';
    elements.repoInput.value = saved.repo || '';
    elements.branchInput.value = saved.branch || DEFAULT_BRANCH;
    elements.contentDirInput.value = saved.contentDir || DEFAULT_CONTENT_DIR;
    elements.tokenInput.value = saved.token || '';
    state.theme = saved.theme || DEFAULT_THEME;
    elements.themeSelect.value = state.theme;
  } catch (error) {
    console.warn('Unable to parse saved config.', error);
  }
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getConfigFromInputs()));
  setStatus('Configuration saved locally.', false);
}

function applyTheme(theme) {
  const resolved = theme === DEFAULT_THEME
    ? (prefersDarkMedia.matches ? 'dark' : 'light')
    : theme;

  document.documentElement.dataset.theme = resolved;

  if (elements.hljsLight && elements.hljsDark) {
    elements.hljsLight.disabled = resolved === 'dark';
    elements.hljsDark.disabled = resolved !== 'dark';
  }
}

function toBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function setStatus(message, isError = false) {
  elements.statusMsg.textContent = message;
  elements.statusMsg.style.color = isError ? 'var(--danger)' : 'var(--text-muted)';
}

function getPathInputValue() {
  return elements.pathInput.value.trim();
}

function assertConnectionConfig(config) {
  const required = ['owner', 'repo', 'branch', 'token', 'contentDir'];
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required setting: ${key}`);
    }
  }
}

async function githubRequest(path, config, init = {}) {
  const url = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API ${response.status}: ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function normalizeAndValidatePath(path, contentDir) {
  const trimmedPath = path.trim().replace(/^\/+/, '');

  if (!trimmedPath) {
    throw new Error('Path is required.');
  }

  if (trimmedPath.includes('..')) {
    throw new Error('Path cannot be absolute or contain parent-directory traversal.');
  }

  const normalizedDir = (contentDir || DEFAULT_CONTENT_DIR).trim().replace(/^\/+|\/+$/g, '');
  if (!trimmedPath.startsWith(`${normalizedDir}/`)) {
    throw new Error(`Path must be under ${normalizedDir}/.`);
  }

  return trimmedPath;
}

function isNotFoundError(error) {
  return error instanceof Error && error.message.startsWith('GitHub API 404:');
}

async function listDocuments(config) {
  const encodedDir = encodeURIComponent(config.contentDir);
  const encodedBranch = encodeURIComponent(config.branch);

  try {
    const items = await githubRequest(`/contents/${encodedDir}?ref=${encodedBranch}`, config);
    state.docs = (items || []).filter((item) => item.type === 'file' && item.name.endsWith('.md'));
    renderDocList();
    return true;
  } catch (error) {
    if (isNotFoundError(error)) {
      state.docs = [];
      renderDocList();
      return false;
    }

    throw error;
  }
}

function renderDocList() {
  elements.docList.innerHTML = '';

  for (const doc of state.docs) {
    const li = document.createElement('li');
    li.textContent = doc.path;

    if (doc.path === state.activePath) {
      li.classList.add('active');
    }

    li.addEventListener('click', withStatus(async () => {
      elements.pathInput.value = doc.path;
      await loadDocument(doc.path);
    }));

    elements.docList.appendChild(li);
  }
}

async function loadDocument(path) {
  const config = getConfigFromInputs();
  assertConnectionConfig(config);

  const safePath = normalizeAndValidatePath(path, config.contentDir);
  const encodedPath = encodeURIComponent(safePath);
  const encodedBranch = encodeURIComponent(config.branch);
  const file = await githubRequest(`/contents/${encodedPath}?ref=${encodedBranch}`, config);

  state.activePath = file.path;
  elements.editor.value = fromBase64(file.content.replace(/\n/g, ''));
  elements.pathInput.value = file.path;

  renderDocList();
  updateReferenceContext();
  await renderPreview();
  setStatus(`Loaded ${file.path}`, false);
}

async function saveDocument() {
  if (!state.isEditEnabled) {
    throw new Error('Editing is disabled. Enable editing mode before saving.');
  }

  const config = getConfigFromInputs();
  assertConnectionConfig(config);

  const path = normalizeAndValidatePath(getPathInputValue(), config.contentDir);

  const existing = await fetchCurrentFile(config, path);
  const requestBody = {
    message: elements.commitMessageInput.value.trim() || `docs: update ${path}`,
    content: toBase64(elements.editor.value),
    branch: config.branch,
    ...(existing?.sha ? { sha: existing.sha } : {})
  };

  await githubRequest(`/contents/${encodeURIComponent(path)}`, config, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  state.activePath = path;
  await listDocuments(config);
  updateReferenceContext();
  await renderPreview();
  setStatus(`Committed ${path} to ${config.branch}. GitHub Pages will publish automatically.`, false);
}

async function fetchCurrentFile(config, path) {
  try {
    return await githubRequest(`/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(config.branch)}`, config);
  } catch {
    return null;
  }
}

async function connectRepository() {
  const config = getConfigFromInputs();
  assertConnectionConfig(config);

  await githubRequest('', config);
  const hasContentDirectory = await listDocuments(config);

  if (state.docs.length > 0) {
    await loadDocument(state.docs[0].path);
    setStatus('Connected to repository.', false);
    return;
  }

  const defaultPath = `${config.contentDir}/welcome.md`;
  state.activePath = defaultPath;
  elements.pathInput.value = defaultPath;
  elements.editor.value = DEFAULT_DOC;
  updateReferenceContext();
  await renderPreview();

  if (!hasContentDirectory) {
    setStatus(`Connected. ${config.contentDir}/ was not found; prepared welcome.md template.`, false);
    return;
  }

  setStatus('Connected to repository. No markdown file found; prepared welcome.md template.', false);
}

function createNewDocumentTemplate() {
  const config = getConfigFromInputs();
  const baseName = prompt('New markdown file name (without extension):', 'new-document');

  if (!baseName) {
    return;
  }

  const normalizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase().replace(/^-+|-+$/g, '');
  const safeName = normalizedName || 'new-document';
  const path = `${config.contentDir}/${safeName}.md`;

  state.activePath = path;
  elements.pathInput.value = path;
  elements.editor.value = `# ${baseName}\n\n`;

  renderDocList();
  updateReferenceContext();
  void renderPreview();
}

function toggleEditMode() {
  state.isEditEnabled = !state.isEditEnabled;
  updateEditModeUi();
  if (state.isEditEnabled) {
    setStatus('Editing enabled. You can now modify and commit documents.', false);
    return;
  }

  setStatus('View mode enabled. Editing controls are hidden.', false);
}

function updateEditModeUi() {
  const isEditable = state.isEditEnabled;
  elements.editorPane.classList.toggle('is-hidden', !isEditable);
  elements.modeBadge.textContent = isEditable ? 'Edit mode' : 'View mode';
  elements.modeBadge.classList.toggle('is-edit', isEditable);
  elements.toggleEditBtn.textContent = isEditable ? 'Disable Editing' : 'Enable Editing';
}

function updateReferenceContext() {
  const path = state.activePath || getPathInputValue() || '-';
  elements.contextPath.textContent = path;

  const config = getConfigFromInputs();
  const hasRepoInfo = Boolean(config.owner && config.repo && config.branch);
  const isValidPath = path !== '-' && !path.includes('..');

  if (!hasRepoInfo || !isValidPath) {
    setLink(elements.contextBlob, '-');
    setLink(elements.contextRaw, '-');
    updateAiContextCard();
    return;
  }

  const encodedSegments = path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  const blobUrl = `https://github.com/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/blob/${encodeURIComponent(config.branch)}/${encodedSegments}`;
  const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/${encodeURIComponent(config.branch)}/${encodedSegments}`;

  setLink(elements.contextBlob, blobUrl);
  setLink(elements.contextRaw, rawUrl);
  updateAiContextCard();
}

function setLink(element, href) {
  const isPlaceholder = href === '-';
  element.textContent = href;
  element.href = isPlaceholder ? '#' : href;
  element.setAttribute('aria-disabled', String(isPlaceholder));
  element.tabIndex = isPlaceholder ? -1 : 0;
}

async function copyAiContextJson() {
  const payload = elements.aiContextJson.textContent || '{}';
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API is not available in this browser context.');
  }

  await navigator.clipboard.writeText(payload);
  setStatus('Copied AI context JSON to clipboard.', false);
}

function updateOutline() {
  elements.outlineList.innerHTML = '';

  if (state.headings.length === 0) {
    const li = document.createElement('li');
    li.className = 'outline-empty';
    li.textContent = 'No headings found.';
    elements.outlineList.appendChild(li);
    return;
  }

  for (const heading of state.headings) {
    const li = document.createElement('li');
    li.style.paddingInlineStart = `${Math.max(0, heading.level - 1) * 0.7}rem`;

    const anchor = document.createElement('a');
    anchor.href = `#${heading.id}`;
    anchor.textContent = heading.text;
    li.appendChild(anchor);
    elements.outlineList.appendChild(li);
  }
}

function updateAiContextCard() {
  const config = getConfigFromInputs();
  const path = state.activePath || getPathInputValue() || '';
  const payload = {
    mode: state.isEditEnabled ? 'edit' : 'view',
    repository: {
      owner: config.owner || null,
      name: config.repo || null,
      branch: config.branch || null,
      contentDir: config.contentDir || null
    },
    document: {
      path: path || null,
      title: state.headings[0]?.text || null,
      headings: state.headings.map(({ level, text, id }) => ({ level, text, id })),
      blobUrl: elements.contextBlob.getAttribute('aria-disabled') === 'true' ? null : elements.contextBlob.href,
      rawUrl: elements.contextRaw.getAttribute('aria-disabled') === 'true' ? null : elements.contextRaw.href
    },
    generatedAt: new Date().toISOString()
  };

  elements.aiContextJson.textContent = JSON.stringify(payload, null, 2);
}

function collectHeadings() {
  const headingElements = elements.preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const usedIds = new Set();
  state.headings = Array.from(headingElements).map((heading) => {
    const text = heading.textContent?.trim() || 'Untitled';
    const level = Number(heading.tagName.slice(1));
    let id = heading.id || slugify(text);

    while (!id || usedIds.has(id)) {
      id = `${slugify(text)}-${Math.random().toString(36).slice(2, 6)}`;
    }

    heading.id = id;
    usedIds.add(id);

    return { level, text, id };
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function renderPreview() {
  const source = elements.editor.value || '';
  if (!hasMarked) {
    elements.preview.innerHTML = `<pre><code>${escapeHtml(source)}</code></pre>`;
    collectHeadings();
    updateOutline();
    updateAiContextCard();
    return;
  }

  const rendered = marked.parse(source);
  const sanitized = DOMPurify.sanitize(rendered, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target']
  });

  elements.preview.innerHTML = sanitized;
  if (hasHighlightJs) {
    elements.preview.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  if (hasMermaid) {
    const mermaidBlocks = elements.preview.querySelectorAll('code.language-mermaid');
    for (const block of mermaidBlocks) {
      await replaceMermaidBlock(block);
    }
  }

  collectHeadings();
  updateOutline();
  updateAiContextCard();
}

async function replaceMermaidBlock(block) {
  const parentPre = block.closest('pre');
  if (!parentPre) {
    return;
  }

  const container = document.createElement('div');
  const id = `mermaid-${Math.random().toString(36).slice(2)}`;

  try {
    const rendered = await mermaid.render(id, block.textContent || '');
    container.innerHTML = rendered.svg;
  } catch (error) {
    container.textContent = `Mermaid render error: ${error.message}`;
  }

  parentPre.replaceWith(container);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
