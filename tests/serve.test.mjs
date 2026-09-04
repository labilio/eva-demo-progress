import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createServer, resolvePublicPath } from '../tools/serve.mjs';

test('serves files only from the project root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eva-serve-'));
  try {
    fs.writeFileSync(path.join(root, 'index.html'), 'ok');
    assert.equal(resolvePublicPath(root, '/').path, path.join(root, 'index.html'));
    assert.equal(resolvePublicPath(root, '/missing.js').status, 404);
    assert.equal(resolvePublicPath(root, '/../secret.txt').status, 403);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('serves ES modules with a JavaScript MIME type', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eva-serve-module-'));
  const server = createServer(root);
  try {
    fs.writeFileSync(path.join(root, 'module.mjs'), 'export const ok = true;');
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/module.mjs`);
    assert.match(response.headers.get('content-type'), /^text\/javascript/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
