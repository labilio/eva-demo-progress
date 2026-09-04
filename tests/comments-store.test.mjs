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
});

test('comments store rejects incomplete names before a network request', async () => {
  const store = createCommentsStore({ url: 'https://example.supabase.co', key: 'public-key', fetchImpl: () => assert.fail('must not fetch') });
  await assert.rejects(() => store.create({ page_path: '#/', author_name: '周', body: '问题', anchor: {} }), /至少两个字/);
});
