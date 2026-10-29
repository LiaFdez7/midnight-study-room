/* A little world around the original room. Local-first, no accounts or requests. */
(function () {
  'use strict';
  const C = window.RoomWorldsCore, KEY = 'midnight-study-room.enchanted.v1';
  let data, storageOK = true;
  try { data = C.norm(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (_) { data = C.norm(); storageOK = false; }
  let host, screen, modal, returnFocus, course = 'bio', reviewIndex = 0, faceUp = false, audio = null, soundOn = false, audioNodes = [], toastTimer, breakTick;
  let lastSaved = '', dirty = false;
  const svgNS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k,v]) => { if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (k === 'class') n.className=v; else if(k==='value')n.value=v;else if(k==='checked')n.checked=v;else n.setAttribute(k, v); });
    kids.flat().forEach(x => { if(x!=null)n.append(x.nodeType ? x : document.createTextNode(String(x))); }); return n;
  }
  function svg(tag, attrs, ...kids) { const n=document.createElementNS(svgNS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));kids.flat().forEach(k=>n.append(k.nodeType?k:document.createTextNode(String(k))));return n; }
  function button(text, action, cls='') {return el('button',{type:'button',class:'ew-control '+cls,onclick:action},text);}
  function help(t){return el('p',{class:'ew-help'},t);}
  function field(label, input){const id='ew-'+C.id();input.id=id;return el('div',{},el('label',{for:id},label),input);}
  function input(value='',attrs={}){return el('input',{type:'text',value,...attrs});}
  function textarea(value='',attrs={}){return el('textarea',{value,...attrs},value);}
  function dateText(v){const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'';}
  function save() {
    dirty=true;
    try {const next=JSON.stringify(data);if(next!==lastSaved)localStorage.setItem(KEY,next);lastSaved=next;dirty=false;storageOK=true;}
    catch(_){storageOK=false;showToast('This browser could not save. Use Settings → Backup before closing.');}
    if(host)host.dataset.quiet=String(data.quiet);
    document.documentElement.dataset.ewQuiet=String(data.quiet);
  }
  function showToast(t){let node=document.getElementById('ew-toast');if(!node){node=el('div',{id:'ew-toast',class:'ew-toast',role:'status'});document.body.append(node);}node.textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.remove(),5500);}
  function unlock(key){const was=data.discoveries.includes(key);C.unlock(data,key);save();if(!was)showToast('A new discovery is waiting in your field journal.');}
  function roomAction(action,detail={}){window.dispatchEvent(new CustomEvent('msr:room-action',{detail:{action,...detail}}));}
  function courseSelect(value,onchange,all=false){const n=el('select',{onchange:e=>onchange(e.target.value)});if(all)n.append(el('option',{value:'open'},'All subjects'));Object.entries(C.COURSES).forEach(([k,v])=>n.append(el('option',{value:k},v)));n.value=value;return n;}
  function catSVG(look=data.petLook){
    if(look==='ghost')return svg('svg',{viewBox:'0 0 140 130','aria-hidden':'true'},svg('path',{d:'M30 112V57C30 8 112 8 112 57V112L97 101L83 113L69 101L55 113L42 101Z',fill:'#d9cedf',stroke:'#a695b9','stroke-width':3}),svg('g',{class:'ew-eyes'},svg('ellipse',{cx:57,cy:57,rx:4,ry:6,fill:'#4f496d'}),svg('ellipse',{cx:86,cy:57,rx:4,ry:6,fill:'#4f496d'})),svg('path',{d:'M65 72Q71 80 78 72',fill:'none',stroke:'#7a668a','stroke-width':2}),svg('circle',{cx:46,cy:70,r:6,fill:'#c99eac',opacity:.6}),svg('circle',{cx:97,cy:70,r:6,fill:'#c99eac',opacity:.6}));
    if(look==='owl')return svg('svg',{viewBox:'0 0 140 130','aria-hidden':'true'},svg('ellipse',{cx:70,cy:86,rx:42,ry:38,fill:'#80748e'}),svg('path',{d:'M30 57L28 20L53 34Q70 23 88 34L113 20L109 60Z',fill:'#a99ab8'}),svg('ellipse',{cx:70,cy:59,rx:43,ry:34,fill:'#b9abc8'}),svg('g',{class:'ew-eyes'},svg('circle',{cx:51,cy:56,r:15,fill:'#eadfca'}),svg('circle',{cx:89,cy:56,r:15,fill:'#eadfca'}),svg('circle',{cx:51,cy:56,r:7,fill:'#3c394f'}),svg('circle',{cx:89,cy:56,r:7,fill:'#3c394f'})),svg('path',{d:'M64 69L70 80L77 69',fill:'#d4b47d'}),svg('path',{d:'M44 93Q70 120 96 93',fill:'none',stroke:'#c6b8ce','stroke-width':3}));
    return svg('svg',{viewBox:'0 0 140 130','aria-hidden':'true'},svg('path',{class:'ew-tail',d:'M43 103C2 105 8 63 25 75C32 83 16 96 46 89',fill:'none',stroke:'#a797bc','stroke-width':15,'stroke-linecap':'round'}),svg('ellipse',{cx:79,cy:92,rx:38,ry:27,fill:'#b6a6c8'}),svg('path',{d:'M42 64L39 20L65 34Q79 29 91 34L115 21L112 68Z',fill:'#b6a6c8',stroke:'#8e7ba9','stroke-width':2}),svg('path',{d:'M47 30L50 48L61 39M105 31L103 48L94 39',fill:'#dbb3c4'}),svg('ellipse',{cx:78,cy:60,rx:39,ry:29,fill:'#c5b6d4'}),svg('g',{class:'ew-eyes'},svg('ellipse',{cx:61,cy:58,rx:4,ry:5.5,fill:'#50455f'}),svg('ellipse',{cx:95,cy:58,rx:4,ry:5.5,fill:'#50455f'}),svg('circle',{cx:62.4,cy:56.2,r:1.3,fill:'#f4ead5'}),svg('circle',{cx:96.4,cy:56.2,r:1.3,fill:'#f4ead5'})),svg('path',{d:'M74 67L82 67L78 72Z',fill:'#ac7d94'}),svg('path',{d:'M78 72Q70 79 66 72M78 72Q86 79 90 72',fill:'none',stroke:'#8f718f','stroke-width':1.5}),svg('path',{d:'M55 100L64 113M92 100L100 113',stroke:'#a18db9','stroke-width':10,'stroke-linecap':'round'}));
  }
  function scenery(world){
    const n=el('div',{class:'ew-scenery','data-world':world,'aria-hidden':'true'},el('div',{class:'ew-stars'}),el('div',{class:'ew-moon'}),el('div',{class:'ew-mist'}));
    if(world==='sea')n.append(el('div',{class:'ew-hills'}),el('div',{class:'ew-water'}));
    else if(world==='city'){for(let i=0;i<8;i++)n.append(el('div',{class:'ew-building',style:`left:${i*14-5}%;height:${28+(i*23)%43}%;width:${14+i%3}%;`}));}
    else {n.append(el('div',{class:'ew-hills'}));for(let i=0;i<7;i++)n.append(el('div',{class:'ew-tree',style:`left:${i*17-8}%;height:${35+(i*11)%35}%;bottom:${i%2*5}%;`}));if(world==='snow')n.append(el('div',{class:'ew-cottage'}));}
    if(world!=='sea')for(let i=0;i<30;i++)n.append(el('i',{class:'ew-particle',style:`left:${i*37%100}%;top:${i*29%100}%;animation-delay:-${i*.73}s;animation-duration:${world==='city'?1.3+(i%5)/8:6+i%9}s;`}));
    return n;
  }
  function windowTarget(){return document.getElementById('ew-window-slot')||document.getElementById('ew-window');}
  function paintWindow(force){const t=windowTarget();if(!t)return;const cur=t.firstElementChild;if(!force&&cur&&cur.dataset.world===data.world)return;t.replaceChildren(scenery(data.world));}
  function labelWorld(){const tag=document.getElementById('ew-world-label');if(!tag)return;tag.textContent='✧ '+C.WORLDS[data.world];tag.setAttribute('aria-label','Change the world outside the window. Now showing: '+C.WORLDS[data.world]);}
  function applyWorld(w){C.visit(data,w);save();renderVisitors();paintWindow(true);labelWorld();if(soundOn)restartAudio();}
  function closeDialog(){if(modal)modal.close();}
  /* Identifies a control across a dialog re-draw: form fields by their label (ids are regenerated), buttons by their text. */
  function keyed(n,key){n.dataset.focusKey=key;return n;}
  function focusKey(n){if(n.dataset&&n.dataset.focusKey)return 'K|'+n.dataset.focusKey;const label=n.labels&&n.labels[0]?n.labels[0].textContent:n.getAttribute('aria-label')||(n.tagName==='BUTTON'?n.textContent:'');return label?n.tagName+'|'+label.trim():'';}
  function openDialog(title, eyebrow, build){
    const reopening=!!(modal&&modal.open),active=document.activeElement,again=reopening&&modal.contains(active)?focusKey(active):'';
    if(!reopening)returnFocus=active;
    closeDialog();if(modal)modal.remove();
    const titleId='ew-title';modal=el('dialog',{class:'ew-dialog','aria-labelledby':titleId});
    const head=el('header',{class:'ew-dialog-head'},el('div',{},el('p',{class:'ew-eyebrow'},eyebrow),el('h2',{id:titleId},title)),button('Close',closeDialog,'ew-subtle'));
    const body=el('div',{class:'ew-dialog-body ew-stack'});modal.append(head,body);document.body.append(modal);build(body);
    const mine=modal;mine.addEventListener('close',()=>{save();if(mine!==modal||mine.open)return;try{returnFocus?.focus({preventScroll:true});}catch(_){}});
    modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
    modal.showModal();if(again){const same=[...modal.querySelectorAll('button,select,input,textarea,[tabindex]')].find(n=>focusKey(n)===again);if(same)same.focus();}return body;
  }
  function makePet(parent,spot){const p=el('button',{class:'ew-pet',type:'button','aria-label':`Visit ${data.petName}, your ${data.petLook} companion`,onclick:petDialog},catSVG(),el('span',{class:'ew-pet-name'},data.petName));if(spot){p.style.left=spot[0]+'px';p.style.bottom=spot[1]+'px';}parent.append(p);return p;}
  const PET_CHAIR=[1070,75],PET_CORNER=[1430,34];
  function updatePet(){document.querySelectorAll('.ew-pet').forEach(p=>{p.replaceChildren(catSVG(),el('span',{class:'ew-pet-name'},data.petName));p.setAttribute('aria-label',`Visit ${data.petName}, your ${data.petLook} companion`);});}
  function petDialog(){openDialog(data.petName,'A friend for the quiet hours',body=>{
    body.append(el('div',{class:'ew-pet-large'},catSVG()),help('Always happy to see you. No feeding timers, lost streaks, or penalties for taking time away.'));
    body.append(el('div',{class:'ew-flex'},button('Pet gently',()=>{showToast(data.petName+(data.petLook==='cat'?' closes their eyes and purrs.':' leans into your hand.'));document.querySelectorAll('.ew-pet').forEach(p=>{p.dataset.pet='true';setTimeout(()=>p.dataset.pet='false',650);});}),button('Study with me',()=>{closeDialog();goRoom();roomAction('focus');}),button('Let me explain',()=>{closeDialog();courseBooks('review');}),button('Walk to the balcony',()=>{closeDialog();balcony();})));
    const name=input(data.petName,{maxlength:24,oninput:e=>{data.petName=e.target.value.trim()||'Moth';save();updatePet();}});
    body.append(field('Companion name',name),el('div',{class:'ew-flex',role:'group','aria-label':'Companion appearance'},...['cat','owl','ghost'].map(look=>{const b=button(look[0].toUpperCase()+look.slice(1),()=>{data.petLook=look;save();updatePet();petDialog();});b.setAttribute('aria-pressed',String(data.petLook===look));return b;})),help('You can change your companion’s appearance whenever you like.'));
  });}
  function worldDialog(){openDialog('Beyond the window','Four places, one little room',body=>{
    const worlds=el('div',{class:'ew-grid'});const descriptions={forest:'Fireflies, deep greens, soft wind.',sea:'A silver path on the water. Slow waves.',city:'Warm distant windows. Rain on the glass.',snow:'A quiet village tucked under fresh snow.'};
    Object.keys(C.WORLDS).forEach(w=>{const b=el('button',{type:'button',class:'ew-world-card','aria-pressed':String(data.world===w),onclick:()=>{applyWorld(w);worldDialog();}},el('div',{class:'ew-world-preview'},scenery(w)),el('strong',{},C.WORLDS[w]),el('span',{class:'ew-help'},descriptions[w]));worlds.append(b);});body.append(worlds);
    if(data.world==='forest'&&!data.discoveries.includes('key'))body.append(button('Look closer: something glints beneath the fern…',()=>{unlock('key');showToast('A brass key. The greenhouse door fits it perfectly.');worldDialog();},'ew-subtle'));
    body.append(el('h3',{},'Make your own soundscape'),help('Sound starts only when you ask. These are gentle generated textures: rain, wind, and waves. Your levels are saved; playback stays off after a reload.'));
    const play=button(soundOn?'Turn sound off':'Turn sound on',async()=>{try{if(soundOn)stopAudio();else await startAudio();play.textContent=soundOn?'Turn sound off':'Turn sound on';}catch(_){showToast('Audio is unavailable in this browser. The room still works silently.');}});body.append(play);
    ['rain','wind','waves'].forEach(k=>body.append(field(k[0].toUpperCase()+k.slice(1),el('input',{type:'range',min:0,max:1,step:.05,value:data.soundMix[k],oninput:e=>{data.soundMix[k]=+e.target.value;save();updateGains();}}))));
    body.append(button('Use this world’s sound preset',()=>{data.soundMix=data.world==='city'?{rain:.8,wind:.1,waves:0}:data.world==='sea'?{rain:0,wind:.15,waves:.7}:data.world==='snow'?{rain:0,wind:.3,waves:0}:{rain:.15,wind:.4,waves:0};save();worldDialog();updateGains();}));
    body.append(field('Overall volume',el('input',{type:'range',min:0,max:.7,step:.01,value:data.volume,oninput:e=>{data.volume=+e.target.value;save();updateGains();}})));
    const quiet=el('input',{type:'checkbox',checked:data.quiet,onchange:e=>{data.quiet=e.target.checked;save();}});body.append(el('label',{class:'ew-flex'},quiet,' Still mode: pause decorative movement'));
  });}
  async function startAudio(){
    if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();await audio.resume();soundOn=true;restartAudio();
  }
  function stopAudio(){soundOn=false;audioNodes.forEach(n=>{try{n.source.stop();n.lfo?.stop();}catch(_){}});audioNodes=[];}
  function restartAudio(){if(!soundOn)return;stopAudio();soundOn=true;
    ['rain','wind','waves'].forEach((name,i)=>{const length=audio.sampleRate*5,buf=audio.createBuffer(1,length,audio.sampleRate),out=buf.getChannelData(0);let last=0;for(let j=0;j<length;j++){const white=Math.random()*2-1;last=(last+.02*white)/1.02;out[j]=i===0?white*.35:last*4;}
      const source=audio.createBufferSource();source.buffer=buf;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=[1400,550,900][i];const gain=audio.createGain();source.connect(filter);filter.connect(gain);gain.connect(audio.destination);let lfo,depth;
      if(i===2){lfo=audio.createOscillator();depth=audio.createGain();lfo.frequency.value=.09;depth.gain.value=0;lfo.connect(depth);depth.connect(gain.gain);lfo.start();}source.start();audioNodes.push({name,source,gain,lfo,depth});});updateGains();
  }
  function updateGains(){audioNodes.forEach(n=>{const level=data.soundMix[n.name]*data.volume*.4;n.gain.gain.setTargetAtTime(level,audio.currentTime,.1);if(n.depth)n.depth.gain.setTargetAtTime(level*.5,audio.currentTime,.1);});}
  function goRoom(){clearInterval(breakTick);if(screen)screen.remove();screen=null;document.getElementById('room-mount').inert=false;host.querySelectorAll(':scope > .ew-dock,:scope > .ew-door,:scope > .ew-pet,:scope > .ew-world-tag,:scope > .ew-visitor').forEach(n=>n.hidden=false);host.querySelector('.ew-door')?.focus({preventScroll:true});}
  function view(name,subtitle,cls=''){
    closeDialog();if(screen)screen.remove();clearInterval(breakTick);document.getElementById('room-mount').inert=true;
    host.querySelectorAll(':scope > .ew-dock,:scope > .ew-door,:scope > .ew-pet,:scope > .ew-world-tag,:scope > .ew-visitor').forEach(n=>n.hidden=true);
    screen=el('section',{class:'ew-view '+cls,'aria-label':name,tabindex:-1});
    const head=el('header',{class:'ew-view-header'},el('div',{},el('p',{class:'ew-eyebrow'},subtitle),el('h1',{},name)),el('div',{class:'ew-flex'},button('Field journal',discoveryJournal),button('Back to the room',goRoom)));
    screen.append(head);host.append(screen);screen.focus({preventScroll:true});return screen;
  }
  function balcony(){
    const n=view('The moonlit balcony','A little air, a little space');n.prepend(scenery(data.world));n.append(el('div',{class:'ew-railing'}),el('div',{class:'ew-balcony-floor'}),el('div',{class:'ew-balcony-chair'}),el('div',{class:'ew-balcony-table'}));
    const card=el('div',{class:'ew-break-card ew-stack'});const clock=el('div',{class:'ew-break-clock','aria-label':'Break time remaining'});const status=el('p',{class:'ew-help'});function update(){const remaining=Math.max(0,Math.ceil((data.breakEnd-Date.now())/1000));clock.textContent=data.breakEnd?`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`:'Take a breath';status.textContent=data.breakEnd?(remaining?'Your break is yours. Return whenever you’re ready.':'Break complete. The desk is waiting, whenever you are ready.'):'Unclench your jaw. Roll your shoulders. Look away from the screen.';}
    const reflection=textarea('',{placeholder:'Before I go back, I want to…','aria-label':'Break reflection',maxlength:4000});
    card.append(el('p',{class:'ew-eyebrow'},'Between chapters'),clock,status,el('div',{class:'ew-flex'},...[3,5,10].map(m=>button(m+' min',()=>{data.breakEnd=Date.now()+m*60000;save();update();})),button('End break',()=>{data.breakEnd=0;save();update();})),reflection,button('Save reflection',()=>{if(!reflection.value.trim())return;data.reflections.unshift({id:C.id(),text:reflection.value.trim(),at:new Date().toISOString()});reflection.value='';save();showToast('A small thought, safely tucked away.');}),el('div',{class:'ew-flex'},button('Visit the greenhouse',greenhouse),button('Look through the telescope',observatory)));
    n.append(card);makePet(n,PET_CHAIR);update();breakTick=setInterval(update,1000);
    const star=el('button',{type:'button',class:'ew-secret',style:'right:330px;top:260px;','aria-label':'Inspect a glimmer near the moon',onclick:()=>{showToast('Four windows look onto four worlds. Visit them all, and the sea may leave you a gift.');discoveryJournal();}},'✧');n.append(star);
  }
  function plantSVG(level){return svg('svg',{viewBox:'0 0 160 160','aria-hidden':'true'},svg('path',{d:'M53 115L61 153H103L111 115Z',fill:'#a77e68',stroke:'#d1a88b','stroke-width':2}),svg('path',{d:'M49 115H115',stroke:'#d4ae8b','stroke-width':8,'stroke-linecap':'round'}),svg('path',{d:`M82 114Q75 85 82 ${80-level*10}`,fill:'none',stroke:'#8fba98','stroke-width':4}),svg('ellipse',{cx:65,cy:94-level*4,rx:20,ry:9,fill:'#6a9d8a',transform:`rotate(30 65 ${94-level*4})`}),svg('ellipse',{cx:96,cy:85-level*6,rx:20,ry:9,fill:'#9fba97',transform:`rotate(-30 96 ${85-level*6})`}),...(level>=1?[svg('ellipse',{cx:99,cy:104-level*3,rx:13,ry:6,fill:'#7fae8e',transform:`rotate(-20 99 ${104-level*3})`})]:[]),...(level>=2?[svg('ellipse',{cx:66,cy:60,rx:20,ry:9,fill:'#87a998',transform:'rotate(35 66 60)'})]:[]),...(level>=3?[svg('circle',{cx:82,cy:43,r:14,fill:'#c3a9ce'}),svg('circle',{cx:82,cy:43,r:5,fill:'#e5cea1'})]:[]));}
  function greenhouse(){
    if(!data.discoveries.includes('key')){openDialog('A locked glass door','The greenhouse',b=>b.append(help('A little brass key is missing. The field journal whispers: look closely where the forest meets the window.'),button('Go to the window',worldDialog)));return;}
    const n=view('The secret greenhouse','Grow something alongside your learning','ew-greenhouse');n.prepend(scenery('forest'));n.append(el('div',{class:'ew-glass'}),el('div',{class:'ew-ground'}));
    const intro=el('div',{style:'position:absolute;left:90px;right:90px;top:170px;display:flex;justify-content:space-between;align-items:center;gap:30px;'},help('Plants grow with focus blocks completed after this room update. They never wilt while you’re away.'),button('Plant a topic',newPlant));n.append(intro);
    const shelf=el('div',{class:'ew-plant-shelf'});
    if(!data.plants.length)shelf.append(el('div',{class:'ew-note',style:'grid-column:span 2;'},'An empty shelf, full of possibility. Plant a topic such as “Cell division” or “Derivatives.”'));
    data.plants.forEach(p=>{const min=C.minutes(data,p.course),level=Math.min(3,Math.floor(min/50));const pot=el('button',{type:'button',class:'ew-pot',onclick:()=>plantDetail(p)},plantSVG(level),el('strong',{},p.name),el('small',{},Math.round(min)+' focus minutes · '+(C.COURSES[p.course]||'All subjects')));shelf.append(pot);});n.append(shelf);makePet(n,PET_CORNER);
  }
  function newPlant(){openDialog('Plant a topic','A growing collection',b=>{const name=input('',{maxlength:80,placeholder:'e.g. Cellular respiration'});let selected='open';const note=textarea('',{maxlength:1000});b.append(field('Topic',name),field('Count focus time from',courseSelect(selected,k=>selected=k,true)),field('What are you working toward?',note),button('Place on the shelf',()=>{if(!name.value.trim()){name.focus();return;}if(data.plants.length>=24){showToast('All 24 places on the shelf are filled.');return;}data.plants.push({id:C.id(),name:name.value.trim(),course:selected,note:note.value});save();closeDialog();greenhouse();}));});}
  function plantDetail(p){openDialog(p.name,'A learning plant',b=>{const min=C.minutes(data,p.course);const note=textarea(p.note,{maxlength:1000,oninput:e=>{p.note=e.target.value;save();}});b.append(plantSVG(Math.min(3,Math.floor(min/50))),help(`${Math.round(min)} completed focus minutes in ${C.COURSES[p.course]||'all subjects'}. Each 50 minutes adds a growth stage, up to a blossom.`),field('Your topic note',note),button('Study this subject',()=>{closeDialog();goRoom();roomAction('focus',{course:p.course});}));});}
  const discoveryInfo={key:['⚿','The brass key','Found beneath a forest fern. Opens the secret greenhouse.','Something catches the light beyond the forest window.'],moth:['ʚɞ','The lamplight moth','A shy visitor arrived after your first completed focus block.','A warm lamp and a finished focus block may attract a visitor.'],shell:['◔','The moon shell','A keepsake from visiting all four window worlds.','Four windows. Four worlds. One gift from the sea.'],star:['✧','The patient star','Three completed focus blocks left a new star in your journal.','Some stars reveal themselves after three completed focus blocks.']};
  function discoveryJournal(){openDialog('Field journal','Small wonders, quietly collected',b=>{b.append(help(`${data.discoveries.length} of 4 discoveries. Explore at your own pace. Nothing expires.`));Object.entries(discoveryInfo).forEach(([k,[symbol,title,desc,clue]])=>{const found=data.discoveries.includes(k);b.append(el('div',{class:'ew-discovery'+(found?'':' locked')},el('div',{class:'ew-discovery-symbol'},found?symbol:'?'),el('div',{},el('h3',{},found?title:'An unfinished page'),help(found?desc:clue))));});b.append(el('h3',{},'Balcony reflections'));if(!data.reflections.length)b.append(help('Your saved reflections will appear here.'));data.reflections.forEach(x=>b.append(el('article',{class:'ew-journal-entry'},el('time',{},dateText(x.at)),x.text)));});}
  function thoughtDrawer(){openDialog('The loose-thought drawer','Put it here. Come back to it later.',b=>{const thought=textarea('',{maxlength:2000,placeholder:'An idea, a reminder, something to look up…'});const rows=el('div');const render=()=>{rows.replaceChildren();data.thoughts.forEach(x=>{const check=el('input',{type:'checkbox',checked:x.done,'aria-label':'Mark thought reviewed',onchange:e=>{x.done=e.target.checked;save();render();}});rows.append(el('article',{class:'ew-journal-entry'},el('time',{},dateText(x.at)),el('label',{class:'ew-flex',style:x.done?'text-decoration:line-through;opacity:.6':''},check,el('span',{},x.text))));});};b.append(field('Leave a thought',thought),button('Tuck it away',()=>{if(!thought.value.trim())return;data.thoughts.unshift({id:C.id(),text:thought.value.trim(),at:new Date().toISOString(),done:false});thought.value='';save();render();}),help('Saved locally, without interrupting your current timer.'),rows);render();});}
  function courseBooks(tab='notes',editId=null){
    openDialog('The enchanted course books','Six subjects. A place to return.',b=>{
      const notebook=data.notebooks[course];
      b.append(field('Open a course book',courseSelect(course,k=>{course=k;reviewIndex=0;faceUp=false;courseBooks(tab);})),el('div',{class:'ew-flex',role:'group','aria-label':'Course book pages'},...[['Notes & bookmark','notes'],['Review cards','review'],['Add a card','add']].map(([label,key])=>{const b=button(label,()=>courseBooks(key));b.setAttribute('aria-pressed',String(tab===key||(key==='add'&&tab==='edit')));return b;}),button('Study this course',()=>{closeDialog();goRoom();roomAction('focus',{course});})));
      if(tab==='notes'){
        const notes=textarea(notebook.notes,{maxlength:40000,style:'min-height:250px;',placeholder:'Your own notes, examples, questions…',oninput:e=>{notebook.notes=e.target.value;save();}});
        const resume=input(notebook.resume,{maxlength:500,placeholder:'e.g. Page 12: finish the chain-rule examples',oninput:e=>{notebook.resume=e.target.value;save();}});
        const upload=el('input',{type:'file',accept:'.txt,.md,text/plain,text/markdown',onchange:async e=>{const file=e.target.files[0];if(!file)return;if(file.size>500000){showToast('Choose a text file smaller than 500 KB.');return;}try{const text=await file.text();if(notebook.notes.trim()){showToast('This book already has notes. Paste text below to keep your existing work.');return;}notebook.notes=text.slice(0,40000);notes.value=notebook.notes;save();showToast(text.length>40000?'Imported the first 40,000 characters.':'Notes added to your course book.');}catch(_){showToast('The file could not be read. Your notes are unchanged.');}}});
        b.append(field('Bookmark: where did you leave off?',resume),field('Course notes · saves as you type',notes),field('Import plain-text or Markdown notes into an empty book',upload),help('Text notes and cards are stored in this browser and included in Backup. Your existing course links remain on the bookshelf.'));
      }else if(tab==='add'||tab==='edit'){
        const editing=notebook.cards.find(c=>c.id===editId);
        const q=textarea(editing?editing.q:'',{maxlength:1000,placeholder:'What do you want to be able to explain?'}),a=textarea(editing?editing.a:'',{maxlength:3000,placeholder:'Your answer, checked against your course materials.'});
        b.append(field('Question',q),field('Saved answer',a),button(editing?'Save card changes':'Place card in this book',()=>{if(!q.value.trim()||!a.value.trim()){showToast('Add both a question and an answer.');return;}if(editing){editing.q=q.value.trim();editing.a=a.value.trim();}else notebook.cards.push({id:C.id(),q:q.value.trim(),a:a.value.trim()});save();courseBooks('review');}));
      }else{
        if(!notebook.cards.length){b.append(el('div',{class:'ew-note'},'This book has no review cards yet. Add a question and its checked answer to practice with your companion.'),button('Write my first card',()=>courseBooks('add')));return;}
        reviewIndex=(reviewIndex+notebook.cards.length)%notebook.cards.length;const card=notebook.cards[reviewIndex];
        const face=button('',()=>{faceUp=!faceUp;courseBooks('review');});face.className='ew-card';face.dataset.focusKey='review-card';face.setAttribute('aria-label',faceUp?'Saved answer. Click to show question.':'Question. Click to reveal saved answer.');face.textContent=faceUp?card.a:card.q;
        b.append(help(`Card ${reviewIndex+1} of ${notebook.cards.length}. Explain it aloud to ${data.petName}, then reveal your saved answer.`),face,el('div',{class:'ew-flex'},keyed(button(faceUp?'Show question':'Reveal answer',()=>{faceUp=!faceUp;courseBooks('review');}),'review-flip'),button('Edit this card',()=>courseBooks('edit',card.id)),button('Previous',()=>{reviewIndex--;faceUp=false;courseBooks('review');}),button('Next',()=>{reviewIndex++;faceUp=false;courseBooks('review');})),help('These are the answers you saved. The companion does not grade or invent course content.'));
      }
    });
  }
  function boardDialog(){openDialog('The floating chalkboard','Work it out. Leave a little chalk dust.',b=>{
    let drawing=null,labelMode=false;const board=svg('svg',{viewBox:'0 0 1000 600',class:'ew-board',tabindex:0,role:'img','aria-label':'Drawing board. Draw with mouse, pen, or touch; use Add text for a keyboard-accessible alternative.'});
    const status=el('p',{class:'ew-help',role:'status'},'Draw freely. Your board saves after each stroke.');
    function render(){board.replaceChildren();data.board.forEach(x=>board.append(x.type==='label'?svg('text',{x:x.x,y:x.y},x.text):svg('path',{d:x.points.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ')})));}
    const position=e=>{const r=board.getBoundingClientRect();return [Math.max(0,Math.min(1000,(e.clientX-r.left)/r.width*1000)),Math.max(0,Math.min(600,(e.clientY-r.top)/r.height*600))];};
    board.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();board.setPointerCapture(e.pointerId);drawing={id:C.id(),type:'stroke',points:[position(e)]};board.append(svg('path',{d:'M'+drawing.points[0].join(',')}));});
    board.addEventListener('pointermove',e=>{if(!drawing)return;drawing.points.push(position(e));if(drawing.points.length>2000)drawing.points.splice(1,1);board.lastChild.setAttribute('d',drawing.points.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '));});
    function finish(){if(!drawing)return;if(data.board.length>=800){status.textContent='This board is full. Undo some strokes before adding more.';drawing=null;render();return;}if(drawing.points.length===1)drawing.points.push([drawing.points[0][0]+1,drawing.points[0][1]+1]);data.board.push(drawing);drawing=null;save();render();}
    board.addEventListener('pointerup',finish);board.addEventListener('pointercancel',finish);
    const label=input('',{maxlength:200,placeholder:'A formula, label, or thought'});
    const addLabel=()=>{if(!label.value.trim())return;const labels=data.board.filter(x=>x.type==='label').length;data.board.push({id:C.id(),type:'label',text:label.value.trim(),x:40+(Math.floor(labels/12)%3)*310,y:40+(labels%12)*44});label.value='';save();render();};
    label.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addLabel();}});
    b.append(board,status,field('Add a text note to the board',label),el('div',{class:'ew-flex'},button('Add text',addLabel),button('Undo last mark',()=>{data.board.pop();save();render();}),button('Download board as SVG',()=>{const copy=board.cloneNode(true);copy.setAttribute('xmlns',svgNS);copy.querySelectorAll('path').forEach(p=>{p.setAttribute('fill','none');p.setAttribute('stroke','#eee8c9');p.setAttribute('stroke-width','3');});copy.querySelectorAll('text').forEach(p=>{p.setAttribute('fill','#eee8c9');p.setAttribute('font-size','22');});copy.prepend(svg('rect',{width:1000,height:600,fill:'#163e3a'}));const blob=new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml'});const a=el('a',{href:URL.createObjectURL(blob),download:'midnight-chalkboard.svg'});a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);})),help('One shared board for now. Notes are plain text, so typed formulas stay exactly as you wrote them.'));render();
  });}
  function observatory(){
    const n=view('The little observatory','Connect the ideas that belong together','ew-observatory');n.prepend(skyDome());const map=el('div',{class:'ew-sky-map'});const canvas=svg('svg',{viewBox:'0 0 1300 650',width:'100%',height:'100%',role:'img','aria-label':'Your saved concept constellations'});
    const current=data.constellations[data.constellations.length-1];
    if(current){const points=current.concepts.map((x,i)=>{const angle=-Math.PI/2+i*(Math.PI*2/Math.max(3,current.concepts.length));return{x:650+Math.cos(angle)*380,y:325+Math.sin(angle)*205,text:x};});
      points.forEach((p,i)=>{if(i>0){const prev=points[i-1];canvas.append(svg('line',{class:'ew-map-line',x1:prev.x,y1:prev.y,x2:p.x,y2:p.y}));}canvas.append(svg('circle',{class:'ew-map-star',cx:p.x,cy:p.y,r:7}),svg('text',{class:'ew-map-text',x:p.x,y:p.y+30},p.text));});canvas.append(svg('text',{class:'ew-map-text',x:650,y:325,style:'font-size:30px;font-family:"Cormorant Garamond",serif;'},current.title));
    }else canvas.append(svg('text',{class:'ew-map-text',x:650,y:325},'An empty sky. Add a concept constellation to begin.'));
    map.append(canvas);n.append(map,el('div',{style:'position:absolute;left:100px;bottom:35px;display:flex;gap:15px;'},button('Create a constellation',constellationDialog),button('Open saved constellations',constellationLibrary)));makePet(n,PET_CORNER);
  }
  /* A scattered (not tiled) star field for the observatory dome. Fixed seed, so it looks the same every visit. */
  function skyDome(){const n=el('div',{class:'ew-scenery','data-world':'dome','aria-hidden':'true'},el('div',{class:'ew-mist'}));let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;for(let i=0;i<140;i++){const r=rnd()<.12?2.4:rnd()<.5?1.6:1;n.append(el('i',{class:'ew-dome-star',style:`left:${(rnd()*100).toFixed(2)}%;top:${(rnd()*100).toFixed(2)}%;width:${r}px;height:${r}px;animation-delay:-${(rnd()*8).toFixed(1)}s;`}));}return n;}
  function constellationDialog(){openDialog('Draw a constellation','A small map of an idea',b=>{const title=input('',{maxlength:120,placeholder:'e.g. The central dogma'}),concepts=textarea('',{maxlength:1000,placeholder:'DNA\nTranscription\nRNA\nTranslation\nProtein'});b.append(field('Title',title),field('Concepts, in order · one per line · up to 8',concepts),help('Stars connect in the order you enter. Use them for a process, an argument, or the steps of a problem.'),button('Place in the sky',()=>{const names=concepts.value.split('\n').map(s=>s.trim().slice(0,120)).filter(Boolean);if(!title.value.trim()||names.length<2||names.length>8){showToast('Give it a title and between 2 and 8 concepts.');return;}data.constellations.push({id:C.id(),title:title.value.trim(),concepts:names});save();closeDialog();observatory();}));});}
  function constellationLibrary(){openDialog('Your constellations','A sky full of connections',b=>{if(!data.constellations.length)b.append(help('You haven’t placed any constellations yet.'));data.constellations.forEach(x=>b.append(button(x.title,()=>{data.constellations=data.constellations.filter(c=>c.id!==x.id).concat([x]);save();closeDialog();observatory();})));b.append(button('Create a constellation',constellationDialog));});}
  function travelDialog(){openDialog('Where shall we go?','The room has more to it than you think.',b=>{
    b.append(el('div',{class:'ew-grid'},button('The moonlit balcony\nBreaks & reflections',()=>{closeDialog();balcony();}),button('The secret greenhouse\nTopics that grow with you',()=>{closeDialog();greenhouse();}),button('The little observatory\nMap your ideas in stars',()=>{closeDialog();observatory();}),button('Back to the desk\nYour familiar study room',()=>{closeDialog();goRoom();})),help('The balcony and observatory are open. Find a little key to open the greenhouse.'));
  });}
  function guide(){openDialog('A room to make your own','A pocket guide',b=>{
    b.append(el('div',{class:'ew-note'},'Start at the window. Choose your world, then say hello to your companion. The little door leads out to the balcony and observatory. A key is hiding somewhere green.'),el('div',{class:'ew-grid'},button('Meet my companion',petDialog),button('Turn the window',worldDialog),button('Explore the rooms',travelDialog),button('Open a course book',()=>courseBooks()),button('Use the chalkboard',boardDialog),button('Leave a loose thought',thoughtDrawer),button('Read the field journal',discoveryJournal),button('Open the original notebook',()=>{closeDialog();goRoom();roomAction('notebook');})));
    b.append(help('Your room saves in this browser. Use the original Settings → Backup & restore to export both your original room data and these new spaces. Ambient audio is always off when you first open the app.'),help(storageOK?'Local saving is available.':'Local saving is unavailable; export a backup before closing.'));
  });}
  /* The lamplight moth, drawn rather than typed, so it reads clearly at any size. */
  function mothSVG(){return svg('svg',{viewBox:'0 0 48 36',width:44,height:33,'aria-hidden':'true'},svg('g',{class:'ew-moth-wings'},svg('path',{d:'M24 18C16 4 4 3 3 11C2 18 13 20 24 18Z',fill:'#e9dcc0'}),svg('path',{d:'M24 18C32 4 44 3 45 11C46 18 35 20 24 18Z',fill:'#e9dcc0'}),svg('path',{d:'M24 19C17 22 9 29 12 33C16 35 21 27 24 19Z',fill:'#cdbfe0'}),svg('path',{d:'M24 19C31 22 39 29 36 33C32 35 27 27 24 19Z',fill:'#cdbfe0'}),svg('circle',{cx:12,cy:11,r:2.4,fill:'#b99a61'}),svg('circle',{cx:36,cy:11,r:2.4,fill:'#b99a61'})),svg('ellipse',{cx:24,cy:19,rx:2.2,ry:7,fill:'#8c7a9e'}),svg('path',{d:'M23 12Q19 5 15 4M25 12Q29 5 33 4',stroke:'#8c7a9e','stroke-width':1.2,fill:'none'}));}
  function renderVisitors(){
    if(!host)return;
    host.querySelectorAll(':scope > .ew-visitor').forEach(n=>n.remove());
    if(data.discoveries.includes('moth')){const visitor=el('button',{type:'button',class:'ew-visitor','aria-label':'Visit the lamplight moth',onclick:discoveryJournal},mothSVG());visitor.hidden=!!screen;host.append(visitor);}
  }
  function boot(){
    const stage=document.getElementById('stage');if(!stage||host)return;host=el('div',{id:'enchanted-root','data-quiet':String(data.quiet)});document.documentElement.dataset.ewQuiet=String(data.quiet);stage.append(host);
    const slot=document.getElementById('ew-window-slot');const win=slot?null:el('div',{id:'ew-window',class:'ew-window'});const worldLabel=el('button',{id:'ew-world-label',class:'ew-world-tag',type:'button',onclick:worldDialog});
    const door=el('button',{type:'button',class:'ew-door','aria-label':'Open the door to other rooms',onclick:travelDialog},el('span',{},'Beyond'));
    const dock=el('nav',{class:'ew-dock','aria-label':'Room objects'},button('✦ Explore',guide),button('Course books',()=>courseBooks()),button('Chalkboard',boardDialog),button('Thought drawer',thoughtDrawer),button('Field journal',discoveryJournal));
    if(win)host.append(win);host.append(worldLabel,door,dock);makePet(host);renderVisitors();paintWindow(true);labelWorld();
    // The room redraws itself often; if it ever replaces the window slot, paint the world back in.
    const mount=document.getElementById('room-mount');if(mount&&window.MutationObserver)new MutationObserver(()=>{const t=windowTarget();if(t&&!t.firstElementChild)paintWindow(true);}).observe(mount,{childList:true,subtree:true});
    // These events connect to the existing timer and notebook; they do not create a second focus timer.
    window.addEventListener('msr:open-worlds',worldDialog);
    window.addEventListener('msr:focus-state',e=>{host.querySelectorAll('.ew-pet').forEach(p=>p.dataset.rest=String(e.detail.running && e.detail.mode==='focus'));});
    setInterval(()=>{if(!data.quiet&&!screen&&!modal?.open){const p=host.querySelector(':scope > .ew-pet');if(p&&!p.matches('[data-rest=true]'))p.style.left=p.style.left==='985px'?'935px':'985px';}},30000);
    window.addEventListener('msr:focus-complete',e=>{if(C.session(data,{...e.detail,at:new Date().toISOString()})){save();renderVisitors();showToast('A focus block is complete. Your plants grew a little, and something may have visited the lamp.');if(screen?.classList.contains('ew-greenhouse'))greenhouse();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal?.open&&screen)goRoom();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
    if(!data.visited.length){C.visit(data,data.world);save();}
    window.EnchantedRoom={exportData:()=>C.norm(data),importData:incoming=>{data=C.merge(data,incoming);save();applyWorld(data.world);updatePet();},hasUnsaved:()=>dirty};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
