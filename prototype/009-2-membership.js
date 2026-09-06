(function(root){
  'use strict';
  // Business state only. React subscribes to this store; DOM is never a state source.
  function create(seed, persist, resolveProjectInfo){
    let state=JSON.parse(JSON.stringify({people:[],clones:[],projects:{},groups:{},threads:{},threadDetails:{},messages:{},chatSettings:{},chatPreferences:{},invitations:[],sequence:0,...seed}));
    let revision=0;const listeners=new Set();
    const fail=message=>{throw new Error(message);};
    const person=id=>state.people.find(p=>p.id===id&&p.active!==false);
    const clone=id=>state.clones.find(c=>c.id===id&&c.active!==false);
    const scope=id=>state.projects[id]||state.groups[id]||fail('范围不存在');
    const projectId=id=>state.projects[id]?id:state.groups[id]?.projectId;
    const humanRows=id=>scope(id).humans;
    const requireHuman=id=>person(id)||fail('仅已激活的内部人类用户可操作');
    const member=(id,uid)=>humanRows(id).some(m=>m.id===uid);
    const manager=(id,uid)=>{const s=scope(id);if(!member(id,uid))return false;if(s.ownerId===uid)return true;const p=state.projects[projectId(id)];return !!p&&p.humans.some(m=>m.id===uid&&['owner','admin'].includes(m.role));};
    const selected=(uid,ids,pid)=>{if(!Array.isArray(ids))fail('分身选择格式无效');return [...new Set(ids)].map(id=>{const c=clone(id);if(!c||c.ownerId!==uid)fail('只能带入自己的可用分身');if(pid&&!state.projects[pid].cloneIds.includes(id))fail('请先将分身加入项目');return id;});};
    const notify=()=>{revision++;if(persist)persist(JSON.parse(JSON.stringify(state)));listeners.forEach(fn=>fn());};
    const writable=id=>{if(id.startsWith('all:'))fail('请在项目成员管理中操作');if(state.threads[id])fail('子区继承父群成员，不单独管理');return scope(id);};
    const cancelPending=(id,uid)=>state.invitations.forEach(i=>{if(i.scopeId===id&&i.inviterId===uid&&i.status==='pending_approval')i.status='withdrawn';});
    const drop=(id,uid)=>{const s=scope(id);s.humans=s.humans.filter(m=>m.id!==uid);s.cloneIds=s.cloneIds.filter(cid=>clone(cid)?.ownerId!==uid);cancelPending(id,uid);};
    const dissolve=id=>{delete state.groups[id];Object.keys(state.threads).filter(t=>state.threads[t]===id).forEach(t=>delete state.threads[t]);state.invitations.filter(i=>i.scopeId===id&&i.status.startsWith('pending')).forEach(i=>i.status='expired');};
    const employee=id=>{const a=root.EvaDigitalEmployeesStore?.get(id);return a?{...a,kind:'employee',ai:true,identityAppearance:root.EvaDigitalEmployeesStore.appearance(a)}:null;};
    const employeeRows=s=>(s.employeeIds||[]).map(employee).filter(Boolean);
    const agentFor=pid=>state.projects[pid]?{id:'project-agent:'+pid,name:'Eva 项目管理专员',kind:'project-agent',ai:true,projectId:pid,cloud:true,removable:false,ownership:'project'}:null;
    const agentIn=id=>{id=state.threads[id]||id;return agentFor(id.startsWith('all:')?id.slice(4):projectId(id));};
    const projectInfo=pid=>({...state.projects[pid],...resolveProjectInfo?.(pid)});
    const agentSender=pid=>{const agent=agentFor(pid);return {...agent,uid:agent.id,color:'#1563EB'};};
    const agentWelcome=(pid,goal)=>{
      const list=state.messages['all:'+pid]||(state.messages['all:'+pid]=[]),fixtureId='project-agent-welcome:'+pid;
      if(list.some(m=>m.fixtureId===fixtureId))return;
      for(const prefs of Object.values(state.chatPreferences)){const pref=prefs['all:'+pid];if(pref?.clearedCount>0)pref.clearedCount++;}
      const p=projectInfo(pid),owner=person(state.projects[pid].ownerId);
      list.unshift({fixtureId,kind:'text',sender:agentSender(pid),time:'09:00',text:'@所有人 大家好，我是 Eva 项目管理专员。\n项目：'+p.name+'\n共同目标：'+(goal||p.desc||'尚未填写，可在项目信息中补充')+'\n负责人：'+(owner?.name||'未指定')+'\n我是本项目的云端 AI，了解项目目标、成员、各群进展及共享资料，电脑关闭后也可继续服务。每位项目成员都可以 @我 提问，我会结合整个项目的信息回答。',notifiedHumanIds:state.projects[pid].humans.map(m=>m.id)});
    };
    const api={
      subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>revision,
      snapshot:()=>JSON.parse(JSON.stringify(state)),person,clone,employee,manager,projectAgent:agentFor,
      addEmployee(id,uid,eid){requireHuman(uid);const sid=id.startsWith("all:")?id.slice(4):id,s=state.projects[sid]||fail("数字员工只能放进项目，不能拉进群聊"),a=employee(eid)||fail("数字员工不存在");if(!member(sid,uid))fail("请先加入项目");if((a.ownership==="personal"||a.scope==="self")&&a.by!==uid)fail("只有创建者能邀请自己的数字员工");if(a.ownership==="project"&&a.projectId!==projectId(sid))fail("项目助手只能在所属项目中使用");s.employeeIds=[...new Set([...(s.employeeIds||[]),eid])];notify();},
      removeEmployee(id,uid,eid){const s=writable(id),a=employee(eid)||fail("数字员工不存在");if(!member(id,uid)||(!manager(id,uid)&&a.by!==uid))fail("无移除权限");s.employeeIds=(s.employeeIds||[]).filter(x=>x!==eid);if(state.projects[id])Object.values(state.groups).filter(g=>g.projectId===id).forEach(g=>{g.employeeIds=(g.employeeIds||[]).filter(x=>x!==eid);});notify();},
      transaction(fn){const staged=create(state,undefined,resolveProjectInfo);fn(staged);state=staged.snapshot();notify();},
      renameProject(id,uid,name){requireHuman(uid);if(!state.projects[id]||!manager(id,uid))fail('仅项目负责人或管理员可修改');if(!name.trim()||name.length>50)fail('项目名称须为 1–50 个字符');state.projects[id].name=name.trim();notify();},
      chatSettings(id){return JSON.parse(JSON.stringify(state.chatSettings[id]||{}));},
      chatPreferences(id,uid){return JSON.parse(JSON.stringify(state.chatPreferences[uid]?.[id]||{}));},
      setChatSettings(id,uid,patch){
        const sid=id.startsWith('all:')?id.slice(4):id;
        if(!api.canRead(id,uid)||!manager(sid,uid))fail('仅群主或群内管理员可修改');
        const allowed=['name','notice','avatar'];
        if(Object.keys(patch).some(k=>!allowed.includes(k)))fail('未知群设置');
        if(patch.name!==undefined&&(!patch.name.trim()||patch.name.length>50))fail('群名须为 1–50 个字符');
        if(patch.notice?.length>400)fail('公告最多 400 个字符');
        if(patch.avatar&&!/^data:image\/(png|jpeg|webp);base64,/.test(patch.avatar))fail('请上传 PNG、JPEG 或 WebP 图片');
        state.chatSettings[id]={...state.chatSettings[id],...patch};
        if(patch.name&&state.groups[id])state.groups[id].name=patch.name.trim();
        notify();
      },
      setChatPreferences(id,uid,patch){
        requireHuman(uid);if(!id)fail('会话不存在');
        if((state.groups[id]||id.startsWith('all:'))&&!api.canRead(id,uid))fail('请先加入群聊');
        if(Object.keys(patch).some(k=>!['mute','top','clearedCount'].includes(k)))fail('未知个人设置');
        state.chatPreferences[uid]||={};state.chatPreferences[uid][id]={...state.chatPreferences[uid][id],...patch};notify();
      },
      visibleMessages(id,uid,messages){return messages.slice(api.chatPreferences(id,uid).clearedCount||0);},
      setActor(uid){requireHuman(uid);state.actorId=uid;notify();},
      seedSupplyChatContent(){
        let changed=false;
        if(!state.conciseAllHandsV2){
          const id='all:prod',old=state.messages[id]||[],isOld=m=>String(m.fixtureId||'').startsWith('supply-chat-v1:all:prod:')||String(m.fixtureId||'').startsWith('project-agent-demo:');
          // Replace shipped demo messages only; retain user messages and clear-history boundaries.
          Object.values(state.chatPreferences||{}).forEach(prefs=>{const pref=prefs[id];if(pref?.clearedCount)pref.clearedCount=old.slice(0,pref.clearedCount).filter(m=>!isOld(m)).length;});
          state.messages[id]=old.filter(m=>!isOld(m));state.conciseAllHandsV2=true;changed=true;
        }
        for(const block of root.__EVA_SUPPLY_CHAT_CONTENT||[]){
          const id=block.scopeId||Object.values(state.groups).find(g=>g.projectId==='prod'&&g.name===block.groupName)?.id;
          if(!id||!api.canRead(id,'u-wangyilin'))continue;
          const list=state.messages[id]||(state.messages[id]=[]);
          block.messages.forEach(([senderId,time,text],index)=>{
            const fixtureId=(id==='all:prod'?'supply-chat-v2:':'supply-chat-v1:')+id+':'+index;
            const projectAgent=senderId==='project-agent:prod'&&agentIn(id)?.projectId==='prod';
            if(list.some(m=>m.fixtureId===fixtureId)||(!projectAgent&&(!person(senderId)||!api.canRead(id,senderId))))return;
            list.push({fixtureId,kind:'text',sender:projectAgent?agentSender('prod'):{...person(senderId),uid:senderId},time,text});changed=true;
          });
          if(block.notice&&!state.chatSettings[id]?.notice){state.chatSettings[id]={...state.chatSettings[id],notice:block.notice};changed=true;}
        }
        // Upgrade only the shipped request text, preserving user messages and edits.
        const request=(state.messages['all:prod']||[]).find(m=>m.fixtureId==='supply-chat-v2:all:prod:7');
        if(request&&request.text==="备选方案会多一次换型。我把产能影响补到 SC-105，等质量结论一起确认。"){request.text="备选方案会多一次换型。我把产能影响补到 SC-105，等质量结论一起确认。\n@Eva 项目管理专员 请结合刚才的更新，简要汇总还需要确认的事项。";changed=true;}
        if(changed)notify();
      },
      loadSupplyDemo(){
        const d=root.__EVA_SUPPLY_MEMBER_DEMO;
        if(!d||!state.projects[d.projectId])fail('供应链演示项目不存在');
        d.humans.forEach(m=>requireHuman(m.id));requireHuman(d.invitation.inviteeId);
        const pid=d.projectId, groupIds=Object.values(state.groups).filter(g=>g.projectId===pid).map(g=>g.id);
        const scopeIds=new Set([pid,'all:'+pid,...groupIds,d.group.id]);
        Object.entries(state.threads).forEach(([tid,gid])=>{if(scopeIds.has(gid)){delete state.messages[tid];delete state.threadDetails[tid];if(gid===d.group.id)delete state.threads[tid];}});
        for(const id of scopeIds)delete state.messages[id];
        // Keep existing group/thread fixtures, restore membership only within this project.
        state.projects[pid]={...state.projects[pid],ownerId:'u-wangyilin',humans:JSON.parse(JSON.stringify(d.humans)),cloneIds:[...d.cloneIds]};
        for(const id of groupIds){state.groups[id]={...state.groups[id],ownerId:'u-wangyilin',humans:d.humans.map(m=>({id:m.id,role:'member'})),cloneIds:[]};}
        state.groups[d.group.id]={...JSON.parse(JSON.stringify(d.group)),projectId:pid};
        state.threads[d.thread.id]=d.group.id;state.threadDetails[d.thread.id]={...d.thread};
        state.messages[d.group.id]=d.messages.map(m=>{const {senderId,...message}=m;return {...JSON.parse(JSON.stringify(message)),sender:{...person(senderId),uid:senderId}};});
        state.messages[d.thread.id]=[{kind:'text',sender:{...person('u-linxiao'),uid:'u-linxiao'},time:'10:04',text:'现场验证照片和8D整改证据待补齐；子区沿用供应商整改协同群的成员权限。'}];
        state.invitations=state.invitations.filter(i=>!scopeIds.has(i.scopeId));
        state.invitations.push({...d.invitation,id:'invite-'+(++state.sequence)});
        state.actorId='u-wangyilin';state.supplyDemoVersion=d.version;api.seedSupplyChatContent();state.projectAgentDemoVersion=0;api.seedProjectAgents();notify();
      },
      createProject(id,name,uid,ids,goal){requireHuman(uid);if(state.projects[id]||state.groups[id])fail('项目已存在');const clones=selected(uid,ids);state.projects[id]={id,name,ownerId:uid,humans:[{id:uid,role:'owner'}],cloneIds:clones};agentWelcome(id,goal);notify();return id;},
      createGroup(id,name,pid,uid,ids){requireHuman(uid);if(state.groups[id]||state.projects[id])fail('群已存在');if(pid&&!member(pid,uid))fail('请先加入项目');const clones=selected(uid,ids,pid);state.groups[id]={id,name,projectId:pid||null,ownerId:uid,humans:[{id:uid,role:'member'}],cloneIds:clones};notify();return id;},
      createThread(id,gid,details={},uid){if(!state.groups[gid]&&!(gid.startsWith('all:')&&state.projects[gid.slice(4)]))fail('父群不存在');if(uid&&!api.canRead(gid,uid))fail('请先加入父群');state.threads[id]=gid;state.threadDetails[id]={...details,id};notify();},
      updateThread(id,patch,uid){if(!api.canRead(id,uid))fail('请先加入父群');state.threadDetails[id]={...state.threadDetails[id],...patch,id};notify();},
      sendMessage(id,uid,text){requireHuman(uid);if(!api.canRead(id,uid))fail('请先加入群聊');const p=person(uid);(state.messages[id]||(state.messages[id]=[])).push({kind:'text',sender:{...p,uid:p.id},time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),text,notifiedHumanIds:(text.includes('@所有人')||text.includes('@全体成员'))?api.mentionCandidates(id).map(p=>p.id):[]});const agent=agentIn(id);if(agent&&text.includes('@'+agent.name)){const project=projectInfo(agent.projectId),owner=person(state.projects[agent.projectId].ownerId);state.messages[id].push({kind:'text',sender:agentSender(agent.projectId),time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),text:'@'+p.name+' 本项目的共同目标是：'+(project.desc||'尚未填写，请在项目信息中补充')+'。\n负责人是'+owner.name+'。成员加入项目后会同步进入全员群，具体问题可在对应群聊讨论。我在云端提供项目协作支持，你可以继续 @我。'});}notify();},
      messagesFor(id,uid){
        if(!api.canRead(id,uid))return [];
        const candidates=[{name:'@所有人',uid:'all'},{name:'@全体成员',uid:'all'},...api.groupMembers(id).map(m=>({name:'@'+m.name,uid:m.id}))];
        return JSON.parse(JSON.stringify(state.messages[id]||[])).map(m=>({...m,mentions:[...(m.mentions||[]),...candidates.filter(c=>m.text?.includes(c.name)&&!m.mentions?.some(x=>x.name===c.name))],sender:m.sender?.kind==='project-agent'?{...m.sender,identityAppearance:root.EvaAIIdentity?.projectAgentAppearance()}:m.sender}));
      },
      mentionCandidates(id){return api.groupMembers(state.threads[id]||id).filter(p=>p.kind==='human');},
      members(id){const s=scope(id);return [...s.humans.map(m=>({...person(m.id),...m,kind:'human'})),...s.cloneIds.map(cid=>({...clone(cid),kind:'clone'})),...employeeRows(s),...(agentIn(id)?[agentIn(id)]:[])];},
      groupMembers(id){id=state.threads[id]||id;return api.members(id.startsWith('all:')?id.slice(4):id);},
      canRead(id,uid){if(!id||state.threadDetails[id]?.deleted)return false;const target=state.threads[id]||id;const sid=target.startsWith('all:')?target.slice(4):target;const s=state.projects[sid]||state.groups[sid];return !!s&&(s.humans.some(m=>m.id===uid)||s.cloneIds.includes(uid)||(s.employeeIds||[]).includes(uid)||agentIn(id)?.id===uid);},
      channels(pid,uid,base=[]){pid=pid||null;
        if(pid&&!api.canRead(pid,uid))return [];
        const p=state.projects[pid];
        const view=(g,id,isAll)=>{const original=base.find(c=>c.id===id)||{};return {...original,id,name:isAll?'全员群':g.name,lastAt:original.lastAt||root.__EVA_DEMO_TIME?.T1||'2026-09-02T10:00:00+08:00',color:original.color||'var(--semi-color-primary)',unread:original.unread||0,threads:[...(original.threads||[]).map(t=>({...t,...state.threadDetails[t.id]})),...Object.entries(state.threads).filter(([tid,gid])=>gid===id&&state.threadDetails[tid]&&!(original.threads||[]).some(t=>t.id===tid)).map(([tid])=>state.threadDetails[tid])].filter(t=>!t.deleted).map(t=>({...t,updated_at:t.updated_at||t.created_at||root.__EVA_DEMO_TIME?.T1||'2026-09-02T10:00:00+08:00'})),members:g.humans.length+g.cloneIds.length+(g.employeeIds||[]).length+(p?1:0),systemAICount:p?1:0,humanCount:g.humans.length,cloneCount:g.cloneIds.length,employeeCount:(g.employeeIds||[]).length,allMembers:isAll,projectId:pid};};
        return [...(p?[view(p,'all:'+pid,true)]:[]),...Object.values(state.groups).filter(g=>g.projectId===pid&&api.canRead(g.id,uid)).map(g=>view(g,g.id,false))];
      },
      candidates(id,uid){const s=writable(id);if(!member(id,uid))fail('请先加入');return state.people.filter(p=>p.active!==false&&!member(id,p.id)&&(!s.projectId||member(s.projectId,p.id)));},
      invite(id,uid,target){requireHuman(uid);requireHuman(target);const s=writable(id);if(!member(id,uid))fail('请先加入');if(member(id,target))fail('该成员已加入');if(s.projectId&&!member(s.projectId,target))fail('只能邀请当前项目成员');const old=state.invitations.find(i=>i.scopeId===id&&i.inviteeId===target&&['pending_approval','pending_accept'].includes(i.status));if(old)return {...old};const invitation={id:'invite-'+(++state.sequence),scopeId:id,inviterId:uid,inviteeId:target,status:manager(id,uid)?'pending_accept':'pending_approval'};state.invitations.push(invitation);notify();return {...invitation};},
      approve(id,uid){const i=state.invitations.find(i=>i.id===id)||fail('邀请不存在');if(!manager(i.scopeId,uid))fail('无审批权限');if(i.status!=='pending_approval')fail('邀请已处理');i.status='pending_accept';i.approverId=uid;notify();},
      reject(id,uid){const i=state.invitations.find(i=>i.id===id)||fail('邀请不存在');if(!['pending_approval','pending_accept'].includes(i.status))fail('邀请已处理');if(i.status==='pending_approval'?!manager(i.scopeId,uid):i.inviteeId!==uid)fail('无处理权限');i.status='rejected';notify();},
      withdraw(id,uid){const i=state.invitations.find(i=>i.id===id)||fail('邀请不存在');if(!manager(i.scopeId,uid)&&!(i.inviterId===uid&&member(i.scopeId,uid)))fail('无撤回权限');if(!['pending_approval','pending_accept'].includes(i.status))fail('邀请已处理');i.status='withdrawn';notify();},
      accept(id,uid,ids){requireHuman(uid);const i=state.invitations.find(i=>i.id===id)||fail('邀请不存在');if(i.inviteeId===uid&&i.status==='joined')return;if(i.inviteeId!==uid||i.status!=='pending_accept')fail('邀请尚未获批或已处理');const s=writable(i.scopeId);if(s.projectId&&!member(s.projectId,uid))fail('请先加入项目');const clones=selected(uid,ids,s.projectId);if(!member(i.scopeId,uid))s.humans.push({id:uid,role:'member'});s.cloneIds=[...new Set([...s.cloneIds,...clones])];i.status='joined';notify();},
      addClone(id,uid,cid){const s=writable(id);requireHuman(uid);if(!member(id,uid))fail('主人必须先加入');selected(uid,[cid],s.projectId);if(!s.cloneIds.includes(cid))s.cloneIds.push(cid);notify();},
      removeClone(id,uid,cid){if(cid?.startsWith('project-agent:'))fail('项目分身不可移除');const s=writable(id);const c=clone(cid)||fail('分身不存在');if(!member(id,uid)||(c.ownerId!==uid&&!manager(id,uid)))fail('无移除权限');s.cloneIds=s.cloneIds.filter(x=>x!==cid);if(state.projects[id])Object.values(state.groups).filter(g=>g.projectId===id).forEach(g=>{g.cloneIds=g.cloneIds.filter(x=>x!==cid);});notify();},
      transfer(id,uid,target){const s=writable(id);if(s.ownerId!==uid||!member(id,target)||target===uid)fail('只能转让给范围内的另一位人类成员');s.ownerId=target;s.humans.forEach(m=>{if(state.projects[id]){if(m.id===uid)m.role='member';if(m.id===target)m.role='owner';}});notify();},
      setAdmin(id,uid,target,enabled){const s=state.projects[id]||fail('仅项目可设置管理员');if(s.ownerId!==uid||target===uid||!member(id,target))fail('无设置权限');s.humans.find(m=>m.id===target).role=enabled?'admin':'member';notify();},
      remove(id,uid,target,successors={}){if(target?.startsWith('project-agent:'))fail('项目分身不可移除');const s=writable(id);if(!member(id,uid)||(uid!==target&&!manager(id,uid)))fail('无移除权限');if(!member(id,target))fail('成员已离开');if(s.ownerId===target)fail('请先转让负责人或群主');const groups=state.projects[id]?Object.values(state.groups).filter(g=>g.projectId===id&&member(g.id,target)):[];const owned=groups.filter(g=>g.ownerId===target);for(const g of owned){if(g.humans.length>1&&(!successors[g.id]||successors[g.id]===target||!member(g.id,successors[g.id])))fail('请为 '+g.name+' 指定群内的人类接任者');}for(const g of owned){if(g.humans.length===1)dissolve(g.id);else g.ownerId=successors[g.id];}drop(id,target);groups.filter(g=>state.groups[g.id]).forEach(g=>drop(g.id,target));notify();},
      dissolveGroup(id,uid){const g=state.groups[id]||fail('仅普通群可解散');if(g.ownerId!==uid)fail('仅群主可解散');dissolve(id);notify();},
      seedProjectAgents(){
        for(const pid of Object.keys(state.projects))agentWelcome(pid);
        const pid='prod',list=state.messages['all:'+pid];
        if(list&&state.projectAgentDemoVersion!==2){
          for(const [senderId,time,text] of root.__EVA_PROJECT_AGENT_DEMO||[]){
            if((senderId!=='agent'&&!api.canRead('all:'+pid,senderId))||list.some(m=>m.text===text))continue;
            list.push({fixtureId:'project-agent-demo:'+list.length,kind:'text',sender:senderId==='agent'?agentSender(pid):{...person(senderId),uid:senderId},time,text});
          }
          state.projectAgentDemoVersion=2;
        }
        notify();
      },
    };return api;
  }
  function bootstrap(people,projects,channels,orgChannels=[],resolveProjectInfo){
    const key='eva:project-members:v1';
    let saved;try{saved=JSON.parse(root.localStorage.getItem(key));}catch{}
    if(!saved||saved.schema!==2){
      const humans=people.filter(p=>!p.robot&&!p.ai&&p.active!==false).map(p=>({...p,id:p.uid,active:true}));
      const seed={schema:2,actorId:'u-wangyilin',people:humans,clones:root.__EVA_MEMBERSHIP_CLONES||[],projects:{},groups:{},threads:{}};
      for(const p of projects){
        const ids=[...new Set(['u-wangyilin',...(p.members||[]).map(m=>humans.find(h=>h.name===m.name)?.id).filter(Boolean)])];
        seed.projects[p.id]={id:p.id,name:p.name,ownerId:ids[0],humans:ids.map((id,i)=>({id,role:i===0?'owner':'member'})),cloneIds:[]};
        for(const g of channels[p.id]||[]){
          // Existing demo participants seed ordinary groups once; live relationships use the store.
          if(seed.groups[g.id])continue;
          seed.groups[g.id]={id:g.id,name:g.name,projectId:p.id,ownerId:ids[0],humans:ids.map(id=>({id,role:'member'})),cloneIds:[]};
          for(const t of g.threads||[])seed.threads[t.id]=g.id;
        }
      }
      saved=seed;
    }
    if(!saved.seededOrgGroups){
      saved.seededOrgGroups=true;
      for(const g of orgChannels){saved.groups[g.id]={id:g.id,name:g.name,projectId:null,ownerId:'u-wangyilin',humans:[{id:'u-wangyilin',role:'member'}],cloneIds:[]};for(const t of g.threads||[])saved.threads[t.id]=g.id;}
    }
    const store=create(saved,state=>{try{root.localStorage.setItem(key,JSON.stringify(state));}catch{}},resolveProjectInfo);
    store.seedSupplyChatContent();store.seedProjectAgents();return store;
  }
  root.EvaMembership=Object.freeze({create,bootstrap});
})(window);
