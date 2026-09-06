import assert from 'node:assert/strict';
import test from 'node:test';

import { createCommentsStore } from '../review/comments-store.mjs';

test('comments store lists and creates named comments through Supabase REST', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(options.method === 'POST' ? [{ id: 'c1' }] : [{ id: 'c0' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const store = createCommentsStore({ url: 'https://example.supabase.co', key: 'public-key', fetchImpl });
  assert.deepEqual(await store.list('#/messages'), [{ id: 'c0' }]);
  assert.deepEqual(await store.create({ page_path: '#/messages', author_name: '周羽枫', body: '输入框需要统一', anchor: {} }), { id: 'c1' });
  assert.match(calls[0].url, /page_path=eq\.%23%2Fmessages/);
  assert.equal(calls[1].options.headers.apikey, 'public-key');
  assert.equal(JSON.parse(calls[1].options.body).author_name, '周羽枫');
  assert.equal(JSON.parse(calls[1].options.body).kind, 'function');
  assert.match(JSON.parse(calls[1].options.body).client_nonce, /^[0-9a-f-]{36}$/);
});

test('comments store can create a basically finalized comment type', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify([{ id: 'c-ready', kind: 'ready', status: 'open' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const store = createCommentsStore({ url: 'https://example.supabase.co', key: 'public-key', fetchImpl });
  await store.create({ page_path: '#/guid', author_name: '周羽枫', body: '这部分可以开工', anchor: {}, kind: 'ready' });
  assert.equal(JSON.parse(calls[0].options.body).kind, 'ready');
});

test('comments store can list the complete shared review feed without a page filter', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const store = createCommentsStore({ url: 'https://example.supabase.co', key: 'public-key', fetchImpl });
  assert.deepEqual(await store.list(), []);
  assert.doesNotMatch(calls[0].url, /page_path=/);
});

test('comments store updates only supported workflow statuses', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify([{ id: 'c1', status: 'doing' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const store = createCommentsStore({ url: 'https://example.supabase.co', key: 'public-key', fetchImpl });
  assert.deepEqual(await store.updateStatus('c1', 'doing'), { id: 'c1', status: 'doing' });
  assert.match(calls[0].url, /id=eq\.c1/);
  assert.equal(calls[0].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[0].options.body), { status: 'doing' });
  await assert.rejects(() => store.updateStatus('c1', 'ready'), /不支持的批注状态/);
  await store.updateStatus('c1', 'done');
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), { status: 'done' });
  await assert.rejects(() => store.updateStatus('c1', 'deleted'), /不支持的批注状态/);
});

test('comments store appends a named reply to its own table', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify([{ id: 'r1', comment_id: 'c1', author_name: '王宜林', body: '已经补充说明' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const store = createCommentsStore({ url: 'https://example.supabase.co', key: 'public-key', fetchImpl });
  const reply = await store.addReply('c1', { author_name: ' 王宜林 ', body: ' 已经补充说明 ' });
  assert.equal(reply.id, 'r1');
  assert.match(calls[0].url, /eva_demo_comment_replies$/);
  assert.deepEqual(JSON.parse(calls[0].options.body), { comment_id: 'c1', author_name: '王宜林', body: '已经补充说明' });
});

test('comments store uses anonymous colleague when a human leaves the name empty', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify([{ id: url.includes('replies') ? 'r1' : 'c1' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const store = createCommentsStore({ url: 'https://example.supabase.co', key: 'public-key', fetchImpl });
  await store.create({ page_path: '#/', author_name: '', body: '问题', anchor: {} });
  await store.addReply('c1', { author_name: '   ', body: '补充说明' });
  assert.equal(JSON.parse(calls[0].options.body).author_name, '匿名同事');
  assert.equal(JSON.parse(calls[1].options.body).author_name, '匿名同事');
});

test('comments store deletes a shared comment and returns the removed row', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify([{ id: 'c1' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const store = createCommentsStore({ url: 'https://example.supabase.co', key: 'public-key', fetchImpl });
  assert.deepEqual(await store.remove('c1'), { id: 'c1' });
  assert.match(calls[0].url, /id=eq\.c1/);
  assert.equal(calls[0].options.method, 'DELETE');
  assert.equal(calls[0].options.headers.Prefer, 'return=representation');
});
