(function(root){
  'use strict';
  function create(membership,seed=[],persist){
    let records=JSON.parse(JSON.stringify(seed)),revision=0;const listeners=new Set();
    return {
      subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>revision,
      list(projectId,actorId){return membership.canRead(projectId,actorId)?JSON.parse(JSON.stringify(records.filter(r=>r.projectId===projectId))):[];},
      resetProjectDemo(projectId){records=records.filter(r=>r.projectId!==projectId);if(persist)persist(JSON.parse(JSON.stringify(records)));revision++;listeners.forEach(fn=>fn());},
      transfer(actorId,projectId,file,source){
        if(!membership.canRead(source.groupId,actorId))throw Error('你已不在来源群，无法转存此文件');
        if(!membership.canRead(projectId,actorId))throw Error('请先加入目标项目');
        if(!membership.snapshot().projects[projectId])throw Error('请选择有效项目');
        if(!file?.name)throw Error('文件不存在');
        const version=file.version||1,identity=JSON.stringify([projectId,source.groupId,source.threadId||null,file.id||file.name,version]);
        const old=records.find(r=>r.identity===identity);if(old)return old.id;
        const id='shared-'+(records.length+1),record={id,identity,projectId,name:file.name,size:file.size||0,extension:file.extension||file.name.split('.').pop(),sourceVersion:version,sharedVersion:true,source:{groupId:source.groupId,groupName:source.groupName||'来源群',threadId:source.threadId||null,threadName:source.threadName||null,taskId:source.taskId||file.taskId||null},transferredBy:actorId,updated_at:new Date().toISOString(),parent_id:0,type:'blob',creator:membership.person(actorId)?.name||actorId,editor:'共享版本'};
        records.push(record);if(persist)persist(JSON.parse(JSON.stringify(records)));revision++;listeners.forEach(fn=>fn());return id;
      }
    };
  }
  function bootstrap(membership){const key='eva:shared-files:v1';let seed=[];try{const saved=JSON.parse(root.localStorage.getItem(key));if(Array.isArray(saved))seed=saved;}catch{}return create(membership,seed,records=>{try{root.localStorage.setItem(key,JSON.stringify(records));}catch{}});}
  root.EvaFileSharing={create,bootstrap};
})(window);
