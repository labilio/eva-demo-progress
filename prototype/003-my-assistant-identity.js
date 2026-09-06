
window.__EVA_MY_ASSISTANT_IDENTITY = Object.freeze({
  name: '执剑人',
  ownerName: '王宜林',
  logo: window.__EVA_COLLEAGUE_PORTRAIT,
  ownerAvatar: window.__EVA_CURRENT_USER_PORTRAIT
});
window.__EVA_MY_ASSISTANTS = Object.freeze([
  window.__EVA_MY_ASSISTANT_IDENTITY,
  Object.freeze({
    name: '飞行员E号',
    ownerName: '王宜林',
    logo: window.__EVA_COLLEAGUE_PORTRAIT,
    ownerAvatar: window.__EVA_CURRENT_USER_PORTRAIT
  })
]);

/* One identity contract for React and legacy HTML surfaces. Geometry is contact-based. */
window.EvaAIIdentity = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const html = (tag, props, ...children) => '<'+tag+Object.entries(props||{}).map(([key,value])=>{
    if(value==null)return '';
    if(key==='style')value=Object.entries(value).map(([k,v])=>k+':'+v).join(';');
    return ' '+(key==='className'?'class':key)+'="'+escape(value)+'"';
  }).join('')+'>'+children.join('')+(tag==='img'?'':'</'+tag+'>');
  function avatar(appearance, size=32, render=html) {
    const label=appearance.markerKind==='bot'?appearance.name+'，Eva 云端项目 AI':appearance.name+'，来自'+(appearance.sourceName||'Eva')+'，属于'+appearance.ownerName;
    return render('span',{className:'eva-identity-avatar',role:'img','aria-label':label,title:label,style:{'--eva-identity-avatar-size':size+'px'}},
      render('img',{className:'eva-identity-avatar__logo',src:appearance.logo,alt:''}),
      render('img',{className:'eva-identity-avatar__owner',src:appearance.ownerAvatar,alt:''}));
  }
  function badge(render=html,className='') {return render('span',{className:'ai-badge ai-badge-small'+(className?' '+className:'')},'AI');}
  function projectAgentAppearance(){return {name:'Eva 项目管理专员',sourceName:'Eva',logo:window.__EVA_COLLEAGUE_PORTRAIT,markerKind:'bot',ownerAvatar:'prototype/assets/project-agent-bot.svg'};}
  return Object.freeze({avatar,badge,projectAgentAppearance});
})();
