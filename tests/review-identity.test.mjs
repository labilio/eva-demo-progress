import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('review signature shares same-tab and cross-tab changes without inventing anonymous ownership',()=>{
 const values=new Map(), events=new EventTarget();
 const scope={window:events,Event,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
 vm.createContext(scope);
 vm.runInContext(readFileSync(new URL('../review/review-identity.mjs',import.meta.url),'utf8').replaceAll('export function','function'),scope);
 const seen=[];const stop=scope.subscribeReviewAuthor(name=>seen.push(name));
 scope.setReviewAuthor(' Alice ');assert.equal(scope.getReviewAuthor(),'Alice');assert.equal(seen.at(-1),'Alice');
 values.set('eva-review-author','Bob');const event=new Event('storage');event.key='eva-review-author';events.dispatchEvent(event);assert.equal(seen.at(-1),'Bob');
 scope.setReviewAuthor('匿名同事');assert.equal(scope.getReviewAuthor(),'');
 stop();const count=seen.length;scope.setReviewAuthor('Carol');assert.equal(seen.length,count);
});
