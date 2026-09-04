import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const html = fs.readFileSync('index.html', 'utf8');

function scriptText(selector) {
  const attribute = selector.startsWith('#')
    ? `id=["']${selector.slice(1)}["']`
    : selector;
  const match = html.match(new RegExp(`<script[^>]*${attribute}[^>]*>([\\s\\S]*?)<\\/script>`, 'i'));
  if (!match) throw new Error(`Missing script block: ${selector}`);
  return match[1];
}

const appSource = scriptText('#eva-app-module-source');
const seedSource = scriptText('data-eva-drive-demo-seed');
let generatedModule = '';

const sourceNodes = new Map([
  ['eva-app-module-source', { textContent: appSource }],
]);
const document = {
  readyState: 'complete',
  getElementById(id) { return sourceNodes.get(id) ?? null; },
  createElement() { return {}; },
  addEventListener() {},
  head: { appendChild(node) { generatedModule = node.textContent || ''; } },
};
const window = {};
window.window = window;

vm.runInNewContext(seedSource, {
  document,
  window,
  console,
  URLSearchParams,
  CustomEvent: class CustomEvent {},
  setTimeout,
  clearTimeout,
}, { filename: 'eva-seed.js' });

if (!generatedModule) throw new Error('Seed did not generate the final module');

const temporaryModule = path.join(os.tmpdir(), `eva-runtime-${process.pid}.mjs`);
try {
  fs.writeFileSync(temporaryModule, generatedModule);
  const check = spawnSync(process.execPath, ['--check', temporaryModule], { encoding: 'utf8' });
  if (check.status !== 0) {
    process.stderr.write(check.stderr || check.stdout);
    process.exit(check.status || 1);
  }
} finally {
  fs.rmSync(temporaryModule, { force: true });
}

console.log('Eva final generated module syntax verification passed.');
