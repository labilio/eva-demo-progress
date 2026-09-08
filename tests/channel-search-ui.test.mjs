import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { createPatchedRuntime } from '../tools/build-runtime.mjs';

const runtime = createPatchedRuntime().source;
const css = fs.readFileSync(new URL('../prototype/054-channel-search.css', import.meta.url), 'utf8');
const entry = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('群聊与项目群聊通过共享 ChannelsView 打开同一个搜索面板', () => {
  assert.match(runtime, /function EvaChannelSearchPanel\(/);
  assert.match(runtime, /evaCanSearchCurrent=!Sa\.id\.startsWith\("dm-"\)&&Sa\.chatType!=="direct"&&ct\?\.sidebarVariant!=="ai-sessions"/);
  assert.match(runtime, /Mt==="search"\?React\.createElement\(EvaChannelSearchPanel/);
  assert.match(runtime, /messages:evaAllMessages,locatedMessageId:evaLocatedMessageId/);
  assert.equal((runtime.match(/Mt==="search"\?React\.createElement\(EvaChannelSearchPanel/g) || []).length, 1);
});

test('搜索入口、标签、筛选和关闭操作具备键盘与无障碍语义', () => {
  assert.match(runtime, /React\.createElement\("button",\{type:"button",ref:evaSearchTriggerRef/);
  assert.match(runtime, /"aria-label":"查找聊天内容","aria-expanded":Mt==="search"/);
  assert.match(runtime, /role:'tablist','aria-label':'搜索类型'/);
  assert.match(runtime, /event\.key!=='Escape'/);
  assert.match(runtime, /requestAnimationFrame\(\(\)=>evaSearchTriggerRef\.current\?\.focus\(\)\)/);
});

test('搜索结果使用稳定消息 id 定位原消息且清理跨会话状态', () => {
  assert.match(runtime, /Ta=evaMemberStore\.normalizeMessages\(va,evaMemberStore\.visibleMessages/);
  assert.match(runtime, /"data-message-id":evaMessageId/);
  assert.match(runtime, /querySelectorAll\("\[data-message-id\]"\)/);
  assert.match(runtime, /evaIsLocated&&"eva-message-search-located"/);
  assert.match(runtime, /La=ci=>\{setEvaLocatedMessageId\(null\)/);
  assert.match(runtime, /Za=\(ci,Zi\)=>\{ct\?\.onSelectThread\?\.\(Zi\);setEvaLocatedMessageId\(null\)/);
});

test('搜索 UI 遵循 GDS token、线上面板尺寸和响应式约束', () => {
  assert.equal(/#[0-9a-f]{3,8}\b/i.test(css), false, '业务 CSS 不应写原始色值');
  assert.match(css, /width: 480px/);
  assert.match(css, /height: 48px/);
  assert.match(css, /height: 40px/);
  assert.match(css, /height: 32px/);
  assert.match(css, /@media \(max-width: 1199px\)/);
  assert.match(css, /@media \(max-width: 839px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.ok(entry.indexOf('prototype/047-gds-tokens.css') < entry.indexOf('prototype/054-channel-search.css'));
});
