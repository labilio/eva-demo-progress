import { getReviewAuthor, setReviewAuthor, subscribeReviewAuthor } from './review-identity.mjs';
import { COMMENTS_CONFIG } from './comments-config.mjs';
import { createCommentsStore } from './comments-store.mjs';
import { MENUS, STATUS_LABELS, KIND_LABELS, menuOf, filterRows, sourceHints, prototypeLink, buildDeveloperPrompt } from './developer-domain.mjs';

const store = createCommentsStore(COMMENTS_CONFIG);
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const icon = name => window.__evaLucide(name, {size:16, strokeWidth:1.8});
const menuIcons = {all:'layout-grid',personal:'sparkles',messages:'message-square',projects:'layout-grid',contacts:'book-user',drive:'hard-drive',workboard:'list-checks',employees:'bot',skills:'unplug',automation:'clock',sites:'globe','agent-create':'sparkles',other:'ellipsis'};
const menuIcon = id => id === 'my-ai' ? '<img class="menu-icon" src="../prototype/assets/my-ai-collaboration.svg" alt="">' : icon(menuIcons[id]);
for (const [selector,name] of [['.head-links a','arrow-left'],['#copy','copy'],['#claim-copy','check'],['#retry-copy','copy'],['#reset-filters','rotate-ccw'],['#reply-form button','send']]) {
  const button=$(selector); button.insertAdjacentHTML('afterbegin',icon(name === 'send' ? 'arrow-up' : name));
}
document.querySelectorAll('[data-close]').forEach(button=>button.insertAdjacentHTML('afterbegin',icon('x')));
const params = new URLSearchParams(location.search);
let saved = {}, selectedIds = [];
try { saved = JSON.parse(localStorage.getItem('eva-developer-filters') || '{}') || {}; } catch {}
try { const value = JSON.parse(sessionStorage.getItem('eva-developer-selected') || '[]'); if(Array.isArray(value))selectedIds=value; } catch {}
const state = { rows: [], loaded:false, pending:null, checking:false, busy:false, selected:new Set(selectedIds), revision:0, detailId:null, context:{},
  filters:{ menu:params.get('menu') || saved.menu || 'all', status:saved.status || 'approved', claim:saved.claim || 'unclaimed', search:saved.search || '' } };
if (!MENUS.some(([id]) => id === state.filters.menu)) state.filters.menu = 'all';
if (!['all', ...Object.keys(STATUS_LABELS)].includes(state.filters.status)) state.filters.status = 'approved';
if (!['all','claimed','unclaimed'].includes(state.filters.claim)) state.filters.claim = 'unclaimed';
const date = value => value ? new Date(value).toLocaleString('zh-CN', { month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false }) : '—';
const message = (value, error = false) => { $('#notice').textContent = value; $('#notice').classList.toggle('is-error', error); };
function saveFilters() {
  localStorage.setItem('eva-developer-filters', JSON.stringify(state.filters));
  const url = new URL(location.href); url.searchParams.set('menu',state.filters.menu); history.replaceState(null,'',url);
}
function updateSelection() {
  if (state.loaded) sessionStorage.setItem('eva-developer-selected', JSON.stringify([...state.selected]));
  const selected = state.rows.filter(row => state.selected.has(row.id));
  const visible = filterRows(state.rows,state.filters);
  $('#selection-count').textContent = `已选 ${selected.length} 条${selected.some(r => !visible.includes(r)) ? '（含其他筛选下的批注）' : ''}`;
  $('#copy').disabled = state.busy || !selected.length;
  $('#claim-copy').disabled = state.busy || !selected.length || selected.some(r => r.status !== 'approved' || r.claimed_by);
  $('#claim-copy').title = selected.some(r => r.status !== 'approved' || r.claimed_by) ? '只能认领已确认且未认领的批注；其他批注仍可复制' : '';
  const checkbox = $('#select-all');
  checkbox.checked = visible.length > 0 && visible.every(r => state.selected.has(r.id));
  checkbox.indeterminate = !checkbox.checked && visible.some(r => state.selected.has(r.id));
  checkbox.disabled = !visible.length || state.busy;
  $('#clear-selection').disabled = state.busy || !selected.length;
}
function render() {
  document.querySelectorAll('[data-status]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.status===state.filters.status)));
  const scroll = $('.table-scroll'); const top = scroll.scrollTop; const left = scroll.scrollLeft;
  const menuButton = id => {
    const label=MENUS.find(menu=>menu[0]===id)[1];
    return `<button type="button" data-menu="${id}" aria-current="${state.filters.menu===id}"><span class="menu-label">${menuIcon(id)}<span>${label}</span></span><small>${state.rows.filter(r=>id==='all'||menuOf(r.page_path)===id).length}</small></button>`;
  };
  const groups=[['个人',['personal','workboard','automation','skills']],['团队协作',['messages','my-ai','projects','contacts','drive','sites']],['其他',['employees','agent-create','other']]];
  $('#menus').innerHTML=menuButton('all')+groups.map(([label,ids])=>`<section class="menu-group" aria-label="${label}"><h3>${label}</h3>${ids.map(menuButton).join('')}</section>`).join('');
  $('#menu-title').textContent = MENUS.find(([id]) => id===state.filters.menu)[1];
  const visible = filterRows(state.rows,state.filters);
  $('#counts').textContent = `${visible.length} 条批注 / 共 ${state.rows.length} 条`;
  $('#rows').innerHTML = visible.map(row => `<tr data-id="${escape(row.id)}" class="${state.selected.has(row.id)?'is-selected':''}">
    <td><input type="checkbox" data-select="${escape(row.id)}" aria-label="选择批注 ${escape(row.seq)}" ${state.selected.has(row.id)?'checked':''}></td>
    <td>#${escape(row.seq)}</td><td>${escape(MENUS.find(([id])=>id===menuOf(row.page_path))[1])}</td>
    <td><p class="body-text">${escape(row.body)}</p><a class="anchor-card" href="${escape(prototypeLink(row,location.origin))}" target="eva-prototype" rel="noopener" title="${escape(row.anchor?.quote || row.page_path)}">${icon('crosshair')}<span class="anchor-text">${escape(row.anchor?.quote || row.page_path)}</span></a></td>
    <td>${escape(KIND_LABELS[row.kind]||row.kind)}</td><td><select class="status-label ${escape(row.status)}" data-row-status="${escape(row.id)}" title="修改状态会将操作人设为认领者" aria-label="批注 ${escape(row.seq)} 状态" ${state.busy?'disabled':''}>${Object.entries(STATUS_LABELS).map(([value,label])=>`<option value="${value}"${row.status===value?' selected':''}>${label}</option>`).join('')}</select></td>
    <td>${escape(row.author_name)}</td><td>${escape(row.claimed_by||'-')}</td><td>${date(row.updated_at||row.created_at)}</td>
    <td><div class="cell-actions"><button type="button" data-detail="${escape(row.id)}">${icon('file-text')}详情${row.replies?.length?' · '+row.replies.length:''}</button><a href="${escape(prototypeLink(row,location.origin))}" target="eva-prototype" rel="noopener">${icon('external-link')}查看原型</a></div></td></tr>`).join('');
  $('#empty').hidden = !!visible.length;
  $('#empty').textContent = state.loaded ? '当前筛选没有批注，可切换状态或功能菜单。' : '正在读取共享批注…';
  scroll.scrollTop = top; scroll.scrollLeft = left;
  updateSelection();
}
function applyRows(rows) {
  state.rows=rows; state.loaded=true; state.pending=null;
  const ids=new Set(rows.map(r=>r.id)); state.selected.forEach(id=>{if(!ids.has(id))state.selected.delete(id);});
  render(); updateNotice();
}
function updateNotice() {
  $('#refresh').innerHTML = icon('rotate-ccw') + `<span>${state.pending ? '有更新，点击加载' : '检查更新'}</span>`;
  $('#refresh').classList.toggle('has-updates',!!state.pending);
}
async function refresh(background=false) {
  if(state.checking || state.busy)return;
  state.checking=true; const revision=state.revision; $('#refresh').disabled=true;
  try {
    const rows=await store.list();
    if(revision !== state.revision)return;
    if(background && state.loaded){ state.pending=JSON.stringify(rows)===JSON.stringify(state.rows)?null:rows; updateNotice(); }
    else {applyRows(rows); message('已读取最新批注');}
  }catch(error){message(`读取失败：${error.message}。可点击检查更新重试。`,true);if(!state.loaded)$('#empty').textContent='批注读取失败，请重试。';}
  finally{state.checking=false;$('#refresh').disabled=false;}
}
$('#refresh').onclick=()=>{if(state.busy)return;if(state.pending){applyRows(state.pending);message('已加载更新，保留筛选和勾选');}else refresh();};
$('#menus').onclick=event=>{const button=event.target.closest('[data-menu]');if(!button)return;state.filters.menu=button.dataset.menu;saveFilters();render();};
for(const [id,key] of [['claim-filter','claim']]){
  $('#'+id).value=state.filters[key];$('#'+id).onchange=event=>{state.filters[key]=event.target.value;saveFilters();render();};
}
$('#status').onclick=event=>{const button=event.target.closest('[data-status]');if(!button)return;state.filters.status=button.dataset.status;saveFilters();render();};
$('#reset-filters').onclick=()=>{
  state.filters={menu:'all',status:'approved',claim:'unclaimed',search:''};
  $('#claim-filter').value=state.filters.claim;$('#search').value='';$('#clear-search').hidden=true;
  saveFilters();render();message('已恢复默认筛选，保留已勾选的批注');
};
$('#search').value=state.filters.search;
function search(){state.filters.search=$('#search').value;$('#clear-search').hidden=!state.filters.search;saveFilters();render();}
$('#search').oninput=event=>{if(!event.isComposing)search();};$('#search').oncompositionend=search;
$('#clear-search').hidden=!state.filters.search;
$('#clear-search').onclick=()=>{$('#search').value='';search();$('#search').focus();};
$('#rows').onchange=async event=>{
  const select=event.target, statusId=select.dataset.rowStatus;
  if(statusId){
    const row=state.rows.find(r=>r.id===statusId);if(!row)return;
    if(state.busy){select.value=row.status;return;}
    const status=select.value;
    state.busy=true;state.revision++;select.disabled=true;updateSelection();
    try{
      const updated=await store.updateStatus(statusId,status,getReviewAuthor());
      state.rows=state.rows.map(r=>r.id===statusId?{...r,...updated,replies:r.replies}:r);
      state.pending=null;updateNotice();message(`批注 #${row.seq} 已设为“${STATUS_LABELS[status]}”`);
    }catch(error){select.value=row.status;message(`状态修改失败：${error.message}`,true);}
    finally{state.busy=false;render();}
    return;
  }
  const id=select.dataset.select;if(!id)return;
  select.checked?state.selected.add(id):state.selected.delete(id);select.closest('tr').classList.toggle('is-selected',select.checked);updateSelection();
};
$('#select-all').onchange=event=>{filterRows(state.rows,state.filters).forEach(r=>event.target.checked?state.selected.add(r.id):state.selected.delete(r.id));render();};
$('#clear-selection').onclick=()=>{state.selected.clear();render();};
$('#assignee').value=getReviewAuthor();
subscribeReviewAuthor(author=>{if(document.activeElement!==$('#assignee'))$('#assignee').value=author;});
$('#assignee').oninput=event=>{if(!event.isComposing)setReviewAuthor(event.target.value);};
$('#assignee').oncompositionend=()=>setReviewAuthor($('#assignee').value);
let lastFocus;
function openDialog(dialog){lastFocus=document.activeElement;dialog.showModal();}
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>button.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>lastFocus?.focus()));
async function copyPrompt(){try{await navigator.clipboard.writeText($('#prompt-text').value);$('#copy-feedback').textContent='已复制，可粘贴给 AI 开始处理。';}catch{$('#copy-feedback').textContent='浏览器未允许自动复制，请选中下方全文手动复制。';$('#prompt-text').focus();$('#prompt-text').select();}}
$('#retry-copy').onclick=copyPrompt;
async function handoff(claim){
  if(state.busy)return; const selected=state.rows.filter(r=>state.selected.has(r.id));if(!selected.length)return;
  state.busy=true;updateSelection();
  try{
    let rows=selected;
    if(claim){
      const author=$('#assignee').value.trim();
      const claimed=await store.claim(selected.map(r=>r.id),author);
      state.revision++;
      setReviewAuthor(author);
      rows=selected.map(r=>({...r,...claimed.find(c=>c.id===r.id),replies:r.replies}));
      const changed=new Map(rows.map(r=>[r.id,r]));state.rows=state.rows.map(r=>changed.get(r.id)||r);
      state.pending=null;updateNotice();render();message('已认领；提示词可重复复制，不会重复认领。');
    }
    $('#prompt-text').value=buildDeveloperPrompt(rows,state.context,location.origin);
    $('#copy-feedback').textContent=claim?'已认领，正在复制…':'正在复制…';
    openDialog($('#prompt-dialog'));await copyPrompt();
  }catch(error){message(error.message,true);}
  finally{state.busy=false;updateSelection();}
}
$('#copy').onclick=()=>handoff(false);$('#claim-copy').onclick=()=>handoff(true);
function showDetail(id){
  const row=state.rows.find(r=>r.id===id);if(!row)return;state.detailId=id;
  $('#detail-title').textContent=`批注 #${row.seq}`;
  $('#detail-content').innerHTML=`<div class="detail-meta">${escape(STATUS_LABELS[row.status])} · 提出者 ${escape(row.author_name)} · 认领者 ${escape(row.claimed_by||'-')}${row.claimed_at?' · '+date(row.claimed_at):''}</div><p>${escape(row.body)}</p><a href="${escape(prototypeLink(row,location.origin))}" target="eva-prototype" rel="noopener">${icon('external-link')}查看原型位置</a><h3>前端定位与源码参照</h3><pre>${escape(JSON.stringify({page:row.page_path,anchor:row.anchor,sources:sourceHints(row)},null,2))}</pre><h3>讨论与开发结果</h3>${(row.replies||[]).map(r=>`<div class="reply-entry"><strong>${escape(r.author_name)}</strong> <span class="detail-meta">${date(r.created_at)}</span><p>${escape(r.body)}</p></div>`).join('')||'<p class="detail-meta">暂无回复</p>'}${row.claimed_by?'<button type="button" id="release-claim">释放认领</button>':''}`;
  $('#reply-body').value=sessionStorage.getItem('eva-developer-draft:'+id)||'';$('#reply-error').textContent='';
  $('#release-claim')?.addEventListener('click',async event=>{
    event.target.disabled=true;
    try{const rows=await store.claim([id],$('#assignee').value.trim(),true);state.revision++;state.rows=state.rows.map(r=>r.id===id?{...r,...rows[0],replies:r.replies}:r);state.pending=null;updateNotice();render();$('#detail').close();message('已释放认领；原批注状态保留，可由评审者调整。');}
    catch(error){$('#reply-error').textContent=error.message;event.target.disabled=false;}
  });
  openDialog($('#detail'));
}
$('#rows').onclick=event=>{const button=event.target.closest('[data-detail]');if(button)showDetail(button.dataset.detail);};
$('#reply-body').oninput=()=>sessionStorage.setItem('eva-developer-draft:'+state.detailId,$('#reply-body').value);
$('#reply-form').onsubmit=async event=>{
  event.preventDefault();const button=event.currentTarget.querySelector('button');if(button.disabled)return;
  const id=state.detailId,body=$('#reply-body').value.trim(),author=$('#assignee').value.trim();
  if(!body||!author){$('#reply-error').textContent='请填写认领者姓名和回填内容。';return;}
  button.disabled=true;
  try{const reply=await store.addReply(id,{body,author_name:author});state.revision++;sessionStorage.removeItem('eva-developer-draft:'+id);state.rows=state.rows.map(r=>r.id===id?{...r,replies:[...(r.replies||[]),reply]}:r);render();if(state.detailId===id)$('#detail').close();message('开发结果已回填到原批注');}
  catch(error){$('#reply-error').textContent=error.message;}finally{button.disabled=false;}
};
render(); updateNotice();
try{const response=await fetch('./build-context.json',{cache:'no-store'});if(!response.ok)throw new Error();state.context=await response.json();$('#build-info').textContent=`${state.context.branch} / ${state.context.commit?.slice(0,8)} / ${state.context.version}`;}
catch{$('#build-info').textContent='构建版本不可用';message('构建信息暂不可用，提示词会明确标注未知。',true);}
await refresh();
setInterval(()=>{if(!document.hidden)refresh(true);},15000);
