/* Pure, versioned data model for the room extension. No network calls. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RoomWorldsCore = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var COURSES = {calc:'Calculus',bio:'Biology',lab:'Biology Lab',bme:'Biomedical Engineering',wri:'Writing',com:'Communication'};
  var WORLDS = {forest:'Enchanted forest',sea:'Moonlit sea',city:'Rainy city',snow:'Snowy village'};
  function own(o,k) { return Object.prototype.hasOwnProperty.call(o,k); }
  function text(v,n) { return typeof v === 'string' ? v.slice(0,n) : ''; }
  function list(v) { return Array.isArray(v) ? v : []; }
  function num(v,max) { return Math.max(0,Math.min(max,Number(v)||0)); }
  function id() { return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10); }
  function keyed(items, fn, max) { var seen=new Set();return list(items).map(fn).filter(function(x){if(!x||seen.has(x.id))return false;seen.add(x.id);return true;}).slice(0,max); }
  function norm(raw) {
    var d=raw&&typeof raw==='object'?raw:{};
    var notebooks={};Object.keys(COURSES).forEach(function(k){var n=(d.notebooks||{})[k]||{};notebooks[k]={notes:text(n.notes,40000),resume:text(n.resume,500),cards:keyed(n.cards,function(c){return c&&text(c.q,1000).trim()&&text(c.a,3000).trim()?{id:text(c.id,120)||id(),q:text(c.q,1000),a:text(c.a,3000)}:null;},300)};});
    return {v:1,world:own(WORLDS,d.world)?d.world:'forest',petName:text(d.petName,24)||'Moth',petLook:['cat','owl','ghost'].indexOf(d.petLook)>=0?d.petLook:'cat',quiet:!!d.quiet,
      visited:list(d.visited).filter(function(w,i,a){return own(WORLDS,w)&&a.indexOf(w)===i;}),
      discoveries:list(d.discoveries).filter(function(w,i,a){return ['key','moth','shell','star'].indexOf(w)>=0&&a.indexOf(w)===i;}),
      notebooks:notebooks,thoughts:keyed(d.thoughts,function(x){return x&&text(x.text,2000).trim()?{id:text(x.id,120)||id(),text:text(x.text,2000),at:text(x.at,40),done:!!x.done}:null;},300),
      reflections:keyed(d.reflections,function(x){return x&&text(x.text,4000).trim()?{id:text(x.id,120)||id(),text:text(x.text,4000),at:text(x.at,40)}:null;},300),
      sessions:keyed(d.sessions,function(x){return x&&x.id&&num(x.minutes,180)>0?{id:text(x.id,160),minutes:num(x.minutes,180),course:own(COURSES,x.course)?x.course:'open',at:text(x.at,40)}:null;},5000),
      plants:keyed(d.plants,function(x){return x&&text(x.name,80).trim()?{id:text(x.id,120)||id(),name:text(x.name,80),course:own(COURSES,x.course)?x.course:'open',note:text(x.note,1000)}:null;},24),
      board:keyed(d.board,function(x){return x&&['stroke','label'].includes(x.type)?x.type==='label'?{id:text(x.id,120)||id(),type:'label',text:text(x.text,200),x:num(x.x,1000),y:num(x.y,600)}:{id:text(x.id,120)||id(),type:'stroke',points:list(x.points).slice(0,2000).filter(function(p){return Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);}).map(function(p){return [num(p[0],1000),num(p[1],600)];})}:null;},800),
      constellations:keyed(d.constellations,function(x){return x&&text(x.title,120).trim()?{id:text(x.id,120)||id(),title:text(x.title,120),concepts:list(x.concepts).map(function(c){return text(c,120).trim();}).filter(Boolean).slice(0,8)}:null;},60),
      breakEnd:Number.isFinite(d.breakEnd)?d.breakEnd:0,volume:num(d.volume==null?0.25:d.volume,0.7),
      soundMix:{rain:num(d.soundMix?d.soundMix.rain:.15,1),wind:num(d.soundMix?d.soundMix.wind:.4,1),waves:num(d.soundMix?d.soundMix.waves:0,1)} };
  }
  function unlock(d,key){if(!d.discoveries.includes(key))d.discoveries.push(key);}
  function visit(d,w){if(!own(WORLDS,w))return;d.world=w;if(!d.visited.includes(w))d.visited.push(w);if(d.visited.length===4)unlock(d,'shell');}
  function session(d,x){if(!x||!x.id||d.sessions.some(function(s){return s.id===x.id;}))return false;var valid=norm({sessions:[x]}).sessions[0];if(!valid)return false;d.sessions.push(valid);unlock(d,'moth');if(d.sessions.length>=3)unlock(d,'star');return true;}
  function minutes(d,course){return d.sessions.reduce(function(n,s){return n+(course==='open'||s.course===course?s.minutes:0);},0);}
  function merge(mine, incoming) {
    var a=norm(mine),b=norm(incoming);
    ['discoveries','visited'].forEach(function(k){b[k].forEach(function(x){if(!a[k].includes(x))a[k].push(x);});});
    ['thoughts','reflections','sessions','plants','board','constellations'].forEach(function(k){var ids=new Set(a[k].map(function(x){return x.id;}));b[k].forEach(function(x){if(!ids.has(x.id)){a[k].push(x);ids.add(x.id);}});});
    Object.keys(COURSES).forEach(function(k){if(!a.notebooks[k].notes)a.notebooks[k].notes=b.notebooks[k].notes;if(!a.notebooks[k].resume)a.notebooks[k].resume=b.notebooks[k].resume;var ids=new Set(a.notebooks[k].cards.map(function(x){return x.id;}));b.notebooks[k].cards.forEach(function(x){if(!ids.has(x.id)){a.notebooks[k].cards.push(x);ids.add(x.id);}});});
    return norm(a);
  }
  return {COURSES:COURSES,WORLDS:WORLDS,norm:norm,id:id,visit:visit,unlock:unlock,session:session,minutes:minutes,merge:merge};
});
