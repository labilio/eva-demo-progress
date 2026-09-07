(function(root){
  'use strict';

  const clone=value=>JSON.parse(JSON.stringify(value));
  const stamp=()=>new Date().toISOString();
  const ext=name=>String(name||'').includes('.')?String(name).split('.').pop().toLowerCase():'';
  const fileTypeLabel=name=>{
    const value=ext(name);
    if(value==='pdf')return'PDF';
    if(['doc','docx'].includes(value))return'Word';
    if(['xls','xlsx','csv'].includes(value))return'Excel';
    if(['ppt','pptx'].includes(value))return'PPT';
    if(['png','jpg','jpeg','gif','webp','svg'].includes(value))return'图片';
    if(['mp3','wav','aac','m4a','flac'].includes(value))return'音频';
    if(['mp4','mov','avi','mkv','webm'].includes(value))return'视频';
    if(['zip','rar','7z','tar','gz'].includes(value))return'压缩包';
    if(['txt','md','markdown','rtf'].includes(value))return'文本';
    return value?value.toUpperCase():'其他';
  };
  const folder=(id,spaceId,name,creator,updatedAt,parentId=0)=>({id,spaceId,projectId:spaceId,area:'project',parent_id:parentId,name,type:'folder',size:0,creator,editor:'未编辑过',createdBy:creator,updatedBy:creator,updated_at:updatedAt,description:'项目资料文件夹'});
  const file=(id,spaceId,name,size,creator,editor,updatedAt,source,description,parentId=0)=>({id,spaceId,projectId:spaceId,area:'project',parent_id:parentId,name,type:'blob',size,extension:ext(name),creator,editor,createdBy:creator,updatedBy:editor==='未编辑过'?creator:editor,updated_at:updatedAt,source:source||{type:'upload',label:'本地上传'},description:description||'项目团队文件'});
  const sharedFolder=(id,spaceId,name,creator,updatedAt,parentId=0)=>({id,spaceId,projectId:null,area:'shared',parent_id:parentId,name,type:'folder',size:0,creator,editor:'未编辑过',createdBy:creator,updatedBy:creator,updated_at:updatedAt,source:{type:'created',label:'共享空间内创建'},description:'共享空间文件夹'});
  const sharedFile=(id,spaceId,name,size,creator,editor,updatedAt,source,description,parentId=0)=>({id,spaceId,projectId:null,area:'shared',parent_id:parentId,name,type:'blob',size,extension:ext(name),creator,editor,createdBy:creator,updatedBy:editor==='未编辑过'?creator:editor,updated_at:updatedAt,source:source||{type:'upload',label:'本地上传'},description:description||'共享空间文件'});

  const DEFAULT_SHARED_SPACES=[
    {id:'shared:brand',name:'品牌与市场共享',mark:'品',description:'沉淀品牌规范、市场素材与对外发布资料',ownerId:'u-wangyilin',createdAt:'2026-08-18T09:00:00+08:00',members:[{id:'u-wangyilin',role:'owner'},{id:'u-hejing',role:'manager'},{id:'u-linxiao',role:'editor'}]},
    {id:'shared:partners',name:'合作伙伴协作',mark:'合',description:'与合作伙伴协作相关的方案、合同与交付材料',ownerId:'u-hejing',createdAt:'2026-08-22T10:30:00+08:00',members:[{id:'u-hejing',role:'owner'},{id:'u-wangyilin',role:'manager'},{id:'u-suhang',role:'editor'}]},
    {id:'shared:public',name:'公司公共资料',mark:'公',description:'面向内部成员维护的制度、模板与公共资料',ownerId:'u-zhouyuan',createdAt:'2026-08-26T14:20:00+08:00',members:[{id:'u-zhouyuan',role:'owner'},{id:'u-hejing',role:'manager'},{id:'u-wangyilin',role:'editor'},{id:'u-linxiao',role:'editor'}]}
  ];

  const DEFAULT_RECORDS=[
    folder('prod-folder-meeting','prod','会议纪要','王宜林','2026-09-05T11:30:00+08:00'),
    folder('prod-folder-supplier','prod','供应商资料','周远','2026-09-04T16:20:00+08:00'),
    file('prod-report','prod','A-2409来料异常分析报告.pdf',421888,'林晓','林晓','2026-09-07T11:32:00+08:00',{type:'task',label:'任务 SC-103 · 来料异常分析'},'关键供应商来料异常的根因、措施与验证记录'),
    file('prod-demand','prod','本季度间接采购需求清单.xlsx',2936012,'王宜林','王宜林','2026-09-07T10:48:00+08:00',{type:'upload',label:'王宜林本地上传'},'各部门提交的采购数量、预算与期望到货时间'),
    file('prod-compliance','prod','新供应商准入合规材料.zip',18874368,'周远','周远','2026-09-06T17:26:00+08:00',{type:'group-copy',label:'项目群 · 供应商整改协同'},'从项目群保存到项目文件管理的独立副本'),
    file('prod-minutes','prod','0905-供应链周会纪要.md',9632,'Eva 项目管理专员','Eva 项目管理专员','2026-09-05T11:30:00+08:00',{type:'task',label:'任务 SC-105 · 项目周报'},'任务产出归属项目空间','prod-folder-meeting'),
    file('prod-qualification','prod','核心供应商资质汇总.xlsx',1572864,'周远','未编辑过','2026-09-04T16:20:00+08:00',{type:'upload',label:'周远本地上传'},'供应商资质与有效期汇总','prod-folder-supplier'),
    folder('lab-folder-delivery','lab','交付资料','苏航','2026-09-06T09:50:00+08:00'),
    file('lab-profile','lab','客户XX公司资料.pdf',1468006,'苏航','苏航','2026-09-06T09:18:00+08:00',{type:'group-copy',label:'项目群 · 客户联合交付群'},'从项目群保存的客户背景与需求资料','lab-folder-delivery'),
    file('lab-script','lab','客户XX公司销售话术.docx',131072,'销售话术专家','销售话术专家','2026-09-06T09:26:00+08:00',{type:'task',label:'任务 · 客户销售准备'},'专家任务产出，文件归属项目空间','lab-folder-delivery'),
    {id:'personal-brand',spaceId:'personal:u-wangyilin',projectId:null,area:'personal',parent_id:0,name:'品牌视觉素材.zip',type:'blob',size:25794969,extension:'zip',creator:'王宜林',editor:'未编辑过',createdBy:'王宜林',updatedBy:'王宜林',updated_at:'2026-09-06T18:05:00+08:00',source:{type:'upload',label:'本地上传'},description:'个人空间中的品牌素材'},
    {id:'personal-notes',spaceId:'personal:u-wangyilin',projectId:null,area:'personal',parent_id:0,name:'项目复盘备忘.md',type:'blob',size:18640,extension:'md',creator:'王宜林',editor:'王宜林',createdBy:'王宜林',updatedBy:'王宜林',updated_at:'2026-09-06T16:40:00+08:00',source:{type:'upload',label:'本地上传'},description:'个人空间文件'},
    sharedFolder('shared-brand-guides','shared:brand','品牌规范','王宜林','2026-09-06T16:20:00+08:00'),
    sharedFile('shared-brand-pdf','shared:brand','品牌使用说明.pdf',806912,'何静','何静','2026-09-06T18:05:00+08:00',{type:'library-copy',label:'从私聊保存 · 何静'},'保存到共享空间后的独立副本','shared-brand-guides'),
    sharedFile('shared-brand-assets','shared:brand','秋季发布会素材清单.xlsx',184320,'王宜林','王宜林','2026-09-07T09:15:00+08:00',{type:'upload',label:'王宜林本地上传'},'市场素材制作与发布进度'),
    sharedFolder('shared-partner-contracts','shared:partners','合同与合规','何静','2026-09-05T15:30:00+08:00'),
    sharedFile('shared-partner-plan','shared:partners','合作伙伴联合方案.docx',395264,'何静','何静','2026-09-07T14:20:00+08:00',{type:'library-copy',label:'从群聊保存 · 合作伙伴沟通群'},'保存到共享空间后的独立副本'),
    sharedFile('shared-partner-check','shared:partners','合作方准入检查表.xlsx',124928,'苏航','未编辑过','2026-09-05T15:30:00+08:00',{type:'upload',label:'苏航本地上传'},'合作方准入材料检查','shared-partner-contracts'),
    sharedFile('shared-public-policy','shared:public','信息安全管理制度.pdf',1052672,'周远','周远','2026-09-03T10:00:00+08:00',{type:'upload',label:'周远本地上传'},'内部公共制度文件'),
    sharedFile('shared-public-template','shared:public','项目复盘模板.docx',94208,'何静','何静','2026-09-02T16:40:00+08:00',{type:'upload',label:'何静本地上传'},'供内部项目使用的公共模板')
  ];

  const relation=(type,id,label,meta)=>({type,id,label,meta});
  const RECORD_METADATA={
    'prod-report':{tags:['质量','整改'],systemRelations:[relation('task','SC-103','SC-103 · 来料异常分析','进行中 · 负责人：林晓')]},
    'prod-demand':{tags:['采购','预算']},
    'prod-compliance':{tags:['供应商','准入'],systemRelations:[relation('group','supply-demo-rectification','供应商整改协同','项目群 · 来源文件')]},
    'prod-minutes':{tags:['周会','纪要'],systemRelations:[relation('task','SC-105','SC-105 · 项目周报','进行中 · 负责人：周远')]},
    'prod-qualification':{tags:['供应商','资质']},
    'lab-profile':{tags:['客户资料'],systemRelations:[relation('group','all:lab','客户联合交付群','项目群 · 来源文件')]},
    'lab-script':{tags:['销售','客户'],systemRelations:[relation('task','LAB-12','客户销售准备','已完成 · 负责人：苏航')]},
    'personal-brand':{tags:['品牌','素材']},
    'personal-notes':{tags:['复盘']},
    'shared-brand-pdf':{tags:['品牌','规范'],systemRelations:[relation('chat','dm:u-hejing','私聊 · 何静','来源文件')]},
    'shared-brand-assets':{tags:['市场','发布会']},
    'shared-partner-plan':{tags:['合作伙伴','方案'],systemRelations:[relation('group','partner-chat','合作伙伴沟通群','群聊 · 来源文件')]},
    'shared-partner-check':{tags:['准入','检查']},
    'shared-public-policy':{tags:['制度','信息安全']},
    'shared-public-template':{tags:['模板','复盘']}
  };
  const normalizeRecord=item=>{
    const preset=RECORD_METADATA[item.id]||{},isFolder=item.type==='folder',normalized=clone(item);delete normalized.category;
    const systemRelations=clone(item.systemRelations||preset.systemRelations||[]).filter(itemRelation=>itemRelation.type!=='run');
    return {...normalized,createdAt:item.createdAt||item.created_at||item.updated_at||stamp(),tags:isFolder?[]:clone(item.tags||preset.tags||[]),systemRelations};
  };

  function create(membership,seed=[],persist,resetSeed=seed,sharedSpaceSeed=DEFAULT_SHARED_SPACES){
    let records=clone(seed).map(normalizeRecord),sharedSpaces=clone(sharedSpaceSeed),revision=0;const listeners=new Set();
    const actorName=actorId=>membership.person(actorId)?.name||membership.clone?.(actorId)?.name||membership.employee?.(actorId)?.name||membership.projectAgent?.(String(actorId).replace(/^project-agent:/,''))?.name||actorId;
    const snapshot=()=>membership.snapshot();
    const personalSpace=actorId=>'personal:'+actorId;
    const sharedSpace=spaceId=>sharedSpaces.find(item=>item.id===spaceId)||null;
    const role=(spaceId,actorId)=>{
      if(spaceId===personalSpace(actorId))return'owner';
      const shared=sharedSpace(spaceId);
      if(shared){
        const member=shared.members.find(item=>item.id===actorId);
        if(!member)return null;
        if(shared.ownerId===actorId||member.role==='owner')return'owner';
        return member.role==='manager'?'manager':'editor';
      }
      const project=snapshot().projects[spaceId];
      const row=project?.humans?.find(item=>item.id===actorId);
      if(!row)return membership.canRead(spaceId,actorId)?'editor':null;
      if(project.ownerId===actorId||row.role==='owner')return'owner';
      if(row.role==='admin')return'manager';
      return'editor';
    };
    const editableActions=new Set(['read','preview','download','upload','create-folder','rename','move','copy','copy-link','save-group-file','edit-tags','create-shortcut']);
    const managerActions=new Set(['trash','view-trash','restore','delete-forever','manage-members','manage-links','manage-settings','view-audit']);
    const ownerActions=new Set(['set-manager','transfer-ownership']);
    const can=(action,spaceId,actorId)=>{
      const value=role(spaceId,actorId);
      return Boolean(value&&(editableActions.has(action)||(value!=='editor'&&managerActions.has(action))||(value==='owner'&&ownerActions.has(action))));
    };
    const fail=message=>{throw new Error(message);};
    const requireAction=(action,spaceId,actorId)=>can(action,spaceId,actorId)||fail('当前角色无此操作权限');
    const notify=()=>{revision++;if(persist)persist(clone(records),clone(sharedSpaces));listeners.forEach(fn=>fn());};
    const record=id=>records.find(item=>item.id===id)||fail('文件不存在');
    const areaForSpace=spaceId=>spaceId.startsWith('personal:')?'personal':spaceId.startsWith('shared:')?'shared':'project';
    const projectForSpace=spaceId=>areaForSpace(spaceId)==='project'?spaceId:null;
    const ensureSameSpace=(item,targetParentId)=>{
      if(!targetParentId)return;
      const target=record(targetParentId);
      if(target.type!=='folder'||target.spaceId!==item.spaceId)fail('不能跨空间移动或复制');
    };
    const descendants=id=>{const ids=new Set([id]);let changed=true;while(changed){changed=false;for(const item of records){if(ids.has(item.parent_id)&&!ids.has(item.id)){ids.add(item.id);changed=true;}}}return ids;};
    const shortcutSource=item=>item.type==='shortcut'?records.find(candidate=>candidate.id===item.sourceFileId)||null:null;
    const shortcutStatus=(item,actorId)=>{
      if(item.type!=='shortcut')return'available';
      const source=shortcutSource(item);if(!source||source.deletedAt)return'missing';
      return role(source.spaceId,actorId)?'available':'forbidden';
    };
    const visibleRecord=(item,actorId)=>{
      const value=clone(item);if(item.type!=='shortcut'||!actorId)return value;
      const status=shortcutStatus(item,actorId),source=shortcutSource(item);value.shortcutStatus=status;
      if(status==='available'){
        value.name=item.customName?item.name:source.name;value.extension=source.extension||ext(source.name);value.size=source.size||0;value.sourceAvailable=true;
      }else{
        value.name=status==='missing'?'源文件已失效':'无权访问的快捷方式';value.extension='';value.size=0;value.sourceAvailable=false;value.systemRelations=[];
      }
      return value;
    };
    const normalizeTags=value=>Array.from(new Set((Array.isArray(value)?value:String(value||'').split(/[，,]/)).map(tag=>String(tag).trim()).filter(Boolean))).slice(0,8).map(tag=>tag.slice(0,20));
    const spaceLabel=(spaceId,actorId)=>{
      if(spaceId===personalSpace(actorId))return'个人空间';
      const shared=sharedSpace(spaceId);if(shared)return shared.name;
      return snapshot().projects[spaceId]?.name||'项目空间';
    };
    const api={
      subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>revision,
      snapshot(actorId){return clone(records.map(item=>visibleRecord(item,actorId)));},role,can,personalSpace,
      fileTypeFor(idOrRecord,actorId){
        const item=typeof idOrRecord==='string'?record(idOrRecord):idOrRecord;if(item.type==='folder')return'文件夹';
        if(item.type==='shortcut'){
          const visible=visibleRecord(item,actorId);return visible.shortcutStatus==='available'?fileTypeLabel(visible.name)+' · 快捷方式':'快捷方式';
        }
        return fileTypeLabel(item.name);
      },
      shortcutInfo(idOrRecord,actorId){
        const item=typeof idOrRecord==='string'?record(idOrRecord):idOrRecord;if(item.type!=='shortcut')return null;
        const status=shortcutStatus(item,actorId),source=shortcutSource(item);
        if(status!=='available')return{status,statusLabel:status==='missing'?'源文件已失效':'无权访问源文件'};
        return{status,statusLabel:'可访问',sourceName:source.name,sourceSpaceId:source.spaceId,sourceSpaceName:spaceLabel(source.spaceId,actorId)};
      },
      resolveFile(idOrRecord,actorId){
        const item=typeof idOrRecord==='string'?record(idOrRecord):record(idOrRecord.id);if(item.type!=='shortcut'){requireAction('read',item.spaceId,actorId);return clone(item);}
        if(shortcutStatus(item,actorId)!=='available')fail(shortcutStatus(item,actorId)==='missing'?'源文件已失效':'你无权访问源文件');return clone(shortcutSource(item));
      },
      writableSpaces(actorId,excludeSpaceId){
        const result=[{id:personalSpace(actorId),name:'个人空间',kind:'personal'}];
        sharedSpaces.forEach(space=>{if(role(space.id,actorId))result.push({id:space.id,name:space.name,kind:'shared'});});
        Object.entries(snapshot().projects).forEach(([projectId,project])=>{if(role(projectId,actorId))result.push({id:projectId,name:project.name||projectId,kind:'project'});});
        return clone(result.filter(space=>space.id!==excludeSpaceId));
      },
      relationsFor(idOrRecord,actorId){
        const item=typeof idOrRecord==='string'?record(idOrRecord):idOrRecord;
        if(item.type==='shortcut'){
          const info=api.shortcutInfo(item,actorId);
          if(info.status!=='available')return[{type:'file',id:null,label:info.statusLabel,meta:'快捷方式不会授予源文件权限',restricted:true}];
          return[relation('file',item.sourceFileId,info.sourceName,'来源空间 · '+info.sourceSpaceName)];
        }
        return clone(item.systemRelations||[]).map(itemRelation=>{
          if(itemRelation.type==='group'&&itemRelation.id&&!membership.canRead(itemRelation.id,actorId))return {...itemRelation,label:'来源群聊',meta:'你无权访问来源消息',restricted:true};
          return itemRelation;
        });
      },
      sourceLabelFor(idOrRecord,actorId){
        const item=typeof idOrRecord==='string'?record(idOrRecord):idOrRecord;
        if(item.type==='shortcut'){const info=api.shortcutInfo(item,actorId);return info.status==='available'?'快捷方式 · '+info.sourceSpaceName:info.statusLabel;}
        if(item.source?.groupId&&!membership.canRead(item.source.groupId,actorId))return'从群聊保存';
        return item.source?.label||'空间内创建';
      },
      sharedSpaces(actorId){return clone(sharedSpaces.filter(space=>space.members.some(member=>member.id===actorId)));},
      sharedSpace(spaceId,actorId){const space=sharedSpace(spaceId);return space&&(!actorId||space.members.some(member=>member.id===actorId))?clone(space):null;},
      sharedMembers(spaceId,actorId){if(!role(spaceId,actorId))return[];return clone(sharedSpace(spaceId)?.members||[]).map(member=>({...member,name:actorName(member.id)}));},
      sharedMemberCandidates(spaceId,actorId){requireAction('manage-members',spaceId,actorId);const joined=new Set(sharedSpace(spaceId)?.members.map(member=>member.id)||[]);return clone(snapshot().people.filter(person=>person.active!==false&&!joined.has(person.id)).map(person=>({id:person.id,name:person.name||person.id})));},
      addSharedMember(actorId,spaceId,memberId){requireAction('manage-members',spaceId,actorId);const space=sharedSpace(spaceId);if(!space)fail('共享空间不存在');const person=membership.person(memberId);if(!person)fail('请选择有效成员');if(space.members.some(member=>member.id===memberId))return;space.members.push({id:memberId,role:'editor'});notify();},
      removeSharedMember(actorId,spaceId,memberId){
        requireAction('manage-members',spaceId,actorId);const space=sharedSpace(spaceId);if(!space)fail('共享空间不存在');const member=space.members.find(item=>item.id===memberId);if(!member)fail('成员不存在');
        if(memberId===space.ownerId)fail('请先转移空间所有权');if(memberId===actorId)fail('不能在成员管理中移除自己');if(member.role==='manager')requireAction('set-manager',spaceId,actorId);space.members=space.members.filter(item=>item.id!==memberId);notify();
      },
      createSharedSpace(actorId,draft={}){
        const name=String(draft.name||'').trim();if(!name)fail('请输入共享空间名称');
        const id='shared:'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
        sharedSpaces.unshift({id,name,mark:String(draft.mark||name.slice(0,1)),description:String(draft.description||'团队共享文件空间').trim(),ownerId:actorId,createdAt:stamp(),members:[{id:actorId,role:'owner'}]});notify();return id;
      },
      updateSharedSpace(actorId,spaceId,draft={}){
        requireAction('manage-settings',spaceId,actorId);const space=sharedSpace(spaceId);if(!space)fail('共享空间不存在');
        const name=String(draft.name||space.name).trim();if(!name)fail('请输入共享空间名称');space.name=name;space.mark=name.slice(0,1);space.description=String(draft.description??space.description).trim();notify();
      },
      setSharedMemberRole(actorId,spaceId,memberId,nextRole){
        const space=sharedSpace(spaceId);if(!space)fail('共享空间不存在');const member=space.members.find(item=>item.id===memberId);if(!member)fail('成员不存在');
        if(nextRole==='manager'||member.role==='manager')requireAction('set-manager',spaceId,actorId);else requireAction('manage-members',spaceId,actorId);
        if(memberId===space.ownerId)fail('请先转移空间所有权');member.role=nextRole==='manager'?'manager':'editor';notify();
      },
      transferSharedOwnership(actorId,spaceId,nextOwnerId){
        requireAction('transfer-ownership',spaceId,actorId);const space=sharedSpace(spaceId);if(!space)fail('共享空间不存在');const next=space.members.find(item=>item.id===nextOwnerId);if(!next)fail('新 Owner 必须是空间成员');
        const old=space.members.find(item=>item.id===space.ownerId);if(old)old.role='manager';next.role='owner';space.ownerId=nextOwnerId;notify();
      },
      list(spaceId,actorId,options={}){
        if(!role(spaceId,actorId))return[];
        return clone(records.filter(item=>item.spaceId===spaceId&&(options.deleted?Boolean(item.deletedAt):!item.deletedAt)).map(item=>visibleRecord(item,actorId)));
      },
      trashList(spaceId,actorId){requireAction('view-trash',spaceId,actorId);return clone(records.filter(item=>item.spaceId===spaceId&&item.deletedAt).map(item=>visibleRecord(item,actorId)));},
      all(actorId){return clone(records.filter(item=>!item.deletedAt&&Boolean(role(item.spaceId,actorId))).map(item=>visibleRecord(item,actorId)));},
      createFolder(actorId,spaceId,name,parentId=0){
        requireAction('create-folder',spaceId,actorId);name=String(name||'').trim();if(!name)fail('请输入文件夹名称');
        const now=stamp(),area=areaForSpace(spaceId),item={id:'folder-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),spaceId,projectId:projectForSpace(spaceId),area,parent_id:parentId||0,name,type:'folder',size:0,creator:actorName(actorId),editor:'未编辑过',createdBy:actorName(actorId),updatedBy:actorName(actorId),createdAt:now,updated_at:now,tags:[],systemRelations:[],source:{type:'created',label:'新建文件夹'},description:area==='shared'?'共享空间文件夹':'文件夹'};
        ensureSameSpace(item,parentId);records.unshift(item);notify();return item.id;
      },
      upload(actorId,spaceId,blob,parentId=0){
        requireAction('upload',spaceId,actorId);if(!blob?.name)fail('请选择文件');
        const name=String(blob.name),now=stamp(),area=areaForSpace(spaceId),item={id:'upload-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),spaceId,projectId:projectForSpace(spaceId),area,parent_id:parentId||0,name,type:'blob',size:Number(blob.size||0),extension:ext(name),creator:actorName(actorId),editor:'未编辑过',createdBy:actorName(actorId),updatedBy:actorName(actorId),createdAt:now,updated_at:now,tags:[],systemRelations:[],source:{type:'upload',label:actorName(actorId)+'本地上传'},description:'本地上传文件'};
        ensureSameSpace(item,parentId);records.unshift(item);notify();return item.id;
      },
      rename(actorId,id,name){const item=record(id);requireAction('rename',item.spaceId,actorId);name=String(name||'').trim();if(!name)fail('请输入名称');item.name=name;if(item.type==='shortcut')item.customName=true;else records.filter(candidate=>candidate.type==='shortcut'&&candidate.sourceFileId===item.id&&!candidate.customName).forEach(shortcut=>{shortcut.name=name;});item.updatedBy=actorName(actorId);item.editor=actorName(actorId);item.updated_at=stamp();notify();},
      move(actorId,id,parentId=0){const item=record(id);requireAction('move',item.spaceId,actorId);if(id===parentId||descendants(id).has(parentId))fail('不能移动到自身或子文件夹');ensureSameSpace(item,parentId);item.parent_id=parentId||0;item.updatedBy=actorName(actorId);item.editor=actorName(actorId);item.updated_at=stamp();notify();},
      updateTags(actorId,id,tags){
        const item=record(id);requireAction('edit-tags',item.spaceId,actorId);if(item.type==='folder')fail('文件夹无需设置标签');item.tags=normalizeTags(tags);notify();
      },
      createShortcut(actorId,sourceId,targetSpaceId,targetParentId=0){
        const source=record(sourceId);if(source.type==='folder')fail('当前版本不支持文件夹快捷方式');if(source.type==='shortcut')fail('不能为快捷方式再次创建快捷方式');if(source.deletedAt)fail('源文件已进入回收站');
        requireAction('read',source.spaceId,actorId);requireAction('create-shortcut',targetSpaceId,actorId);if(source.spaceId===targetSpaceId)fail('请选择其他空间');
        const targetProbe={spaceId:targetSpaceId};ensureSameSpace(targetProbe,targetParentId);
        if(records.some(item=>item.type==='shortcut'&&!item.deletedAt&&item.sourceFileId===source.id&&item.spaceId===targetSpaceId&&item.parent_id===(targetParentId||0)))fail('目标文件夹中已存在该文件的快捷方式');
        const now=stamp(),area=areaForSpace(targetSpaceId),item={id:'shortcut-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),spaceId:targetSpaceId,projectId:projectForSpace(targetSpaceId),area,parent_id:targetParentId||0,name:source.name,type:'shortcut',sourceFileId:source.id,sourceSpaceId:source.spaceId,extension:source.extension||ext(source.name),size:0,customName:false,creator:actorName(actorId),createdBy:actorName(actorId),editor:'未编辑过',updatedBy:actorName(actorId),createdAt:now,updated_at:now,tags:[],systemRelations:[],source:{type:'shortcut',label:'跨空间快捷方式'},description:'指向其他空间源文件的快捷方式'};
        records.unshift(item);notify();return item.id;
      },
      copy(actorId,id,parentId){
        const source=record(id);if(source.type==='shortcut')fail('快捷方式不能创建副本');requireAction('copy',source.spaceId,actorId);parentId=parentId===undefined?source.parent_id:parentId;ensureSameSpace(source,parentId);
        const ids=descendants(id),mapping=new Map(),now=stamp();for(const sourceId of ids)mapping.set(sourceId,'copy-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7));
        for(const sourceId of ids){
          const original=record(sourceId),isRoot=sourceId===id,name=isRoot?original.name.replace(/(\.[^.]+)?$/,' 副本$1'):original.name;
          const inherited=(original.systemRelations||[]).map(itemRelation=>({...clone(itemRelation),inherited:true}));
          if(isRoot&&original.type!=='folder')inherited.push(relation('file',original.id,'副本来源 · '+original.name,'在当前空间创建的副本'));
          records.unshift({...clone(original),id:mapping.get(sourceId),name,parent_id:isRoot?(parentId||0):mapping.get(original.parent_id),creator:actorName(actorId),createdBy:actorName(actorId),editor:actorName(actorId),updatedBy:actorName(actorId),createdAt:now,updated_at:now,systemRelations:inherited,deletedAt:null,deletedBy:null,originalParentId:null});
        }
        notify();return mapping.get(id);
      },
      trash(actorId,id){const item=record(id);requireAction('trash',item.spaceId,actorId);const when=stamp(),ids=descendants(id);for(const target of records){if(ids.has(target.id)){target.deletedAt=when;target.deletedBy=actorName(actorId);target.originalParentId=target.parent_id;}}notify();},
      restore(actorId,id){const item=record(id);requireAction('restore',item.spaceId,actorId);const ids=descendants(id),restoreParent=item.originalParentId||0;for(const target of records){if(ids.has(target.id)){delete target.deletedAt;delete target.deletedBy;delete target.originalParentId;}}item.parent_id=restoreParent;notify();},
      removeForever(actorId,id){const item=record(id);requireAction('delete-forever',item.spaceId,actorId);const ids=descendants(id);records=records.filter(target=>!ids.has(target.id));notify();},
      resetProjectDemo(projectId){records=records.filter(r=>r.projectId!==projectId);records.push(...clone(resetSeed.filter(r=>r.projectId===projectId)).map(normalizeRecord));notify();},
      transfer(actorId,projectId,sourceFile,source){
        if(!membership.canRead(source.groupId,actorId))fail('你已不在来源群，无法转存此文件');
        if(!membership.canRead(projectId,actorId))fail('请先加入目标项目');
        if(!snapshot().projects[projectId])fail('请选择有效项目');
        if(!sourceFile?.name)fail('文件不存在');
        requireAction('save-group-file',projectId,actorId);
        const version=sourceFile.version||1,identity=JSON.stringify([projectId,source.groupId,source.threadId||null,sourceFile.id||sourceFile.name,version]);
        const old=records.find(r=>r.identity===identity);if(old)return old.id;
        const id='saved-'+Date.now().toString(36),name=sourceFile.name,now=stamp(),taskId=source.taskId||sourceFile.taskId||null;
        const systemRelations=[relation('group',source.groupId,source.groupName||'来源群','项目群 · 来源文件')];
        if(taskId)systemRelations.push(relation('task',taskId,'任务 · '+taskId,'来源任务'));
        const recordValue={id,identity,spaceId:projectId,projectId,area:'project',name,size:sourceFile.size||0,extension:sourceFile.extension||ext(name),sourceVersion:version,sharedVersion:true,source:{type:'group-copy',label:'项目群 · '+(source.groupName||'来源群'),groupId:source.groupId,groupName:source.groupName||'来源群',threadId:source.threadId||null,threadName:source.threadName||null,taskId},systemRelations,tags:clone(sourceFile.tags||[]),transferredBy:actorId,createdAt:now,updated_at:now,parent_id:0,type:'blob',creator:actorName(actorId),editor:'未编辑过',createdBy:actorName(actorId),updatedBy:actorName(actorId),description:'从项目群保存到项目文件管理的独立副本'};
        records.push(recordValue);notify();return id;
      }
    };
    return api;
  }

  function bootstrap(membership){
    const key='eva:file-store:v5';let saved,spaces;
    try{const value=JSON.parse(root.localStorage.getItem(key));if(value?.schema===5&&Array.isArray(value.records)&&Array.isArray(value.sharedSpaces)){saved=value.records;spaces=value.sharedSpaces;}}catch{}
    if(!saved){
      saved=clone(DEFAULT_RECORDS);spaces=clone(DEFAULT_SHARED_SPACES);
      try{
        const legacy=JSON.parse(root.localStorage.getItem('eva:file-store:v4'));
        if(legacy?.schema===4&&Array.isArray(legacy.records)){saved=legacy.records;if(Array.isArray(legacy.sharedSpaces))spaces=legacy.sharedSpaces;}
      }catch{}
      try{
        const legacy=JSON.parse(root.localStorage.getItem('eva:file-store:v3'));
        if(legacy?.schema===3&&Array.isArray(legacy.records)){saved=legacy.records;if(Array.isArray(legacy.sharedSpaces))spaces=legacy.sharedSpaces;}
      }catch{}
      try{
        const legacy=JSON.parse(root.localStorage.getItem('eva:file-store:v2'));
        if(legacy?.schema===2&&Array.isArray(legacy.records)){
          const retained=legacy.records.filter(item=>item.area!=='shared'&&item.area!=='conversation');
          const byId=new Map(saved.map(item=>[item.id,item]));retained.forEach(item=>byId.set(item.id,item));saved=Array.from(byId.values());
        }
      }catch{}
      try{const legacy=JSON.parse(root.localStorage.getItem('eva:shared-files:v1'));if(Array.isArray(legacy))saved.push(...legacy.map(item=>({...item,spaceId:item.projectId,area:'project'})));}catch{}
    }
    return create(membership,saved,(records,sharedSpaces)=>{try{root.localStorage.setItem(key,JSON.stringify({schema:5,records,sharedSpaces}));}catch{}},DEFAULT_RECORDS,spaces||DEFAULT_SHARED_SPACES);
  }

  root.EvaFileSharing=Object.freeze({create,bootstrap,DEFAULT_RECORDS:clone(DEFAULT_RECORDS),DEFAULT_SHARED_SPACES:clone(DEFAULT_SHARED_SPACES)});
})(window);
