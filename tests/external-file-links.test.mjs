import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadIdentityEnvironment} from './helpers/identity-environment.mjs';

function setup(options = {}) {
  const window = options.window || {};
  loadIdentityEnvironment(window);
  for (const file of ['009-2-membership.js', '009-1-file-sharing.js']) {
    vm.runInNewContext(fs.readFileSync(new URL('../prototype/' + file, import.meta.url), 'utf8'), {window, URL});
  }
  const members = window.EvaMembership.create({people: [
    {id: 'a', name: '王宜林'},
    {id: 'b', name: '何静'},
    {id: 'c', name: '林晓'}
  ]});
  members.createProject('p', '项目空间', 'a', []);
  members.addMember('p', 'a', 'b');
  return {window, members, files: window.EvaFileSharing.create(members), sharing: window.EvaFileSharing};
}

test('Editor 添加外部链接后，项目文件和文件库读取同一个资源 ID', () => {
  const {files} = setup();
  const id = files.createExternalLink('b', 'p', {name: '供应商飞书协作文档', url: 'https://example.feishu.cn/docx/demo'});
  const projectEntry = files.list('p', 'b').find(item => item.id === id);
  const libraryEntry = files.all('b').find(item => item.id === id);

  assert.equal(projectEntry.id, libraryEntry.id, '两个入口应读取同一个资源 ID');
  assert.equal(projectEntry.type, 'external_link');
  assert.equal(projectEntry.external.provider, 'feishu');
  assert.equal(projectEntry.external.kind, 'document');
  assert.equal(projectEntry.source.label, '手动添加外部链接');
  assert.equal(files.fileTypeFor(id, 'b'), '飞书文档 · 外部链接');
  assert.equal(files.externalLinkInfo(id, 'b').host, 'example.feishu.cn');
  assert.equal(files.can('add-external-link', 'p', 'b'), true);
  assert.throws(() => files.createExternalLink('c', 'p', {name: '无权限', url: 'https://example.com'}), /操作权限/);
});

test('外部链接仅接受无凭据的 http 或 https 地址', () => {
  const {files} = setup();
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'ftp://example.com/file']) {
    assert.throws(() => files.createExternalLink('a', 'p', {name: '危险链接', url}), /http 或 https/);
  }
  assert.throws(() => files.createExternalLink('a', 'p', {name: '带凭据', url: 'https://user:secret@example.com/docs'}), /账号或密码/);
  assert.throws(() => files.createExternalLink('a', 'p', {name: '', url: 'https://example.com'}), /链接名称/);
  assert.throws(() => files.createExternalLink('a', 'p', {name: '缺少地址', url: ''}), /外部链接/);
});

test('同一目录的等价链接去重，不同目录可各自保存入口', () => {
  const {files} = setup();
  const first = files.createExternalLink('a', 'p', {name: '项目文档', url: 'https://example.com'});
  const duplicate = files.createExternalLink('a', 'p', {name: '同一地址', url: 'https://example.com/'});
  const folderId = files.createFolder('a', 'p', '供应商资料');
  const nested = files.createExternalLink('a', 'p', {name: '文件夹内入口', url: 'https://example.com/'}, folderId);

  assert.equal(duplicate, first);
  assert.notEqual(nested, first);
  assert.equal(files.list('p', 'a').filter(item => item.type === 'external_link').length, 2);
});

test('编辑链接改域名需要二次确认，并同步默认快捷方式名称', () => {
  const {files} = setup();
  const id = files.createExternalLink('a', 'p', {name: '旧文档', url: 'https://docs.example.com/a'});
  const shortcutId = files.createShortcut('a', id, 'personal:a');

  assert.throws(() => files.updateExternalLink('a', id, {name: '新文档', url: 'https://new.example.com/b'}), /域名已变更/);
  assert.equal(files.externalLinkInfo(id, 'a').host, 'docs.example.com');
  files.updateExternalLink('a', id, {name: '新文档', url: 'https://new.example.com/b', confirmHostChange: true});

  assert.equal(files.externalLinkInfo(shortcutId, 'a').url, 'https://new.example.com/b');
  assert.equal(files.list('personal:a', 'a').find(item => item.id === shortcutId).name, '新文档');
  assert.equal(files.fileTypeFor(shortcutId, 'a'), '网页链接 · 外部链接 · 快捷方式');
  assert.throws(() => files.copy('a', id), /无需创建副本/);
});

test('外部链接快捷方式仍逐次校验源空间权限且不会泄漏 URL', () => {
  const {members, files} = setup();
  members.createProject('target', '目标项目', 'a', []);
  members.addMember('target', 'a', 'b');
  const id = files.createExternalLink('a', 'p', {name: '保密企微入口', url: 'https://docs.work.weixin.qq.com/private'});
  const shortcutId = files.createShortcut('a', id, 'target');

  assert.equal(files.externalLinkInfo(shortcutId, 'b').provider, 'wecom');
  members.remove('p', 'a', 'b');
  const masked = files.list('target', 'b').find(item => item.id === shortcutId);
  assert.equal(masked.name, '无权访问的快捷方式');
  assert.doesNotMatch(JSON.stringify(masked), /work\.weixin|private|保密企微/);
  assert.throws(() => files.externalLinkInfo(shortcutId, 'b'), /无权访问/);
});

test('两个文件入口提供创建、打开、复制和编辑外链交互，并禁止外链预览下载', () => {
  const drive = fs.readFileSync(new URL('../prototype/020-mode-layer.js', import.meta.url), 'utf8');
  const project = fs.readFileSync(new URL('../prototype/009-1-project-files-ui.js', import.meta.url), 'utf8');
  const styles = fs.readFileSync(new URL('../prototype/050-file-library.css', import.meta.url), 'utf8');
  const samples = fs.readFileSync(new URL('../prototype/009-1-data-drive.js', import.meta.url), 'utf8');

  for (const source of [drive, project]) {
    assert.match(source, /添加外部链接/);
    assert.match(source, /打开原链接/);
    assert.match(source, /复制外部链接/);
    assert.match(source, /编辑链接/);
    assert.match(source, /externalLinkInfo/);
    assert.match(source, /noopener,noreferrer/);
    assert.match(source, /!isExternal[^\n]*canOpen[^\n]*files\.can\('download'/);
  }
  assert.match(drive, /data-drive-action="add-external-link"/);
  assert.match(drive, /#\/collab\?evaProject=/);
  assert.match(drive, /evaTab=files/);
  assert.match(project, /type:'external-link'/);
  assert.match(styles, /\.eva-drive__file-mark\.is-external-link/);
  assert.match(samples, /__EVA_EXTERNAL_LINK_SAMPLES/);
  assert.match(samples, /prod-feishu-docs-link/);
});

test('文件库本地数据升级到 v7 时保留 v5 文件并补入外链示例', () => {
  const values = new Map();
  values.set('eva:file-store:v5', JSON.stringify({schema: 5, records: [{id: 'legacy', spaceId: 'p', projectId: 'p', area: 'project', parent_id: 0, name: '旧文件.pdf', type: 'blob', size: 1}], sharedSpaces: []}));
  const window = {
    localStorage: {getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value)},
    __EVA_EXTERNAL_LINK_SAMPLES: [{id: 'sample-link', spaceId: 'p', projectId: 'p', area: 'project', parent_id: 0, name: '示例链接', type: 'external_link', size: 0, external: {url: 'https://example.com/', provider: 'web', kind: 'unknown', host: 'example.com'}}]
  };
  const {members, sharing} = setup({window});
  const files = sharing.bootstrap(members);

  assert.ok(files.snapshot().some(item => item.id === 'legacy'));
  assert.ok(files.snapshot().some(item => item.id === 'sample-link'));
  files.createExternalLink('a', 'p', {name: '触发持久化', url: 'https://another.example.com'});
  assert.equal(JSON.parse(values.get('eva:file-store:v7')).schema, 7);
});


test('外链示例仅迁移一次，永久删除后刷新不复活', () => {
  const values = new Map([['eva:file-store:v7', JSON.stringify({schema: 7, records: []})]]);
  const window = {localStorage: {getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key)},
    __EVA_EXTERNAL_LINK_SAMPLES: [{id: 'sample-link', spaceId: 'p', projectId: 'p', area: 'project', parent_id: 0, name: '示例链接', type: 'external_link', size: 0, external: {url: 'https://example.com/', provider: 'web', kind: 'unknown', host: 'example.com'}}]};
  const {members, sharing} = setup({window});
  let files = sharing.bootstrap(members);
  assert.ok(files.list('p', 'a').some(item => item.id === 'sample-link'));
  assert.equal(JSON.parse(values.get('eva:file-store:v7')).externalLinksDemoV1, true);
  files.trash('a', 'sample-link');
  files.restore('a', 'sample-link');
  files.trash('a', 'sample-link');
  files.removeForever('a', 'sample-link');
  files = sharing.bootstrap(members);
  assert.equal(files.list('p', 'a').some(item => item.id === 'sample-link'), false);
});

test('回收站外链不能编辑，移动外链不能造成同目录重复 URL', () => {
  const {files} = setup();
  const first = files.createExternalLink('a', 'p', {name: '根目录', url: 'https://example.com'});
  const folder = files.createFolder('a', 'p', '资料');
  const nested = files.createExternalLink('a', 'p', {name: '子目录', url: 'https://example.com/'}, folder);
  assert.throws(() => files.move('a', nested, 0), /已存在/);
  assert.equal(files.list('p', 'a').find(item => item.id === nested).parent_id, folder);
  files.trash('a', first);
  assert.throws(() => files.updateExternalLink('a', first, {name: '非法更新'}), /回收站/);
});

test('恢复外链不会在原目录生成重复 URL', () => {
  const {files}=setup();
  const first=files.createExternalLink('a','p',{name:'旧入口',url:'https://example.com'});
  files.trash('a',first);
  files.createExternalLink('a','p',{name:'新入口',url:'https://example.com/'});
  assert.throws(()=>files.restore('a',first),/已存在/);
  assert.ok(files.trashList('p','a').some(item=>item.id===first));
});

test('文件库更改待确认 URL 后必须重新确认，不能沿用前一个地址的确认',()=>{
  const source=fs.readFileSync(new URL('../prototype/020-mode-layer.js',import.meta.url),'utf8');
  const start=source.indexOf('  function confirmDialog()'),end=source.indexOf('  function bridgeSelectedResource()',start);
  let submitted;
  const state={dialog:{type:'edit-external-link',id:'link',url:'https://second.example/',confirmHostChange:true}};
  vm.runInNewContext(source.slice(start,end)+';confirmDialog();',{state,fileActor:()=> 'a',fileContext:()=>({files:{snapshot:()=>[{id:'link'}],updateExternalLink:(actor,id,draft)=>{submitted=draft;}}}),document:{getElementById:id=>id==='eva-drive-dialog-external-url'?{value:'https://third.example/'}:null},renderDrive:()=>{},showToast:()=>{}});
  assert.equal(submitted.confirmHostChange,false);
});
