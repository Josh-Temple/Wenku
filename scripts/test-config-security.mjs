import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const configFunctions = app.slice(app.indexOf('function getConfigFromInputs()'), app.indexOf('function applyTheme('));
const key = 'wenku.github.config.v1';
let stored;
const elements = Object.fromEntries(['ownerInput', 'repoInput', 'branchInput', 'contentDirInput', 'tokenInput', 'themeSelect'].map(name => [name, { value: '' }]));
const warnings = [];
const context = vm.createContext({ elements, state: {}, STORAGE_KEY: key, DEFAULT_BRANCH: 'main', DEFAULT_CONTENT_DIR: 'content', DEFAULT_THEME: 'system', console: { warn(...args) { warnings.push(args.join(' ')); } }, setStatus() {}, localStorage: { getItem(k) { assert.equal(k, key); return stored; }, setItem(k, value) { assert.equal(k, key); stored = value; }, removeItem(k) { assert.equal(k, key); stored = null; } } });
vm.runInContext(configFunctions, context);

elements.ownerInput.value = 'example';
elements.repoInput.value = 'notes';
elements.tokenInput.value = 'synthetic-test-token';
context.saveConfig();
assert.equal(JSON.parse(stored).owner, 'example');
assert.equal(JSON.parse(stored).branch, 'main');
assert.equal(Object.hasOwn(JSON.parse(stored), 'token'), false);
assert.equal(context.getConfigFromInputs().token, 'synthetic-test-token');

stored = JSON.stringify({ owner: 'example', repo: 'notes', branch: 'draft', contentDir: 'content', theme: 'dark', token: 'synthetic-legacy-token' });
elements.tokenInput.value = '';
context.loadConfig();
assert.equal(elements.tokenInput.value, '');
assert.equal(Object.hasOwn(JSON.parse(stored), 'token'), false);
assert.equal(elements.branchInput.value, 'draft');
assert.equal(elements.themeSelect.value, 'dark');
context.loadConfig();
assert.equal(elements.tokenInput.value, '');

stored = '{"token":"synthetic-legacy-token"},';
context.loadConfig();
assert.equal(elements.tokenInput.value, '');
assert.equal(stored, null);
assert.equal(warnings.join(' ').includes('synthetic-legacy-token'), false);
console.log('PASS: credentials stay in memory; legacy storage is scrubbed; non-secret preferences remain.');
