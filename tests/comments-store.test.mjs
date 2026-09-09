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

test('non-execution status changes preserve ownership; missing actor never writes', async () => {
  const calls=[];
  const store=createCommentsStore({url:'https://example.supabase.co',key:'public-key',fetchImpl:async(url,options)=>{
    calls.push({url,options});return new Response(JSON.stringify([{id:'c1',...JSON.parse(options.body)}]));
  }});
  const id='11111111-1111-4111-8111-111111111111';
  for(const status of ['open','approved','done']){
    const row=await store.updateStatus(id,status,' Alice ');
    assert.equal(row.status,status);assert.equal(row.claimed_by,undefined);
    assert.deepEqual(JSON.parse(calls.at(-1).options.body),{status});
    assert.equal(calls.at(-1).options.method,'PATCH');
  }
  const count=calls.length;
  for(const actor of ['', '匿名同事', 'x'.repeat(41)]) await assert.rejects(()=>store.updateStatus(id,'doing',actor),/操作人姓名/);
  await assert.rejects(()=>store.updateStatus(id,'ready','Alice'),/不支持/);
  assert.equal(calls.length,count);
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

test('entering doing claims unclaimed rows and rejects another owner',async()=>{
 const id='11111111-1111-4111-8111-111111111111';let owner=null;const calls=[];
 const store=createCommentsStore({url:'https://example.com',key:'public',fetchImpl:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify([{id,status:'doing',claimed_by:owner}]));}});
 await store.updateStatus(id,'doing','Alice');assert.match(calls.at(-1).url,/rpc\/eva_claim_comments$/);
 owner='Bob';await assert.rejects(store.updateStatus(id,'doing','Alice'),/其他人/);assert.equal(calls.at(-1).options.method,'GET');
 owner='Alice';await store.updateStatus(id,'doing','Alice');assert.equal(calls.at(-1).options.method,'PATCH');assert.match(calls.at(-1).url,/claimed_by=eq.Alice/);
});
