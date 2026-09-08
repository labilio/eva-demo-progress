/* The human owns the group; React owns search, inline disclosure and profile state. */
(function(root){
'use strict';
let Component;
function personaPreview(personas,expanded,query){
 const term=query.trim().toLowerCase(),matches=term?personas.filter(p=>p.name.toLowerCase().includes(term)):[];
 const filtered=matches.length>0,visible=filtered?matches:expanded?personas:personas.slice(0,6);
 return {visible,filtered,hiddenCount:filtered?0:personas.length-visible.length};
}
root.EvaContactsUI={personaPreview,render(deps){Component||=create(deps);return deps.React.createElement(Component);}};
function create({React:R,Button,Input,SearchIcon,store,ui}){
 const h=R.createElement,{identityModel:model,IdentityCard,IdentityAppearance}=ui;
 function ContactGroup({person,personas,query,onProfile}){
  const [expanded,setExpanded]=R.useState(false);
  R.useEffect(()=>setExpanded(false),[query]);
  const {visible,filtered,hiddenCount}=personaPreview(personas,expanded,query),groupId='eva-contact-clones-'+person.id;
  return h('li',{className:'eva-contacts__person'},
   h('button',{type:'button',className:'eva-contacts__human eva-contact-identity-button','aria-label':'查看 '+person.name+' 的资料',onClick:()=>onProfile(person.id)},
    h('img',{className:'eva-contacts__avatar',src:person.avatar,alt:''}),
    h('span',{className:'eva-contacts__human-copy'},h('strong',{className:'eva-contacts__person-name',title:person.name},person.name),h('span',{className:'eva-contacts__department',title:person.departmentL2},person.departmentL2))),
   h('div',{className:'eva-contacts__clone-group',role:'group','aria-label':person.name+'的 AI 分身，共 '+personas.length+' 个'},
    !personas.length&&h('span',{className:'eva-contacts__clone-empty'},'暂无分身'),
    h('div',{id:groupId,className:'eva-contacts__clone-list'},visible.map(p=>h('button',{type:'button',key:p.id,className:'eva-contacts__ai-row eva-contact-identity-button',onClick:()=>onProfile(p.id),'aria-label':'查看 '+p.name+' 的资料'},
     h(IdentityAppearance,{profile:p,size:28}),h('span',{className:'eva-contacts__ai-identity'},h('span',{className:'eva-contacts__ai-name',title:p.name},p.name),root.EvaAIIdentity.badge(h))))),
    !filtered&&personas.length>6&&h(Button,{className:'eva-contacts__disclosure',theme:'borderless',type:'tertiary',size:'small','aria-expanded':expanded,'aria-controls':groupId,onClick:()=>setExpanded(v=>!v)},expanded?'收起分身':'展开其余 '+hiddenCount+' 个分身')),h('span',{className:'eva-contacts__owner-total'},'共 '+personas.length+' 个'));
 }
 return function Contacts(){
  R.useSyncExternalStore(store.subscribe,store.getSnapshot);
  R.useSyncExternalStore(root.EvaAITeam.subscribe,root.EvaAITeam.getSnapshot);
  const [query,setQuery]=R.useState(''),[profile,setProfile]=R.useState(null),actor=store.snapshot().actorId;
  R.useEffect(()=>{setProfile(null);setQuery('');},[actor]);
  const term=query.trim().toLowerCase(),rows=model.directory().filter(row=>[row.person.name,row.person.departmentL2,...row.personas.map(p=>p.name)].some(value=>value.toLowerCase().includes(term)));
  return h('section',{id:'eva-contacts-root',className:'eva-contacts eva-contacts--redesigned','aria-label':'通讯录'},
   h('header',{className:'eva-contacts__main-head'},h('div',{className:'eva-contacts__title'},h('strong',null,'通讯录'),h('span',{className:'eva-contacts__result-count'},rows.length+' 位联系人')),
    h('div',{className:'eva-contacts__search'},h(SearchIcon,{size:16}),h(Input,{value:query,onChange:setQuery,placeholder:'搜索联系人、部门或分身','aria-label':'搜索通讯录',showClear:true,onKeyDown:e=>{if(e.key==='Escape')setQuery('');}}))),
   h('div',{className:'eva-contacts__list','aria-label':'联系人列表'},h('div',{className:'eva-contacts__columns','aria-hidden':true},h('span',null,'联系人'),h('span',null,'AI 分身')),rows.length?h('ul',{className:'eva-contacts__groups'},rows.map(row=>h(ContactGroup,{...row,key:actor+':'+row.person.id,query,onProfile:setProfile}))):h('div',{className:'eva-contacts__empty-state',role:'status'},'没有找到匹配的联系人')),
   h(IdentityCard,{identity:profile,onClose:()=>setProfile(null)}));
 };
}
})(window);
