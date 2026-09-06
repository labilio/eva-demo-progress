import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { runCommentsCommand } from '../tools/comments-cli.mjs';

function createHarness() {
  const calls = [];
  const store = {
    async create(value) { calls.push(['create', value]); return { id: 'comment-1', ...value, status: 'open' }; },
    async list(page) { calls.push(['list', page]); return [{ id: 'comment-1', page_path: page }]; },
    async addReply(id, value) { calls.push(['reply', id, value]); return { id: 'reply-1', comment_id: id, ...value }; },
    async updateStatus(id, status) { calls.push(['status', id, status]); return { id, status }; },
    async remove(id) { calls.push(['delete', id]); return { id }; },
  };
  const output = [];
  return { store, calls, output, write: value => output.push(value) };
}

test('AI 可以用页面、选择器和意见创建结构化批注', async () => {
  const harness = createHarness();
  await runCommentsCommand([
    'add', '--page', '#/guid', '--selector', '[data-eva-nav-id="my-ai"]',
    '--kind', 'ui', '--body', '调整这个入口的间距', '--label', '我的 AI',
  ], harness);

  assert.equal(harness.calls[0][0], 'create');
  assert.deepEqual(harness.calls[0][1], {
    page_path: '#/guid',
    author_name: 'Codex',
    body: '调整这个入口的间距',
    kind: 'ui',
    status: 'open',
    anchor: {
      version: 1,
      page: '#/guid',
      selector: '[data-eva-nav-id="my-ai"]',
      anchorId: '',
      quote: '',
      target: { tag: '', role: '', label: '我的 AI', placeholder: '', inputType: '', heading: '' },
      point: { rx: 0.5, ry: 0.5 },
    },
  });
  assert.match(harness.output[0], /"id": "comment-1"/);
});

test('AI 批注必须提供可定位的元素信息', async () => {
  const harness = createHarness();
  await assert.rejects(
    runCommentsCommand(['add', '--page', '#/guid', '--body', '这里有问题'], harness),
    /selector、anchor-id 或 quote/,
  );
  assert.equal(harness.calls.length, 0);
});

test('AI 可以查询、回复和更新开发状态', async () => {
  const harness = createHarness();
  await runCommentsCommand(['list', '--page', '#/guid'], harness);
  await runCommentsCommand(['reply', '--id', 'comment-1', '--body', '已补充复现信息'], harness);
  await runCommentsCommand(['status', '--id', 'comment-1', '--status', 'doing'], harness);
  assert.deepEqual(harness.calls, [
    ['list', '#/guid'],
    ['reply', 'comment-1', { author_name: 'Codex', body: '已补充复现信息' }],
    ['status', 'comment-1', 'doing'],
  ]);
});

test('AI 不提供页面时可以查询全部共享批注', async () => {
  const harness = createHarness();
  await runCommentsCommand(['list'], harness);
  assert.deepEqual(harness.calls, [['list', undefined]]);
});

test('AI 可以删除共享批注', async () => {
  const harness = createHarness();
  const row = await runCommentsCommand(['delete', '--id', 'comment-1'], harness);
  assert.deepEqual(harness.calls, [['delete', 'comment-1']]);
  assert.deepEqual(row, { id: 'comment-1' });
});

test('AI 不能在没有人工确认标志时将批注改为已确认', async () => {
  const harness = createHarness();
  await assert.rejects(
    runCommentsCommand(['status', '--id', 'comment-1', '--status', 'approved'], harness),
    /--confirmed-by-user/,
  );
  await runCommentsCommand([
    'status', '--id', 'comment-1', '--status', 'approved', '--confirmed-by-user',
  ], harness);
  assert.deepEqual(harness.calls, [['status', 'comment-1', 'approved']]);
});

test('AI 只有得到人工确认后才能创建已基本定稿类型的批注', async () => {
  const harness = createHarness();
  const addArgs = [
    'add', '--page', '#/guid', '--selector', '[data-eva-nav-id="my-ai"]',
    '--body', '这部分大差不差了', '--kind', 'ready',
  ];
  await assert.rejects(runCommentsCommand(addArgs, harness), /--confirmed-by-user/);
  await runCommentsCommand([...addArgs, '--confirmed-by-user'], harness);
  assert.equal(harness.calls[0][1].kind, 'ready');
  assert.equal(harness.calls[0][1].status, 'open');
});

test('AI 署名可由参数或环境变量覆盖', async () => {
  const byFlag = createHarness();
  await runCommentsCommand([
    'reply', '--id', 'comment-1', '--body', '来自评审代理', '--author', '设计评审 AI',
  ], byFlag);
  assert.equal(byFlag.calls[0][2].author_name, '设计评审 AI');

  const byEnvironment = createHarness();
  await runCommentsCommand(['reply', '--id', 'comment-1', '--body', '来自另一台电脑'], {
    ...byEnvironment,
    env: { EVA_REVIEW_AUTHOR: '王宜林的 Codex' },
  });
  assert.equal(byEnvironment.calls[0][2].author_name, '王宜林的 Codex');
});

test('没有历史记忆的 AI 能从仓库规则发现机器批注入口', () => {
  const agents = fs.readFileSync('AGENTS.md', 'utf8');
  const guide = fs.readFileSync('docs/AI_COMMENTS.md', 'utf8');
  assert.match(agents, /docs\/AI_COMMENTS\.md/);
  assert.match(agents, /npm run comments/);
  assert.match(guide, /add/);
  assert.match(guide, /list/);
  assert.match(guide, /reply/);
  assert.match(guide, /status/);
  assert.match(guide, /delete/);
  assert.match(guide, /--confirmed-by-user/);
});
