import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { verifyModularOutput } from '../scripts/contracts/verify-modular-output.mjs';

const writeFixture = async ({ root, revision = 'current', marker = 'CURRENT_MARKER' }) => {
  await mkdir(path.join(root, 'prototype'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<main>small entry</main>');
  await writeFile(path.join(root, 'prototype', '000-current.js'), `/* ${marker} */`);
  await writeFile(
    path.join(root, 'prototype-manifest.json'),
    `${JSON.stringify({
      sourceRevision: revision,
      sourceCanonicalSha256: 'canonical-sha',
      sourceCanonicalBytes: 123,
      blocks: [
        { order: 0, file: 'prototype/000-current.js', role: 'prototype' },
      ],
    })}\n`,
  );
};

test('verifyModularOutput accepts files generated from the current baseline', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'eva-output-test-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  await writeFixture({ root: tempRoot });
  const baselinePath = path.join(tempRoot, 'baseline.json');
  await writeFile(
    baselinePath,
    JSON.stringify({
      sourceRevision: 'current',
      canonicalSha256: 'canonical-sha',
      canonicalBytes: 123,
      requiredMarkers: ['CURRENT_MARKER'],
    }),
  );

  const result = await verifyModularOutput({ root: tempRoot, baselinePath });

  assert.deepEqual(result, { blocks: 1, files: 1, indexBytes: 24 });
});

test('verifyModularOutput rejects output generated from an older revision', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'eva-output-old-test-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  await writeFixture({ root: tempRoot, revision: 'old' });
  const baselinePath = path.join(tempRoot, 'baseline.json');
  await writeFile(
    baselinePath,
    JSON.stringify({
      sourceRevision: 'current',
      canonicalSha256: 'canonical-sha',
      canonicalBytes: 123,
      requiredMarkers: ['CURRENT_MARKER'],
    }),
  );

  await assert.rejects(
    verifyModularOutput({ root: tempRoot, baselinePath }),
    /旧版本输出：old/,
  );
});
