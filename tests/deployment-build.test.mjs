import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createSiteIndex, siteDirectories } from '../tools/build-runtime.mjs';

const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const packageSource = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const vercelSource = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

test('本地构建保留独立批注工具，部署构建不复制批注目录', () => {
  assert.deepEqual(siteDirectories(), ['prototype', 'review', 'supabase']);
  assert.deepEqual(siteDirectories({ deployment: true }), ['prototype']);
  assert.match(createSiteIndex(indexSource), /review\/comments\.js/);
});

test('部署入口移除所有批注资源且保留产品资源', () => {
  const deployedIndex = createSiteIndex(indexSource, { deployment: true });
  assert.doesNotMatch(deployedIndex, /eva-review:(?:start|end)/);
  assert.doesNotMatch(deployedIndex, /\b(?:href|src)=["']review\//);
  assert.match(deployedIndex, /prototype\/054-channel-search\.css/);
});

test('Vercel 固定使用无批注部署构建', () => {
  assert.equal(packageSource.scripts['build:deploy'], 'node tools/build-runtime.mjs --deployment');
  assert.equal(vercelSource.buildCommand, 'npm run build:deploy');
});
