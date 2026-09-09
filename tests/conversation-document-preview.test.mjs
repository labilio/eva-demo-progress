import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('全员群提供连续的四类文档决策对话', async () => {
  const source = await read('prototype/009-2-data-supply.js');
  for (const name of [
    'A-2409现场复核清单.md',
    'A-2409排产影响测算.html',
    'A-2409临时放行评审纪要.docx',
    'A-2409来料异常分析报告.pdf'
  ]) assert.match(source, new RegExp(name.replace('.', '\\.')));
  assert.match(source, /@Eva 项目管理专员 请按/);
  assert.match(source, /最终仍需王宜林[\s\S]*人工确认/);
});

test('成员消息种子兼容文本数组和文件对象', async () => {
  const source = await read('prototype/009-2-membership.js');
  assert.match(source, /Array\.isArray\(entry\)/);
  assert.match(source, /kind:payload\.kind\|\|'text'/);
  assert.match(source, /record\.fixtureId\|\|/);
});

test('消息右栏注册 Markdown、HTML、Word 和 PDF 阅读器', async () => {
  const patch = await read('prototype/009-5-patch-im.js');
  const runtime = await read('vendor/eva-legacy-runtime.js');
  assert.match(runtime, /extensions:\["md","markdown"\]/);
  assert.match(runtime, /extensions:\["pdf"\]/);
  assert.match(runtime, /showOpenExternal:xt==="html"\|\|xt==="htm"/);
  assert.match(patch, /extensions:\[\"html\",\"htm\"\]/);
  assert.match(patch, /extensions:\[\"doc\",\"docx\"\].*EvaWordPreviewRenderer/);
  assert.match(patch, /EvaHtmlPreviewDocument\(jt,rt\.url\)/);
  assert.match(patch, /Escape/);
  assert.match(patch, /\.\.\.ci,url:Zi/);
});

test('四类演示文件均有本地可读内容', async () => {
  for (const path of [
    'prototype/assets/file-samples/A-2409现场复核清单.md',
    'prototype/assets/file-samples/A-2409排产影响测算.html',
    'prototype/assets/file-samples/A-2409临时放行评审纪要.docx.html',
    'prototype/assets/file-samples/a-2409-demo.pdf'
  ]) assert.ok((await stat(new URL('../' + path, import.meta.url))).size > 100, path);
});

test('预览样式保持右栏推开布局', async () => {
  const css = await read('prototype/054-conversation-document-preview.css');
  assert.match(css, /\.ch-right-panel--preview/);
  assert.match(css, /flex:\s*0 0 664px/);
  assert.doesNotMatch(css, /backdrop-filter/);
});

test('文档预览令牌只作用于预览右栏，不覆盖全局 Octo 表面令牌', async () => {
  const tokens = await read('prototype/document-preview/tokens.css');
  assert.match(tokens, /^\.eva-msg \.ch-right-panel--preview\s*\{/);
  assert.doesNotMatch(tokens, /:root\s*\{/);
  assert.match(tokens, /--wk-bg-surface:\s*var\(--semi-color-bg-0\)/);
});
