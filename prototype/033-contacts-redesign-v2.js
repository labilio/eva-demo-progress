/* Contacts keeps its approved two-column layout; React owns search, disclosure and profile state. */
(function(root){
'use strict';
let Component;
root.EvaContactsUI={render(deps){Component||=create(deps);return deps.React.createElement(Component);}};
function create({React:R,Button,Input,Modal,SearchIcon,CloseIcon,store,ui}){
 const h=R.createElement,{identityModel:model,IdentityCard,IdentityAppearance}=ui;
 return function Contacts(){
  R.useSyncExternalStore(store.subscribe,store.getSnapshot);
  R.useSyncExternalStore(root.EvaAITeam.subscribe,root.EvaAITeam.getSnapshot);
  const [query,setQuery]=R.useState(''),[more,setMore]=R.useState(null),[profile,setProfile]=R.useState(null);
  const popupHost=R.useRef(null),actor=store.snapshot().actorId;
  R.useEffect(()=>{setMore(null);setProfile(null);},[actor]);
  const rows=model.directory().filter(row=>[row.person.name,row.person.departmentL2,...row.personas.map(p=>p.name)].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  const ai=p=>h('button',{type:'button',key:p.id,className:'eva-contacts__ai-row eva-contact-identity-button',onClick:()=>setProfile(p.id),'aria-label':'查看 '+p.name+' 的资料'},h(IdentityAppearance,{profile:p,size:32}),h('span',{className:'eva-contacts__ai-identity'},h('strong',{className:'eva-contacts__ai-name',title:p.name},p.name),root.EvaAIIdentity.badge(h)));
  const extra=more?model.directory().find(row=>row.person.id===more):null;
  return h('section',{id:'eva-contacts-root',className:'eva-contacts eva-contacts--redesigned','aria-label':'通讯录'},
   h('main',{className:'eva-contacts__main'},h('header',{className:'eva-contacts__main-head'},h('strong',null,'通讯录'),h('div',{className:'eva-contacts__search'},h(SearchIcon,{size:15}),h(Input,{value:query,onChange:setQuery,placeholder:'搜索联系人','aria-label':'搜索通讯录',showClear:true,onKeyDown:e=>{if(e.key==='Escape')setQuery('');}}))),
   h('div',{className:'eva-contacts__list','aria-label':'联系人列表'},h('div',{className:'eva-contacts__columns','aria-hidden':true},h('span',null,'联系人'),h('span',null,'AI 分身')),rows.length?h('div',{className:'semi-list semi-list-split eva-contacts__semi-list'},h('ul',{className:'semi-list-items'},rows.map(({person,personas})=>h('li',{className:'semi-list-item eva-contacts__person',key:person.id},h('div',{className:'semi-list-item-body semi-list-item-body-center'},h('button',{type:'button',className:'eva-contacts__cell eva-contacts__cell--human eva-contact-identity-button','aria-label':'查看 '+person.name+' 的资料',onClick:()=>setProfile(person.id)},h('img',{className:'semi-avatar semi-avatar-circle eva-contacts__avatar',src:person.avatar,alt:''}),h('strong',{className:'eva-contacts__person-name'},person.name),h('span',{className:'eva-contacts__department',title:person.departmentL2},person.departmentL2)),h('div',{className:'eva-contacts__cell eva-contacts__cell--ai eva-contacts__cell--ai-list'},personas.slice(0,2).map(ai),personas.length>2&&h('button',{type:'button',className:'eva-contacts__more','aria-label':'查看'+person.name+'的其余分身',onClick:()=>setMore(person.id)},'+'+(personas.length-2)))))))):h('div',{className:'semi-list-empty eva-contacts__empty-state'},'没有找到匹配的联系人'))),
   h('div',{ref:popupHost,className:'eva-identity-portal'}),
   extra&&!profile&&h(Modal,{visible:true,getPopupContainer:()=>popupHost.current,className:'eva-members-modal eva-picker-modal',width:640,title:extra.person.name+'的更多分身',onCancel:()=>setMore(null),footer:h(Button,{onClick:()=>setMore(null)},'关闭')},h('div',{className:'eva-picker-body'},h('div',{className:'eva-picker-list'},extra.personas.slice(2).map(ai)))),
   h(IdentityCard,{identity:profile,onClose:()=>setProfile(null)}));
 };
}
})(window);
