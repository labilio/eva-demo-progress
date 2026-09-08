import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup() {
  const window = { __EVA_DEMO_TIME: { T1: '2026-09-08T12:00:00+08:00' } };
  vm.runInNewContext(
    fs.readFileSync(new URL('../prototype/009-2-membership.js', import.meta.url), 'utf8'),
    { window },
  );
  const store = window.EvaMembership.create({
    people: [
      { id: 'owner', name: '群主', active: true },
      { id: 'member', name: '成员', active: true },
      { id: 'outsider', name: '未入群', active: true },
    ],
  });
  store.createProject('p', '项目', 'owner', []);
  store.addMember('p', 'owner', 'member');
  store.createGroup('g', '项目群', 'p', 'owner', []);
  store.addMember('g', 'owner', 'member');
  store.createThread('t', 'g', { name: '整改子区' }, 'owner');
  return store;
}

const messages = [
  { kind: 'divider', text: '9月7日' },
  { kind: 'text', fixtureId: 'm-1', sender: { uid: 'owner', name: '群主' }, time: '09:10', text: '请确认整改计划' },
  { kind: 'file', fixtureId: 'm-2', sender: { uid: 'member', name: '成员' }, time: '10:20', file: { name: '整改计划.pdf', size: 1024 } },
  { kind: 'image', fixtureId: 'm-3', sender: { uid: 'member', name: '成员' }, time: '10:30', image: { url: 'demo.png' } },
  { kind: 'divider', text: '9月8日' },
  { kind: 'text', fixtureId: 'm-4', sender: { uid: 'member', name: '成员' }, time: '08:15', text: '现场复测已经完成' },
];

test('消息标准化产生稳定 id 和可筛选的完整时间', () => {
  const store = setup();
  const first = store.normalizeMessages('g', messages);
  const second = store.normalizeMessages('g', messages);
  assert.equal(first[1].id, 'm-1');
  assert.equal(first[1].sentAt, '2026-09-07T09:10:00+08:00');
  assert.equal(first[5].sentAt, '2026-09-08T08:15:00+08:00');
  assert.equal(first[2].id, second[2].id);
});

test('当前群搜索支持关键词、类型、发送者、日期和排序', () => {
  const store = setup();
  const all = store.searchMessages('g', 'owner', messages, { keyword: '整改' });
  assert.deepEqual(Array.from(all.items, item => item.fixtureId), ['m-2', 'm-1']);

  const files = store.searchMessages('g', 'owner', messages, { tab: 'file', keyword: '计划' });
  assert.equal(files.total, 1);
  assert.equal(files.items[0].fixtureId, 'm-2');

  const filtered = store.searchMessages('g', 'owner', messages, {
    tab: 'message',
    senderIds: ['member'],
    sentFrom: '2026-09-08T00:00:00+08:00',
    sentTo: '2026-09-08T23:59:59+08:00',
    sort: 'asc',
  });
  assert.deepEqual(Array.from(filtered.items, item => item.fixtureId), ['m-4']);
});

test('图片视频关键词遵循 Octo 限制并保留筛选能力', () => {
  const store = setup();
  const blocked = store.searchMessages('g', 'owner', messages, { tab: 'media', keyword: '现场' });
  assert.equal(blocked.mediaKeywordBlocked, true);
  assert.equal(blocked.total, 0);
  const bySender = store.searchMessages('g', 'owner', messages, { tab: 'media', senderIds: ['member'] });
  assert.equal(bySender.total, 1);
  assert.equal(bySender.items[0].fixtureId, 'm-3');
});

test('父群、子区、清空记录与成员权限相互隔离', () => {
  const store = setup();
  const threadMessages = [{ kind: 'text', fixtureId: 't-1', sender: { uid: 'owner' }, time: '11:00', text: '仅子区可见' }];
  assert.equal(store.searchMessages('g', 'owner', messages, { keyword: '子区' }).total, 0);
  assert.equal(store.searchMessages('t', 'owner', threadMessages, { keyword: '子区' }).total, 1);
  assert.equal(store.searchMessages('g', 'outsider', messages, { keyword: '整改' }).total, 0);
  store.setChatPreferences('g', 'owner', { clearedCount: 3 });
  assert.equal(store.searchMessages('g', 'owner', messages, { keyword: '整改' }).total, 0);
});

test('搜索结果分页且关键词按线上限制截为 64 字符', () => {
  const store = setup();
  const many = Array.from({ length: 25 }, (_, index) => ({
    kind: 'text', fixtureId: `page-${index}`, sender: { uid: 'owner' }, time: '09:10', text: `计划 ${index}`,
  }));
  const first = store.searchMessages('g', 'owner', many, { keyword: '计划'.repeat(40), pageSize: 10 });
  assert.equal(first.keyword.length, 64);
  const page = store.searchMessages('g', 'owner', many, { pageSize: 10 });
  assert.equal(page.items.length, 10);
  assert.equal(page.nextCursor, '10');
  assert.equal(page.hasMore, true);
});
