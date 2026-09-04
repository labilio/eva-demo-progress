import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { splitStandalone } from '../tools/split-standalone.mjs';

const fixture = `<!doctype html>
<html>
<head>
  <style data-eva-shell>.shell { color: red; }</style>
  <script id="eva-app-module-source" type="text/plain">export const boot = true;</script>
  <script data-eva-data type="application/json">{"safe":"inert"}</script>
</head>
<body>
  <main>current Eva</main>
  <script data-eva-loader>
  (function () {
    var sourceNode = document.getElementById('eva-app-module-source');
    var source = sourceNode ? sourceNode.textContent : '';
    window.__source = source;
  })();
  </script>
</body>
</html>`;

test('splitStandalone preserves order and externalizes the legacy runtime', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'eva-split-test-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const sourcePath = path.join(tempRoot, 'source.html');
  const outputRoot = path.join(tempRoot, 'output');
  await writeFile(sourcePath, fixture);

  const result = await splitStandalone({
    sourcePath,
    outputRoot,
    sourceRevision: 'current-revision',
  });

  const manifest = JSON.parse(
    await readFile(path.join(outputRoot, 'prototype-manifest.json'), 'utf8'),
  );
  const outputHtml = await readFile(path.join(outputRoot, 'index.html'), 'utf8');
  const runtime = await readFile(
    path.join(outputRoot, 'vendor', 'eva-legacy-runtime.js'),
    'utf8',
  );

  assert.equal(result.externalBlocks, 3);
  assert.equal(manifest.sourceRevision, 'current-revision');
  assert.deepEqual(manifest.blocks.map((block) => block.order), [0, 1, 2, 3]);
  assert.equal(
    manifest.blocks.find((block) => block.name === 'eva-app-module-source').role,
    'vendor',
  );
  assert.match(outputHtml, /prototype\/000-shell\.css/);
  assert.match(outputHtml, /vendor\/eva-legacy-runtime\.js/);
  assert.match(outputHtml, /type="application\/json">\{"safe":"inert"\}<\/script>/);
  assert.match(outputHtml, /prototype\/003-loader\.js/);
  assert.equal(runtime, 'export const boot = true;');
});

test('splitStandalone rejects a loader whose runtime-source anchor changed', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'eva-split-anchor-test-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const sourcePath = path.join(tempRoot, 'source.html');
  const outputRoot = path.join(tempRoot, 'output');
  await writeFile(
    sourcePath,
    fixture.replace(
      "var sourceNode = document.getElementById('eva-app-module-source');",
      "var sourceNode = document.querySelector('[data-missing-anchor]');",
    ),
  );

  await assert.rejects(
    splitStandalone({ sourcePath, outputRoot, sourceRevision: 'current-revision' }),
    /基础模块加载器锚点不匹配/,
  );
});
