import { createCommentsStore } from './comments-store.mjs';

const config = {
  url: 'https://gmkfxrmgvczafiohtbhy.supabase.co',
  key: 'sb_publishable_8wNaj1kGhJ5jM1_XAnN7rA_NVsUUU42',
};
const store = createCommentsStore(config);
const state = { rows: [], target: null, picking: false };

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const currentPage = () => location.hash || '#/';
const shortTime = value => new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
const quoteOf = element => String(element?.innerText || element?.textContent || '').replace(/\s+/g,' ').trim().slice(0,120);

function selectorOf(element) {
  let node = element;
  while (node && node !== document.body) {
    if (node.id) return `#${CSS.escape(node.id)}`;
    for (const key of ['data-eva-nav-id','data-channel-id','data-message-id']) {
      if (node.hasAttribute?.(key)) return `[${key}="${CSS.escape(node.getAttribute(key))}"]`;
    }
    node = node.parentElement;
  }
  return '';
}

function resolveAnchor(anchor = {}) {
  if (anchor.selector) {
    try { const hit = document.querySelector(anchor.selector); if (hit) return hit; } catch {}
  }
  if (!anchor.quote) return null;
  return [...document.querySelectorAll('main *')].find(node => quoteOf(node) === anchor.quote) || null;
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'eva-review-toast'; node.textContent = message;
  document.body.append(node); setTimeout(() => node.remove(), 2400);
}

function ensureUI() {
  if (document.querySelector('.eva-review-panel')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="eva-review-panel" hidden aria-label="原型批注">
      <header class="eva-review-head"><strong>Comments</strong><span class="eva-review-mode">云端共享</span><button class="eva-review-button" data-review-add>添加批注</button><button class="eva-review-close" data-review-close aria-label="关闭">×</button></header>
      <div class="eva-review-list"></div>
    </aside>
    <div class="eva-review-dialog" hidden role="dialog" aria-modal="true" aria-labelledby="eva-review-title">
      <form class="eva-review-card"><h2 id="eva-review-title">添加批注</h2><p data-review-quote></p>
        <label>你的名字</label><input name="author" maxlength="40" autocomplete="name" placeholder="例如：周羽枫" required>
        <label>类型</label><select name="kind"><option value="issue">这里不对</option><option value="idea">我有个想法</option><option value="question">我没看懂</option><option value="praise">这个好</option></select>
        <label>意见</label><textarea name="body" maxlength="2000" placeholder="具体说说希望怎么改" required></textarea><div class="eva-review-error"></div>
        <div class="eva-review-actions"><button type="button" class="eva-review-button secondary" data-review-cancel>取消</button><button type="submit" class="eva-review-button">提交</button></div>
      </form>
    </div>`);
  const savedName = localStorage.getItem('eva-review-author') || '';
  document.querySelector('.eva-review-card [name=author]').value = savedName;
  document.querySelector('[data-review-close]').onclick = () => document.querySelector('.eva-review-panel').hidden = true;
  document.querySelector('[data-review-add]').onclick = startPicking;
  document.querySelector('[data-review-cancel]').onclick = closeDialog;
  document.querySelector('.eva-review-card').onsubmit = submitComment;
}

async function refresh() {
  ensureUI();
  const list = document.querySelector('.eva-review-list');
  list.innerHTML = '<div class="eva-review-empty">正在读取…</div>';
  try { state.rows = await store.list(currentPage()); renderList(); }
  catch (error) { list.innerHTML = `<div class="eva-review-empty">云端读取失败<br>${escapeHtml(error.message)}</div>`; }
}

function renderList() {
  const list = document.querySelector('.eva-review-list');
  if (!state.rows.length) { list.innerHTML = '<div class="eva-review-empty">这个页面还没有批注</div>'; return; }
  list.innerHTML = state.rows.map(row => `<article class="eva-review-item"><div class="eva-review-meta"><strong>${escapeHtml(row.author_name)}</strong><span>${escapeHtml(shortTime(row.created_at))}</span><span>${escapeHtml({issue:'这里不对',idea:'想法',question:'疑问',praise:'认可'}[row.kind]||row.kind)}</span></div><div class="eva-review-body">${escapeHtml(row.body)}</div>${row.anchor?.quote?`<button class="eva-review-anchor" data-review-anchor="${escapeHtml(row.id)}">定位：${escapeHtml(row.anchor.quote.slice(0,36))}</button>`:''}</article>`).join('');
  list.querySelectorAll('[data-review-anchor]').forEach(button => button.onclick = () => {
    const row = state.rows.find(item => item.id === button.dataset.reviewAnchor);
    const target = resolveAnchor(row?.anchor); if (!target) return toast('原位置已发生变化');
    target.scrollIntoView({ behavior:'smooth', block:'center' }); target.classList.add('eva-review-target'); setTimeout(()=>target.classList.remove('eva-review-target'),1800);
  });
}

function openPanel() { ensureUI(); document.querySelector('.eva-review-panel').hidden = false; refresh(); }
function startPicking() { state.picking = true; document.body.classList.add('eva-review-picking'); toast('点击页面中需要批注的位置'); }
function openDialog(target) {
  state.target = target; const quote = quoteOf(target);
  document.querySelector('[data-review-quote]').textContent = quote ? `批注位置：${quote.slice(0,80)}` : '批注当前页面';
  document.querySelector('.eva-review-dialog').hidden = false;
  document.querySelector('.eva-review-card [name=body]').focus();
}
function closeDialog() { document.querySelector('.eva-review-dialog').hidden = true; state.target = null; }

async function submitComment(event) {
  event.preventDefault(); const form = event.currentTarget; const error = form.querySelector('.eva-review-error'); error.textContent='';
  const submit = form.querySelector('[type=submit]'); submit.disabled = true;
  try {
    const row = await store.create({ page_path:currentPage(), anchor:{selector:selectorOf(state.target),quote:quoteOf(state.target)}, author_name:form.author.value, body:form.body.value, kind:form.kind.value });
    localStorage.setItem('eva-review-author', row.author_name); form.body.value=''; closeDialog(); await refresh(); toast('批注已同步');
  } catch (cause) { error.textContent = cause.message; }
  finally { submit.disabled = false; }
}

document.addEventListener('click', event => {
  if (event.target.closest('.eva-review-panel,.eva-review-dialog')) return;
  if (state.picking) { event.preventDefault(); event.stopPropagation(); state.picking=false; document.body.classList.remove('eva-review-picking'); openDialog(event.target); return; }
  const label = event.target.closest('button,[role=button]')?.textContent?.trim();
  if (label === '反馈问题') { event.preventDefault(); event.stopPropagation(); openPanel(); }
}, true);
window.addEventListener('hashchange', () => { if (!document.querySelector('.eva-review-panel')?.hidden) refresh(); });
ensureUI();
