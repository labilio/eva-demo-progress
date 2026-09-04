import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { resolvePublicPath } from '../tools/serve.mjs';

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
