const STORAGE_KEY = 'wenku.github.config.v1';
const DEFAULT_CONTENT_DIR = 'content';
const DEFAULT_BRANCH = 'main';
const DEFAULT_THEME = 'system';
const BASE64_CHUNK_SIZE = 0x8000;

const DEFAULT_DOC = `# Welcome to Wenku\n\n- Supports **GitHub Flavored Markdown**\n- Code highlighting\n- Mermaid diagrams\n\n\`\`\`mermaid\nflowchart LR\n  A[Write Markdown] --> B[Commit to GitHub]\n  B --> C[Published on GitHub Pages]\n\`\`\`\n`;

const state = {
  docs: [],
  activePath: '',
  theme: DEFAULT_THEME
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
    editor: document.getElementById('editor'),
    preview: document.getElementById('preview'),
    themeSelect: document.getElementById('themeSelect'),
    hljsLight: document.getElementById('hljs-light'),
    hljsDark: document.getElementById('hljs-dark')
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

function setStatus(message, isError = false) {
  elements.statusMsg.style.color = isError ? 'var(--danger)' : 'var(--accent)';
  elements.statusMsg.textContent = message;
}

function getPathInputValue() {
  return elements.pathInput.value.trim();
}

function resolveTheme(themeMode) {
  if (themeMode === DEFAULT_THEME) {
    return prefersDarkMedia.matches ? 'dark' : 'light';
  }
  return themeMode;
}

function applyTheme(themeMode) {
  const resolvedTheme = resolveTheme(themeMode);
  document.documentElement.dataset.theme = resolvedTheme;
  elements.hljsDark.disabled = resolvedTheme !== 'dark';
  elements.hljsLight.disabled = resolvedTheme === 'dark';

  if (hasMermaid) {
    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict'
    });
  }

  void renderPreview();
}

function getApiBase(config) {
  return `https://api.github.com/repos/${config.owner}/${config.repo}`;
}

function getApiHeaders(config, extraHeaders = {}) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${config.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...extraHeaders
  };
}

async function githubRequest(path, config, options = {}) {
  const response = await fetch(`${getApiBase(config)}${path}`, {
    ...options,
    headers: getApiHeaders(config, options.headers || {})
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API ${response.status}: ${detail}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function assertConnectionConfig(config) {
  if (!config.owner || !config.repo || !config.token) {
    throw new Error('Owner, repository, and token are required.');
  }
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function fromBase64(base64Text) {
  const binary = atob(base64Text);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function normalizeAndValidatePath(path, contentDir) {
  const trimmedPath = path.trim();

  if (!trimmedPath || !trimmedPath.toLowerCase().endsWith('.md')) {
    throw new Error('Please provide a valid .md file path.');
  }

  if (trimmedPath.startsWith('/') || trimmedPath.includes('..')) {
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
  await renderPreview();
  setStatus(`Loaded ${file.path}`, false);
}

async function saveDocument() {
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
  elements.pathInput.value = defaultPath;
  elements.editor.value = DEFAULT_DOC;
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
  void renderPreview();
}

async function renderPreview() {
  const source = elements.editor.value || '';
  if (!hasMarked) {
    elements.preview.innerHTML = `<pre><code>${escapeHtml(source)}</code></pre>`;
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

  if (!hasMermaid) {
    return;
  }

  const mermaidBlocks = elements.preview.querySelectorAll('code.language-mermaid');
  for (const block of mermaidBlocks) {
    await replaceMermaidBlock(block);
  }
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
