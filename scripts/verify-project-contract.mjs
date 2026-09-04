import fs from 'node:fs';
import './verify-sidebar-selection-contract.mjs';

const failures = [];
const fail = message => failures.push(message);
const read = file => {
  if (!fs.existsSync(file)) {
    fail(`missing ${file}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
};

const entry = read('index.html');
const manifestText = read('prototype-manifest.json');
const gitignore = read('.gitignore').replace(/\r\n/g, '\n');
const vercelIgnore = read('.vercelignore').replace(/\r\n/g, '\n').trim();
let manifest = { blocks: [] };
try { manifest = JSON.parse(manifestText); } catch { fail('prototype-manifest.json is invalid JSON'); }

for (const trackedPath of ['!index.html', '!prototype-manifest.json', '!prototype/**', '!vendor/**', '!scripts/**', '!tools/**', '!tests/**']) {
  if (!gitignore.split('\n').includes(trackedPath)) fail(`.gitignore does not expose ${trackedPath}`);
}

if (fs.existsSync('prototypes/eva demo 0904 -v1.html')) fail('retired standalone remains in the active source tree');

for (const block of manifest.blocks || []) {
  if (!block.file) continue;
  if (!fs.existsSync(block.file)) fail(`manifest references missing file: ${block.file}`);
  if (!entry.includes(block.file)) fail(`entry does not load manifest block: ${block.file}`);
}

for (const forbidden of ['EvaCtxIcon=', 'evaMenuIcons={']) {
  for (const block of manifest.blocks || []) {
    if (block.file && read(block.file).includes(forbidden)) fail(`${block.file} contains retired hand-written icon code: ${forbidden}`);
  }
}

const expectedVercelIgnore = '*\n!index.html\n!prototype-manifest.json\n!prototype/**\n!vendor/**\n!vercel.json';
if (vercelIgnore !== expectedVercelIgnore) fail('.vercelignore does not publish the complete modular runtime');
if (entry.length > 100_000) fail(`index.html is too large (${entry.length} characters)`);
if (!manifest.blocks?.some(block => block.file === 'vendor/eva-legacy-runtime.js')) fail('manifest does not declare the transitional legacy runtime');

if (failures.length) {
  failures.forEach(message => console.error(`Project contract violation: ${message}`));
  process.exit(1);
}
console.log(`Eva modular project contract passed: ${manifest.blocks.length} ordered blocks.`);
