const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../_source/room.dc.html'), 'utf8');
const logic = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
function room(saved) {
  const data = new Map(saved ? [['midnight-study-room.v1', JSON.stringify(saved)]] : []);
  const storage = {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  class DCLogic {setState(patch) {Object.assign(this.state, patch);}}
  const ctx = vm.createContext({DCLogic, window:{localStorage:storage}, URL, Date, console, setTimeout, clearTimeout});
  vm.runInContext(logic + '\nthis.api={Component,normTask,placeOf,dayKey,toRow,mergeData};', ctx);
  const c = new ctx.api.Component();
  c.scheduleSync = ()=>{};
  c.remember = ()=>{};
  return {c,api:ctx.api,data};
}
function task(api, extra={}) {return api.normTask({id:'test', text:'Sample essay', kind:'assignment',status:'open',course:'wri',...extra});}
test('Legacy data loads without claiming Canvas submission; ordinary tasks still complete',()=>{
  const {c,api}=room({tasks:[{id:'old',text:'Old essay',kind:'assignment',status:'done',doneOn:'2026-10-28'},{id:'task',text:'Read notes',done:true}]});
  assert.equal(c.findTask('old').workflow,'');
  assert.equal(c.findTask('old').submittedAt,'');
  assert.match(c.taskView(c.findTask('old'),api.dayKey(),'completed').meta,/submission unconfirmed/);
  assert.equal(c.findTask('task').status,'done');
  c.toggleTask('task'); assert.equal(c.findTask('task').status,'open');
  c.toggleTask('task'); assert.equal(c.findTask('task').status,'done');
});
test('Finishing every mini-step leaves the assignment open; Ready stays visible even with a future day',()=>{
  const {c,api}=room();c.state.tasks=[task(api,{day:'2099-12-01',steps:[{id:'draft',text:'Draft',minutes:20}]})];
  c.toggleStep('test','draft');
  assert.equal(c.findTask('test').steps[0].done,true);
  assert.equal(c.findTask('test').status,'open');
  assert.equal(c.findTask('test').workflow,'in_progress');
  c.toggleTask('test');
  const t=c.findTask('test');
  assert.equal(t.workflow,'ready');assert.equal(t.status,'open');assert.equal(t.submittedAt,'');
  assert.equal(api.placeOf(t,api.dayKey()),'today');
  const view=c.taskView(t,api.dayKey(),'today');assert.equal(view.checkable,true);assert.equal(view.assignmentAction,true);
});
test('Submission requires explicit editor confirmation; reopening clears confirmation',()=>{
  const {c,api}=room();c.state.tasks=[task(api,{workflow:'ready'})];
  c.toggleTask('test');assert.equal(c.state.edit.id,'test');assert.equal(c.findTask('test').status,'open');
  c.setEdit({workflow:'submitted',receipt:'https://canvas.example/receipt'});c.saveEdit();
  const t=c.findTask('test');assert.equal(t.status,'done');assert.ok(t.submittedAt);assert.equal(t.receipt,'https://canvas.example/receipt');
  c.startEdit('test');c.setEdit({workflow:'in_progress'});c.saveEdit();
  assert.equal(c.findTask('test').status,'open');assert.equal(c.findTask('test').submittedAt,'');
});
test('Details survive save/reload, backup/restore, and legacy Sheet responses',()=>{
  const {c,api,data}=room();c.state.tasks=[task(api,{workflow:'ready',steps:[{id:'outline',text:'Outline',done:true,minutes:15}],receipt:'https://canvas.example/receipt'})];
  c.persist();
  const reloaded=room(JSON.parse(data.get('midnight-study-room.v1'))).c;
  assert.equal(reloaded.findTask('test').steps[0].minutes,15);
  assert.equal(reloaded.findTask('test').workflow,'ready');
  const backup=JSON.parse(c.backupJson());
  const fresh=room();const merged=fresh.api.mergeData(fresh.c.state,backup);fresh.c.setState(merged.patch);
  assert.equal(fresh.c.findTask('test').steps[0].done,true);
  assert.equal(fresh.api.mergeData(fresh.c.state,backup).added.tasks,0);
  c.applyRemote([{id:'test',title:'Updated title from brief',kind:'assignment',status:'done',due:'2026-11-03'}],{});
  assert.equal(c.findTask('test').text,'Updated title from brief');
  assert.equal(c.findTask('test').due,'2026-11-03');
  assert.equal(c.findTask('test').workflow,'ready');assert.equal(c.findTask('test').status,'open');
  assert.equal(c.findTask('test').steps.length,1);assert.equal(c.findTask('test').receipt,'https://canvas.example/receipt');
});
test('Invalid receipts and unnamed steps do not commit an edit',()=>{
  const {c,api}=room();c.state.tasks=[task(api)];c.startEdit('test');
  c.setEdit({receipt:'javascript:alert(1)',workflow:'submitted'});c.saveEdit();
  assert.equal(c.findTask('test').status,'open');assert.ok(c.state.editErr);
  c.setEdit({receipt:''});c.addStep();c.saveEdit();assert.ok(c.state.editErr);
  assert.equal(c.findTask('test').steps.length,0);
});
