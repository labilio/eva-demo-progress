import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../review/comments.js', import.meta.url), 'utf8');

test('review comments use an independent hidden launcher instead of Eva feedback UI', () => {
  assert.match(source, /data-review-launcher/);
  assert.doesNotMatch(source, /label === ['"]反馈问题['"]/);
  assert.match(source, /class="eva-review-panel" hidden/);
});
