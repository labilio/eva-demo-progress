import { createCommentsStore } from './comments-store.mjs';
import { afterBrowserPaint, buildAnchorRecord, buildProjectViewContext, clampFloatingPosition, createPageChangeDetector, createPageRequestGate, hasDragMoved, inferProjectTab, isVisiblePin, normalizeStatus, pageLabel, partitionCommentsByCompletion, pointWithinRect } from './comments-domain.mjs';
import { COMMENTS_CONFIG } from './comments-config.mjs';

const store = createCommentsStore(COMMENTS_CONFIG);
const state = { rows: [], target: null, picking: false, pinMode: localStorage.getItem('eva-review-pin-mode') || 'all', activeId: null, replyingId: null, replyDrafts: new Map(), submittingReplies: new Set(), listRenderPending: false, locateRevision: 0, draggedUntil: 0 };

const KINDS = {
  copy: { label: '改文案', className: 'copy' },
  ui: { label: '调整 UI', className: 'ui' },
  rebuild: { label: '重做此处', className: 'rebuild' },
  function: { label: '补充/优化功能', className: 'function' },
  ready: { label: '已基本定稿', className: 'ready' },
  issue: { label: '补充/优化功能', className: 'function' },
  idea: { label: '建议', className: 'ui' },
  question: { label: '补充/优化功能', className: 'function' },
  praise: { label: '调整 UI', className: 'ui' },
};
const STATUSES = {
  open: '待讨论',
  approved: '已确认',
  doing: '原型修改中',
  done: '原型已改完',
};

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const cssEscape = value => window.CSS?.escape ? CSS.escape(String(value)) : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
const currentPage = () => location.hash || '#/';
const shortTime = value => new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
const quoteOf = element => String(element?.innerText || element?.textContent || element?.getAttribute?.('aria-label') || element?.getAttribute?.('placeholder') || '').replace(/\s+/g,' ').trim().slice(0,120);

function icon(name, size = 16) {
  const nodes = {
    add: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    comment: '<path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h6"/><path d="M19 3v6M16 6h6"/>',
    locate: '<circle cx="12" cy="12" r="7"/><path d="M12 9v6M9 12h6M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    eye: '<path d="M2.1 12a10 10 0 0 1 19.8 0 10 10 0 0 1-19.8 0"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m2 2 20 20M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.5 10.5 0 0 1 22 12a10.8 10.8 0 0 1-3.1 4.7M6.6 6.6A10.7 10.7 0 0 0 2 12a10.5 10.5 0 0 0 12.1 7.8"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    reply: '<path d="m9 17-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
  };
  return `<svg class="lucide eva-review-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${nodes[name] || ''}</svg>`;
}

const requestGate = createPageRequestGate(() => 'all-comments');
const detectPageChange = createPageChangeDetector(currentPage, () => {
  schedulePins();
});

function stableIdOf(element) {
  let node = element;
  while (node && node !== document.body) {
    if (node.id && !/^(el-id-|headlessui|v-|:r)/.test(node.id)) return node.id;
    node = node.parentElement;
  }
  return '';
}

function selectorOf(element) {
  const segments = [];
  let node = element;
  while (node && node !== document.body && segments.length < 8) {
    const suffix = segments.length ? ` > ${segments.join(' > ')}` : '';
    if (node.id && !/^(el-id-|headlessui|v-|:r)/.test(node.id)) return `#${cssEscape(node.id)}${suffix}`;
    for (const key of ['data-review-anchor','data-eva-nav-id','data-channel-id','data-message-id','data-eva-native-page']) {
      if (node.hasAttribute?.(key)) return `[${key}="${cssEscape(node.getAttribute(key))}"]${suffix}`;
    }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName) && node.getAttribute('name')) {
      return `${node.tagName.toLowerCase()}[name="${cssEscape(node.getAttribute('name'))}"]${suffix}`;
    }
    const tag = node.tagName?.toLowerCase();
    if (!tag) break;
    const siblings = node.parentElement ? [...node.parentElement.children].filter(item => item.tagName === node.tagName) : [];
    segments.unshift(tag + (siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : ''));
    node = node.parentElement;
  }
  return segments.join(' > ');
}

function pickTarget(element) {
  if (!element || element.closest?.('[data-review-ui]')) return null;
  const interactive = element.closest?.('button,input,textarea,select,a,[role="button"],[role="textbox"],[contenteditable="true"],[data-eva-nav-id],[data-channel-id],[data-message-id]');
  const target = interactive || element;
  if (!target.isConnected || ['BODY','HTML'].includes(target.tagName)) return null;
  const rect = target.getBoundingClientRect();
  if (!rect.width || !rect.height || (rect.width > innerWidth * .94 && rect.height > innerHeight * .85)) return null;
  return target;
}

function currentViewContext() {
  const frame = document.querySelector('.collab-frame');
  if (!frame) return null;
  const projectName = frame.querySelector('.collab-sp-chip .nm')?.textContent?.trim() || '';
  const activeTab = frame.querySelector('.collab-tab[aria-selected="true"], .collab-tab.is-active');
  return buildProjectViewContext({
    pagePath: currentPage(),
    projectId: frame.dataset.evaProjectId,
    projectName,
    tabLabel: activeTab?.textContent || frame.dataset.evaProjectTab,
  });
}

function anchorOf(element, clientX, clientY) {
  const selector = selectorOf(element);
  let locatorTarget = element;
  try { locatorTarget = document.querySelector(selector) || element; } catch {}
  const rect = locatorTarget.getBoundingClientRect();
  const point = pointWithinRect(rect, clientX, clientY);
  const section = element.closest?.('section,article,main,form,[role="dialog"]');
  const heading = section?.querySelector?.('h1,h2,h3,h4,[role="heading"]') || document.querySelector('main h1,main h2,[role="main"] h1,[role="main"] h2');
  return buildAnchorRecord({
    page: currentPage(),
    selector,
    anchorId: stableIdOf(locatorTarget),
    quote: quoteOf(element),
    role: element.getAttribute?.('role') || '',
    label: element.getAttribute?.('aria-label') || '',
    placeholder: element.getAttribute?.('placeholder') || '',
    tag: element.tagName?.toLowerCase() || '',
    inputType: element.getAttribute?.('type') || '',
    heading: quoteOf(heading),
    view: currentViewContext(),
    rx: point.rx,
    ry: point.ry,
  });
}

function resolveAnchor(anchor = {}) {
  if (anchor.selector) {
    try { const hit = document.querySelector(anchor.selector); if (pickTarget(hit)) return hit; } catch {}
  }
  if (anchor.anchorId) {
    const hit = document.getElementById(anchor.anchorId); if (pickTarget(hit)) return hit;
  }
  const target = anchor.target || anchor;
  if (target.label) {
    try { const hit = document.querySelector(`[aria-label="${cssEscape(target.label)}"]`); if (pickTarget(hit)) return hit; } catch {}
  }
  if (target.placeholder) {
    try { const hit = document.querySelector(`[placeholder="${cssEscape(target.placeholder)}"]`); if (pickTarget(hit)) return hit; } catch {}
  }
  if (!anchor.quote) return null;
  return [...document.querySelectorAll('main *,#root *')].find(node => !node.closest?.('[data-review-ui]') && quoteOf(node) === anchor.quote && pickTarget(node)) || null;
}

function ensureUI() {
  if (document.querySelector('.eva-review-panel')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="eva-review-pin-layer" data-review-ui aria-live="polite"></div>
    <div class="eva-review-hover" data-review-ui hidden></div>
    <div class="eva-review-picker-shield" data-review-ui hidden aria-label="选择批注位置"></div>
    <button type="button" class="eva-review-launcher" data-review-ui data-review-launcher aria-expanded="false" aria-controls="eva-review-panel">${icon('comment',15)}<span>批注</span></button>
    <button type="button" class="eva-review-restore" data-review-ui data-review-restore hidden aria-label="显示批注">${icon('eye',15)}</button>
    <aside id="eva-review-panel" class="eva-review-panel" data-review-ui hidden aria-label="原型批注">
      <header class="eva-review-head" data-review-drag-handle><div><strong>批注</strong><span>所有同事共享</span></div><div class="eva-review-head-actions"><button type="button" class="eva-review-icon-button" data-review-hide aria-label="隐藏批注入口">${icon('eyeOff')}</button><button type="button" class="eva-review-icon-button" data-review-close aria-label="收起批注">${icon('close')}</button></div></header>
      <div class="eva-review-toolbar">
        <button type="button" class="eva-review-primary" data-review-add>${icon('add')}添加批注</button>
      </div>
      <div class="eva-review-visibility" role="radiogroup" aria-label="全局批注显示">
        <button type="button" data-review-pin-mode="all" aria-pressed="${state.pinMode === 'all'}">全部查看</button>
        <button type="button" data-review-pin-mode="approved" aria-pressed="${state.pinMode === 'approved'}">仅已确认</button>
        <button type="button" data-review-pin-mode="off" aria-pressed="${state.pinMode === 'off'}">关闭批注</button>
      </div>
      <div class="eva-review-list"></div>
    </aside>
    <div class="eva-review-dialog" data-review-ui hidden role="dialog" aria-modal="true" aria-labelledby="eva-review-title">
      <form class="eva-review-card" autocomplete="off">
        <header><div><h2 id="eva-review-title">添加批注</h2><p data-review-quote></p></div><button type="button" class="eva-review-icon-button" data-review-cancel aria-label="关闭">${icon('close')}</button></header>
        <div class="eva-review-identity"><label data-review-author-field>你的名字（选填）<input name="author" maxlength="40" autocomplete="off" placeholder="不填则显示匿名同事"></label><div data-review-author-saved hidden><span>提交人</span><strong data-review-author-name></strong><button type="button" data-review-change-author>更换</button></div></div>
        <label>批注类型<select name="kind"><option value="copy">改文案</option><option value="ui">调整 UI</option><option value="rebuild">重做</option><option value="function">补充/优化功能</option><option value="ready">已基本定稿</option></select></label>
        <label>批注内容<textarea name="body" autocomplete="off" maxlength="2000" placeholder="哪里需要调整？希望改成什么样？" required></textarea></label>
        <div class="eva-review-error" role="alert"></div>
        <footer><button type="button" class="eva-review-secondary" data-review-cancel>取消</button><button type="submit" class="eva-review-primary">提交批注</button></footer>
      </form>
    </div>`);
  renderIdentity();
  document.querySelector('[data-review-launcher]').onclick = () => { if (Date.now() > state.draggedUntil) openPanel(); };
  document.querySelector('[data-review-close]').onclick = closePanel;
  document.querySelector('[data-review-hide]').onclick = hideReviewEntry;
  document.querySelector('[data-review-restore]').onclick = restoreReviewEntry;
  document.querySelector('[data-review-add]').onclick = startPicking;
  document.querySelectorAll('[data-review-cancel]').forEach(button => button.onclick = closeDialog);
  document.querySelectorAll('[data-review-pin-mode]').forEach(button => button.onclick = () => setPinMode(button.dataset.reviewPinMode));
  document.querySelector('[data-review-change-author]').onclick = () => { localStorage.removeItem('eva-review-author'); renderIdentity({ focus:true }); };
  const pickerShield = document.querySelector('.eva-review-picker-shield');
  pickerShield.onpointermove = event => updatePickerTarget(event.clientX, event.clientY);
  pickerShield.onclick = event => selectPickerTarget(event.clientX, event.clientY);
  document.querySelector('.eva-review-card').onsubmit = submitComment;
  document.querySelector('.eva-review-card [name=body]').onkeydown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  };
  bindFloatingDrag(document.querySelector('.eva-review-panel'), document.querySelector('[data-review-drag-handle]'), 'eva-review-panel-position');
  bindFloatingDrag(document.querySelector('[data-review-launcher]'), document.querySelector('[data-review-launcher]'), 'eva-review-launcher-position-v3');
  applySavedPosition(document.querySelector('.eva-review-panel'), 'eva-review-panel-position');
  applySavedPosition(document.querySelector('[data-review-launcher]'), 'eva-review-launcher-position-v3');
  syncReviewEntryVisibility();
}

function readPosition(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function placeFloating(element, position) {
  if (!element || !position) return;
  const rect = element.getBoundingClientRect();
  const next = clampFloatingPosition({ ...position, width:rect.width, height:rect.height, viewportWidth:innerWidth, viewportHeight:innerHeight, margin:8 });
  element.style.left = `${next.x}px`; element.style.top = `${next.y}px`; element.style.right = 'auto';
  return next;
}

function applySavedPosition(element, key) { placeFloating(element, readPosition(key)); }

function bindFloatingDrag(element, handle, storageKey) {
  if (!element || !handle) return;
  handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || (element !== handle && event.target.closest('button,select,input,textarea,a'))) return;
    const rect = element.getBoundingClientRect();
    const start = { x:event.clientX, y:event.clientY }; const origin = { x:rect.left, y:rect.top }; let moved = false;
    handle.setPointerCapture(event.pointerId);
    const move = current => {
      moved ||= hasDragMoved(start, { x:current.clientX, y:current.clientY });
      if (!moved) return;
      placeFloating(element, { x:origin.x + current.clientX - start.x, y:origin.y + current.clientY - start.y });
    };
    const finish = current => {
      handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', finish); handle.removeEventListener('pointercancel', finish);
      if (!moved) return;
      const saved = placeFloating(element, { x:element.getBoundingClientRect().left, y:element.getBoundingClientRect().top });
      localStorage.setItem(storageKey, JSON.stringify(saved)); state.draggedUntil = Date.now() + 250;
    };
    handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', finish); handle.addEventListener('pointercancel', finish);
  });
}

function syncReviewEntryVisibility() {
  const hidden = localStorage.getItem('eva-review-entry-hidden') === 'true';
  document.querySelector('[data-review-restore]').hidden = !hidden;
  if (hidden) { document.querySelector('[data-review-launcher]').hidden = true; document.querySelector('.eva-review-panel').hidden = true; }
}

function hideReviewEntry() {
  localStorage.setItem('eva-review-entry-hidden', 'true'); cancelPicking(); syncReviewEntryVisibility();
}

function restoreReviewEntry() {
  localStorage.removeItem('eva-review-entry-hidden');
  document.querySelector('[data-review-restore]').hidden = true; document.querySelector('[data-review-launcher]').hidden = false;
}

function renderIdentity({ focus = false } = {}) {
  const author = localStorage.getItem('eva-review-author') || '';
  const field = document.querySelector('[data-review-author-field]');
  const saved = document.querySelector('[data-review-author-saved]');
  const input = field?.querySelector('input');
  if (!field || !saved || !input) return;
  field.hidden = Boolean(author); saved.hidden = !author; input.required = false; input.value = author;
  document.querySelector('[data-review-author-name]').textContent = author;
  if (focus && !author) input.focus();
}

async function refresh({ quiet = false } = {}) {
  ensureUI();
  const request = requestGate.start();
  const list = document.querySelector('.eva-review-list');
  if (!quiet && !list.querySelector('[data-review-item]') && !document.querySelector('.eva-review-panel').hidden) list.innerHTML = '<div class="eva-review-empty">正在读取批注…</div>';
  try {
    const rows = await store.list();
    if (!requestGate.isCurrent(request)) return;
    state.rows = rows.map(row => ({ ...row, status: normalizeStatus(row.status), replies: row.replies || [] }));
    renderList(); schedulePins();
  } catch (error) {
    if (!requestGate.isCurrent(request)) return;
    // A failed background read must not destroy an existing reply editor.
    if (list.querySelector('[data-review-item]')) { if (!quiet) toast(error.message); return; }
    if (!document.querySelector('.eva-review-panel').hidden) list.innerHTML = `<div class="eva-review-empty"><strong>批注读取失败</strong><span>${escapeHtml(error.message)}</span><button type="button" data-review-retry>重新读取</button></div>`;
    list.querySelector('[data-review-retry]')?.addEventListener('click', () => refresh());
  }
}

function renderList() {
  const list = document.querySelector('.eva-review-list');
  if (!list) return;
  // Polling still reads shared data, but never replaces a live editor (including IME).
  const editing = document.activeElement?.closest('[data-review-reply]');
  if (editing && editing.dataset.reviewReply === state.replyingId) {
    state.listRenderPending = true;
    return;
  }
  state.listRenderPending = false;
  const rows = state.rows
    .filter(row => state.pinMode === 'all' || (state.pinMode === 'approved' && row.status === 'approved'))
    .sort((a,b) => Number(b.seq || 0) - Number(a.seq || 0));
  if (!rows.length) {
    list.innerHTML = state.pinMode === 'off'
      ? '<div class="eva-review-empty"><strong>批注已关闭</strong><span>切换到“全部查看”或“仅已确认”即可恢复。</span></div>'
      : '<div class="eva-review-empty"><strong>这里还没有批注</strong><span>点击“添加批注”，再选择页面中的具体位置。</span></div>';
    return;
  }
  const { pending, completed } = partitionCommentsByCompletion(rows);
  list.innerHTML = pending.map(commentHtml).join('')
    + (completed.length ? `<div class="eva-review-completed-divider"><span>原型已改完</span></div>${completed.map(commentHtml).join('')}` : '');
  bindListEvents();
  if (state.activeId) list.querySelector(`[data-review-item="${cssEscape(state.activeId)}"]`)?.scrollIntoView({ block:'nearest' });
}

function commentHtml(row) {
  const kind = KINDS[row.kind] || KINDS.issue;
  const savedAuthor = localStorage.getItem('eva-review-author') || '';
  const replies = [...(row.replies || [])].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
  const options = Object.entries(STATUSES).map(([value,label]) => `<option value="${value}"${row.status === value ? ' selected' : ''}>${label}</option>`).join('');
  const replying = state.replyingId === row.id;
  const draft = state.replyDrafts.get(row.id) || { author: '', body: '' };
  const submitting = state.submittingReplies.has(row.id);
  return `<article class="eva-review-item ${state.activeId === row.id ? 'is-active' : ''}" data-review-item="${escapeHtml(row.id)}">
    <div class="eva-review-item-head"><span class="eva-review-seq">#${escapeHtml(row.seq || '—')}</span><span class="eva-review-kind ${kind.className}">${kind.label}</span><span class="eva-review-page" data-review-page="${escapeHtml(row.page_path)}">${escapeHtml(pageLabel(row.page_path))}</span><span class="eva-review-author">${escapeHtml(row.author_name)}</span><time>${escapeHtml(shortTime(row.created_at))}</time></div>
    <button type="button" class="eva-review-anchor" data-review-locate="${escapeHtml(row.id)}">${icon('locate',14)}<span>${escapeHtml(row.anchor?.quote?.slice(0,54) || `前往${pageLabel(row.page_path)}`)}</span></button>
    <div class="eva-review-body">${escapeHtml(row.body)}</div>
    ${replies.length ? `<div class="eva-review-replies">${replies.map(reply => `<div><header><strong>${escapeHtml(reply.author_name)}</strong><time>${escapeHtml(shortTime(reply.created_at))}</time></header><p>${escapeHtml(reply.body)}</p></div>`).join('')}</div>` : ''}
    ${replying ? `<form class="eva-review-reply${savedAuthor ? ' has-author' : ''}" data-review-reply="${escapeHtml(row.id)}" autocomplete="off">${savedAuthor ? '' : `<input name="author" autocomplete="off" value="${escapeHtml(draft.author)}" ${submitting ? 'readonly' : ''} maxlength="40" placeholder="你的名字（选填）" aria-label="回复人姓名">`}<input name="body" autocomplete="off" value="${escapeHtml(draft.body)}" ${submitting ? 'readonly' : ''} maxlength="2000" placeholder="回复这条批注" aria-label="回复内容" required><button type="submit" ${submitting ? 'disabled' : ''} aria-label="发送回复">${icon('send',15)}</button></form>` : ''}
    <footer><label class="eva-review-status"><span class="eva-review-status-light is-${escapeHtml(row.status)}" aria-hidden="true"></span><select data-review-status="${escapeHtml(row.id)}" aria-label="批注状态">${options}</select></label><div class="eva-review-actions">${row.status === 'done' ? '' : `<button type="button" class="eva-review-icon-button is-complete" data-review-complete="${escapeHtml(row.id)}" aria-label="标记为原型已改完">${icon('check')}</button>`}<button type="button" class="eva-review-icon-button" data-review-reply-toggle="${escapeHtml(row.id)}" aria-expanded="${replying}" aria-label="${replying ? '收起回复' : '回复批注'}">${icon('reply')}</button><button type="button" class="eva-review-icon-button is-danger" data-review-delete="${escapeHtml(row.id)}" aria-label="删除批注">${icon('trash')}</button></div></footer>
  </article>`;
}

function bindListEvents() {
  document.querySelectorAll('[data-review-locate]').forEach(button => button.onclick = () => locateComment(button.dataset.reviewLocate));
  document.querySelectorAll('[data-review-reply-toggle]').forEach(button => button.onclick = () => {
    state.replyingId = state.replyingId === button.dataset.reviewReplyToggle ? null : button.dataset.reviewReplyToggle;
    renderList();
    document.querySelector(`[data-review-reply="${cssEscape(state.replyingId)}"] [name="body"]`)?.focus();
  });
  document.querySelectorAll('[data-review-delete]').forEach(button => button.onclick = async () => {
    const id = button.dataset.reviewDelete;
    const row = state.rows.find(item => item.id === id);
    if (!confirm(`删除批注 #${row?.seq || '—'}？\n此操作会同时删除回复，且无法撤销。`)) return;
    button.disabled = true;
    try {
      await store.remove(id);
      state.replyDrafts.delete(id);
      if (state.activeId === id) state.activeId = null;
      if (state.replyingId === id) state.replyingId = null;
      await refresh({ quiet:true });
      toast('批注已删除');
    } catch (error) { toast(error.message); button.disabled = false; }
  });
  document.querySelectorAll('[data-review-complete]').forEach(button => button.onclick = async () => {
    button.disabled = true;
    try { await store.updateStatus(button.dataset.reviewComplete, 'done'); await refresh({ quiet:true }); toast('已标记为“原型已改完”'); }
    catch (error) { toast(error.message); await refresh({ quiet:true }); }
  });
  document.querySelectorAll('[data-review-status]').forEach(select => select.onchange = async () => {
    select.disabled = true;
    try { await store.updateStatus(select.dataset.reviewStatus, select.value); await refresh({ quiet:true }); toast(`已设为“${STATUSES[select.value]}”`); }
    catch (error) { toast(error.message); await refresh({ quiet:true }); }
    finally { select.disabled = false; }
  });
  document.querySelectorAll('[data-review-reply]').forEach(form => {
    const id = form.dataset.reviewReply;
    form.oninput = () => state.replyDrafts.set(id, { author: form.author?.value || '', body: form.body.value });
    form.onfocusout = () => setTimeout(() => {
      if (state.listRenderPending) renderList();
    }, 0);
    form.onkeydown = event => {
      if (event.key === 'Enter' && (event.isComposing || event.keyCode === 229)) event.preventDefault();
    };
    form.onsubmit = async event => {
      event.preventDefault();
      if (state.submittingReplies.has(id)) return;
      form.oninput();
      const submit = form.querySelector('button'); submit.disabled = true;
      state.submittingReplies.add(id);
      form.querySelectorAll('input').forEach(input => input.readOnly = true);
      try {
        const authorName = localStorage.getItem('eva-review-author') || form.author?.value || '';
        const reply = await store.addReply(id, { author_name: authorName, body: form.body.value });
        state.replyDrafts.delete(id);
        localStorage.setItem('eva-review-author', reply.author_name);
        if (state.replyingId === id) state.replyingId = null;
        renderIdentity(); renderList(); await refresh({ quiet:true }); toast('回复已同步');
      } catch (error) { toast(error.message); }
      finally {
        state.submittingReplies.delete(id);
        const currentForm = document.querySelector(`[data-review-reply="${cssEscape(id)}"]`);
        if (currentForm) {
          currentForm.querySelector('button').disabled = false;
          currentForm.querySelectorAll('input').forEach(input => input.readOnly = false);
        }
      }
    };
  });
}

function openPanel() {
  ensureUI();
  document.querySelector('.eva-review-panel').hidden = false;
  const launcher = document.querySelector('[data-review-launcher]'); launcher.hidden = true; launcher.setAttribute('aria-expanded', 'true');
  refresh();
}

function closePanel() {
  document.querySelector('.eva-review-panel').hidden = true;
  const launcher = document.querySelector('[data-review-launcher]'); launcher.hidden = false; launcher.setAttribute('aria-expanded', 'false');
  cancelPicking();
}

function startPicking() {
  state.picking = true; document.body.classList.add('eva-review-picking');
  document.querySelector('.eva-review-panel').hidden = true;
  document.querySelector('[data-review-launcher]').hidden = true;
  document.querySelector('.eva-review-picker-shield').hidden = false;
  toast('移动鼠标选择具体位置，点击后添加批注；按 Esc 取消');
}

function cancelPicking() {
  state.picking = false; state.target = null; document.body.classList.remove('eva-review-picking');
  document.querySelector('.eva-review-picker-shield').hidden = true;
  const hover = document.querySelector('.eva-review-hover'); if (hover) hover.hidden = true;
}

function openDialog(target, point) {
  state.target = { element: target, anchor: anchorOf(target, point.x, point.y) };
  document.querySelector('[data-review-quote]').textContent = state.target.anchor.quote ? `已选中：${state.target.anchor.quote.slice(0,80)}` : `已选中：${state.target.anchor.target.placeholder || state.target.anchor.target.label || '当前控件'}`;
  document.querySelector('.eva-review-dialog').hidden = false;
  document.querySelector('.eva-review-card [name=body]').focus();
}

function closeDialog() {
  document.querySelector('.eva-review-dialog').hidden = true; state.target = null;
  document.querySelector('.eva-review-panel').hidden = false;
}

async function submitComment(event) {
  event.preventDefault();
  const form = event.currentTarget; const error = form.querySelector('.eva-review-error'); error.textContent = '';
  const submit = form.querySelector('[type=submit]'); submit.disabled = true;
  try {
    const authorName = localStorage.getItem('eva-review-author') || form.author.value;
    const row = await store.create({ page_path:currentPage(), anchor:state.target?.anchor || {}, author_name:authorName, body:form.body.value, kind:form.kind.value, status:'open' });
    localStorage.setItem('eva-review-author', row.author_name); renderIdentity(); form.body.value = ''; state.activeId = row.id; closeDialog(); await refresh(); toast(`批注 #${row.seq || ''} 已同步`);
  } catch (cause) { error.textContent = cause.message; }
  finally { submit.disabled = false; }
}

async function locateComment(id) {
  const row = state.rows.find(item => item.id === id);
  if (!row) return;
  const revision = ++state.locateRevision;
  if (row.page_path !== currentPage()) {
    location.hash = row.page_path;
  }
  if (!await waitForRouteSurface(row)) return toast('页面切换未完成，请重试');
  if (revision !== state.locateRevision) return;
  await restoreViewContext(row);
  if (revision !== state.locateRevision) return;
  await waitForAnchor(row.anchor);
  const target = resolveAnchor(row.anchor);
  if (!target) return toast('页面已经变化，暂时找不到原位置');
  state.activeId = id; target.scrollIntoView({ behavior:'smooth', block:'center' });
  target.classList.add('eva-review-target'); setTimeout(() => target.classList.remove('eva-review-target'), 1800);
  renderList();
}

const ROUTE_SURFACES = {
  '#/collab': '.eva-project-directory, .collab-frame',
  '#/guid': '#eva-personal-history-column',
  '#/messages': '.ch-main, [data-eva-channel-surface]',
  '#/contacts': '[data-eva-native-page="contacts"]',
  '#/drive': '[data-eva-native-page="drive"]',
};

async function waitForRouteSurface(row, attempts = 50) {
  const route = String(row.page_path || '').split('?')[0];
  const stubPage = route.startsWith('#/eva-stub/') ? decodeURIComponent(route.slice('#/eva-stub/'.length)) : '';
  const stubIds = { '工作板':'workboard', '数字员工':'digital-employees', '技能':'connection-center' };
  const selector = ROUTE_SURFACES[route] || (stubIds[stubPage] ? `[data-eva-native-page="${stubIds[stubPage]}"]` : '#root main');
  const ready = await new Promise(resolve => {
    const check = () => {
      const surface = [...document.querySelectorAll(selector)].find(surface => surface.isConnected && surface.getClientRects().length > 0);
      if (currentPage() === row.page_path && surface) return resolve(true);
      if (attempts-- <= 0) return resolve(false);
      setTimeout(check, 100);
    };
    check();
  });
  if (!ready) return false;
  await afterBrowserPaint();
  return currentPage() === row.page_path;
}

function projectViewMatches(context) {
  const frame = document.querySelector('.collab-frame');
  if (!frame) return false;
  const projectName = frame.querySelector('.collab-sp-chip .nm')?.textContent?.trim() || '';
  const activeTab = frame.querySelector('.collab-tab[aria-selected="true"], .collab-tab.is-active');
  const current = buildProjectViewContext({
    pagePath: currentPage(),
    projectId: frame.dataset.evaProjectId,
    projectName,
    tabLabel: activeTab?.textContent,
  });
  return frame.dataset.evaProjectId === context.projectId && current?.tab === context.tab;
}

function waitForProjectView(context, attempts = 50) {
  return new Promise(resolve => {
    const check = () => {
      if (projectViewMatches(context) || attempts-- <= 0) return resolve();
      setTimeout(check, 100);
    };
    check();
  });
}

async function restoreViewContext(row) {
  const context = row.anchor?.view;
  if (context?.kind === 'project' && context.projectId) {
    openProjectView(context);
    await waitForProjectMount(context.projectId);
    await afterBrowserPaint();
    openProjectView(context);
    await waitForProjectView(context);
    return;
  }
  if (!String(row.page_path || '').startsWith('#/collab') || resolveAnchor(row.anchor)) return;
  const legacyTab = inferProjectTab(row.anchor?.quote);
  if (!legacyTab) return;
  const projectIds = [...new Set([...document.querySelectorAll('[data-eva-project-id]')].map(node => node.dataset.evaProjectId).filter(Boolean))];
  for (const projectId of projectIds) {
    const legacyContext = { kind:'project', projectId, projectName:'', tab:legacyTab };
    openProjectView(legacyContext);
    await waitForProjectMount(projectId);
    await afterBrowserPaint();
    openProjectView(legacyContext);
    await waitForAnchor(row.anchor, 12);
    if (resolveAnchor(row.anchor)) return;
  }
}

function openProjectView(context) {
  window.dispatchEvent(new CustomEvent('eva:open-project-view', {
    detail: { projectId: context.projectId, tab: context.tab },
  }));
}

function waitForProjectMount(projectId, attempts = 40) {
  return new Promise(resolve => {
    const check = () => {
      if (document.querySelector(`.collab-frame[data-eva-project-id="${cssEscape(projectId)}"]`) || attempts-- <= 0) return resolve();
      setTimeout(check, 100);
    };
    check();
  });
}

function waitForAnchor(anchor, attempts = 40) {
  return new Promise(resolve => {
    const check = () => {
      if (resolveAnchor(anchor) || attempts-- <= 0) return resolve();
      setTimeout(check, 100);
    };
    check();
  });
}

function setPinMode(mode) {
  state.pinMode = ['all', 'approved', 'off'].includes(mode) ? mode : 'all';
  document.querySelectorAll('[data-review-pin-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.reviewPinMode === state.pinMode)));
  localStorage.setItem('eva-review-pin-mode', state.pinMode);
  renderList();
  schedulePins();
}

let pinFrame = 0;
function schedulePins() { cancelAnimationFrame(pinFrame); pinFrame = requestAnimationFrame(renderPins); }

function renderPins() {
  const layer = document.querySelector('.eva-review-pin-layer'); if (!layer) return;
  layer.innerHTML = '';
  state.rows.filter(row => isVisiblePin(row, currentPage(), state.pinMode)).forEach(row => {
    const target = resolveAnchor(row.anchor); if (!target) return;
    const rect = target.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) return;
    const x = rect.left + rect.width * Number(row.anchor?.point?.rx ?? row.anchor?.rx ?? .92);
    const y = rect.top + rect.height * Number(row.anchor?.point?.ry ?? row.anchor?.ry ?? .12);
    const pin = document.createElement('button');
    pin.type = 'button'; pin.className = `eva-review-pin ${(KINDS[row.kind] || KINDS.issue).className}`; pin.dataset.reviewUi = ''; pin.textContent = row.seq || '•';
    pin.style.left = `${Math.max(10, Math.min(innerWidth - 30, x))}px`; pin.style.top = `${Math.max(62, Math.min(innerHeight - 30, y))}px`;
    pin.setAttribute('aria-label', `打开批注 ${row.seq}`); pin.onclick = () => { state.activeId = row.id; openPanel(); locateComment(row.id); };
    layer.append(pin);
  });
}

function toast(message) {
  document.querySelector('.eva-review-toast')?.remove();
  const node = document.createElement('div'); node.className = 'eva-review-toast'; node.dataset.reviewUi = ''; node.textContent = message;
  document.body.append(node); setTimeout(() => node.remove(), 2600);
}

function targetBehindPicker(x, y) {
  const shield = document.querySelector('.eva-review-picker-shield');
  shield.style.pointerEvents = 'none';
  const target = pickTarget(document.elementFromPoint(x, y));
  shield.style.pointerEvents = '';
  return target;
}

function updatePickerTarget(x, y) {
  if (!state.picking) return;
  const target = targetBehindPicker(x, y); const hover = document.querySelector('.eva-review-hover');
  if (!target) { hover.hidden = true; state.target = null; return; }
  const rect = target.getBoundingClientRect(); state.target = { element:target };
  hover.hidden = false; hover.style.left = `${rect.left}px`; hover.style.top = `${rect.top}px`; hover.style.width = `${rect.width}px`; hover.style.height = `${rect.height}px`;
}

function selectPickerTarget(x, y) {
  if (!state.picking) return;
  const target = targetBehindPicker(x, y); if (!target) return;
  cancelPicking(); openDialog(target, { x, y });
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.picking) { cancelPicking(); openPanel(); toast('已取消选择'); return; }
  if (event.key === 'Escape' && !document.querySelector('.eva-review-dialog')?.hidden) closeDialog();
});
addEventListener('scroll', schedulePins, true);
addEventListener('resize', schedulePins);
addEventListener('hashchange', detectPageChange);
addEventListener('popstate', detectPageChange);
window.navigation?.addEventListener('currententrychange', detectPageChange);

ensureUI();
new MutationObserver(schedulePins).observe(document.getElementById('root') || document.body, { childList:true, subtree:true });
setInterval(() => { if (!document.hidden && !document.querySelector('.eva-review-panel')?.hidden) refresh({ quiet:true }); }, 15000);
setInterval(detectPageChange, 250);
refresh({ quiet:true });
