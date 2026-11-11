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
    const shadow=svg('ellipse',{class:'ew-ground-shadow',cx:76,cy:122,rx:46,ry:6,fill:'#05071a',opacity:.38});
    if(look==='ghost')return svg('svg',{viewBox:'0 0 140 130','aria-hidden':'true'},svg('ellipse',{cx:71,cy:124,rx:30,ry:4,fill:'#05071a',opacity:.3}),svg('path',{d:'M30 112V57C30 8 112 8 112 57V112L97 101L83 113L69 101L55 113L42 101Z',fill:'#ddd3e4',stroke:'#a695b9','stroke-width':3}),svg('path',{d:'M44 50C46 28 62 20 76 20',fill:'none',stroke:'#fff',opacity:.55,'stroke-width':5,'stroke-linecap':'round'}),svg('path',{d:'M101 60V104L97 101L90 107',fill:'none',stroke:'#b9abc9','stroke-width':6,opacity:.6,'stroke-linecap':'round'}),svg('g',{class:'ew-eyes'},svg('ellipse',{cx:57,cy:57,rx:4.5,ry:6.5,fill:'#4f496d'}),svg('ellipse',{cx:86,cy:57,rx:4.5,ry:6.5,fill:'#4f496d'}),svg('circle',{cx:58.5,cy:54.5,r:1.5,fill:'#fff'}),svg('circle',{cx:87.5,cy:54.5,r:1.5,fill:'#fff'})),svg('path',{d:'M65 72Q71 80 78 72',fill:'none',stroke:'#7a668a','stroke-width':2,'stroke-linecap':'round'}),svg('circle',{cx:46,cy:70,r:6,fill:'#d99db0',opacity:.5}),svg('circle',{cx:97,cy:70,r:6,fill:'#d99db0',opacity:.5}));
    if(look==='owl')return svg('svg',{viewBox:'0 0 140 130','aria-hidden':'true'},shadow,svg('ellipse',{cx:70,cy:86,rx:42,ry:38,fill:'#80748e'}),svg('ellipse',{cx:70,cy:96,rx:26,ry:24,fill:'#c8bcd3'}),svg('path',{d:'M58 92l6 5 6-5 6 5 6-5M58 104l6 5 6-5 6 5 6-5',fill:'none',stroke:'#9d90ad','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'}),svg('path',{d:'M30 57L28 20L53 34Q70 23 88 34L113 20L109 60Z',fill:'#a99ab8'}),svg('ellipse',{cx:70,cy:59,rx:43,ry:34,fill:'#b9abc8'}),svg('ellipse',{cx:62,cy:38,rx:18,ry:6,fill:'#d4c9df',opacity:.7}),svg('g',{class:'ew-eyes'},svg('circle',{cx:51,cy:56,r:15,fill:'#eadfca'}),svg('circle',{cx:89,cy:56,r:15,fill:'#eadfca'}),svg('circle',{cx:51,cy:56,r:7,fill:'#3c394f'}),svg('circle',{cx:89,cy:56,r:7,fill:'#3c394f'}),svg('circle',{cx:53.5,cy:53.5,r:2,fill:'#fff'}),svg('circle',{cx:91.5,cy:53.5,r:2,fill:'#fff'})),svg('path',{d:'M64 69L70 80L77 69',fill:'#d4b47d'}),svg('path',{d:'M50 120h12M78 120h12',stroke:'#d4b47d','stroke-width':5,'stroke-linecap':'round'}));
    return svg('svg',{viewBox:'0 0 140 130','aria-hidden':'true'},shadow,
      svg('g',{class:'ew-tail'},svg('path',{d:'M43 103C2 105 8 63 25 75C32 83 16 96 46 89',fill:'none',stroke:'#1c2625','stroke-width':15,'stroke-linecap':'round'}),svg('path',{d:'M22 72C30 78 26 86 18 88',fill:'none',stroke:'#3a4645','stroke-width':6,'stroke-linecap':'round',opacity:.8})),
      svg('ellipse',{cx:79,cy:92,rx:38,ry:27,fill:'#212b2a'}),
      svg('ellipse',{cx:80,cy:106,rx:34,ry:11,fill:'#141c1b',opacity:.45}),
      svg('ellipse',{cx:82,cy:96,rx:19,ry:15,fill:'#34403f'}),
      svg('path',{d:'M42 64L39 20L65 34Q79 29 91 34L115 21L112 68Z',fill:'#212b2a',stroke:'#0e1514','stroke-width':2,'stroke-linejoin':'round'}),
      svg('path',{d:'M47 30L50 48L61 39M105 31L103 48L94 39',fill:'#8a5a4a'}),
      svg('ellipse',{cx:78,cy:60,rx:39,ry:29,fill:'#263231'}),
      svg('ellipse',{cx:73,cy:42,rx:20,ry:8,fill:'#34413f',opacity:.75}),
      svg('path',{d:'M72 34v7M78 33v8M84 34v7',stroke:'#161f1e','stroke-width':2.2,'stroke-linecap':'round'}),
      svg('g',{class:'ew-eyes'},svg('ellipse',{cx:61,cy:58,rx:5,ry:6.5,fill:'#e6c07b'}),svg('ellipse',{cx:95,cy:58,rx:5,ry:6.5,fill:'#e6c07b'}),svg('ellipse',{cx:61,cy:58.5,rx:1.6,ry:4.6,fill:'#0e1514'}),svg('ellipse',{cx:95,cy:58.5,rx:1.6,ry:4.6,fill:'#0e1514'}),svg('circle',{cx:62.8,cy:55.6,r:1.8,fill:'#fff'}),svg('circle',{cx:96.8,cy:55.6,r:1.8,fill:'#fff'}),svg('circle',{cx:59.6,cy:60.4,r:.9,fill:'#fff',opacity:.7}),svg('circle',{cx:93.6,cy:60.4,r:.9,fill:'#fff',opacity:.7})),
      svg('circle',{cx:52,cy:69,r:6,fill:'#8a5a4a',opacity:.45}),svg('circle',{cx:104,cy:69,r:6,fill:'#8a5a4a',opacity:.45}),
      svg('path',{d:'M74 67L82 67L78 72Z',fill:'#c98f7a','stroke-linejoin':'round'}),
      svg('path',{d:'M78 72Q70 79 66 72M78 72Q86 79 90 72',fill:'none',stroke:'#7d7466','stroke-width':1.5,'stroke-linecap':'round'}),
      svg('path',{d:'M60 69L36 66M60 72L37 75M96 69L120 66M96 72L119 75',stroke:'#f4eef8','stroke-width':1,opacity:.55,'stroke-linecap':'round'}),
      svg('path',{d:'M55 100L64 113M92 100L100 113',stroke:'#1c2625','stroke-width':10,'stroke-linecap':'round'}),
      svg('ellipse',{cx:65,cy:114,rx:6,ry:3.5,fill:'#34413f'}),svg('ellipse',{cx:101,cy:114,rx:6,ry:3.5,fill:'#34413f'}));
  }
  function rng(seed){let s=seed;return()=>(s=(s*16807)%2147483647)/2147483647;}
  let gradN=0;
  function vgrad(stops){const id='ewg'+(++gradN);return [svg('linearGradient',{id,x1:0,y1:0,x2:0,y2:1},...stops.map(([o,c,a])=>svg('stop',{offset:o,'stop-color':c,'stop-opacity':a??1}))),`url(#${id})`];}
  function pine(x,y,h,w){return `M${x} ${y-h}L${x+w*.33} ${y-h*.62}H${x+w*.16}L${x+w*.43} ${y-h*.3}H${x+w*.23}L${x+w*.5} ${y}H${x-w*.5}L${x-w*.23} ${y-h*.3}H${x-w*.43}L${x-w*.16} ${y-h*.62}H${x-w*.33}Z`;}
  function landscape(world,W=360){
    const g=svg('svg',{class:'ew-land',viewBox:`0 0 ${W} 320`,preserveAspectRatio:'xMidYMax slice'}),defs=svg('defs',{});g.append(defs);const k=W/360,S=(...n)=>svg('g',{transform:`scale(${k} 1)`},...n);
    const r=rng({forest:11,sea:23,city:37,snow:51}[world]||5),P=(d,fill,a={})=>svg('path',{d,fill,...a});
    const add=(...k)=>g.append(...k),grad=s=>{const [n,u]=vgrad(s);defs.append(n);return u;};
    if(world==='sea'){
      add(S(P('M-10 216Q30 200 70 206T150 204L160 216Z','#2a3c5a'),P('M200 216Q240 186 292 186Q330 188 372 204V216Z','#1b2b46')));const L=W-47,M=W*.715;
      add(svg('rect',{x:L-5,y:160,width:10,height:30,fill:'#d9d2c4'}),svg('rect',{x:L-5,y:168,width:10,height:4,fill:'#a14f5b'}),svg('rect',{x:L-5,y:178,width:10,height:4,fill:'#a14f5b'}),P(`M${L-8} 160h16l-3-7h-10Z`,'#3b3550'));
      add(svg('g',{class:'ew-beacon'},P(`M${L} 156L${W+20} 140V172Z`,'#f3e2b0',{opacity:.18}),svg('circle',{cx:L,cy:156,r:9,fill:'#f6e3ad',opacity:.25}),svg('circle',{cx:L,cy:156,r:3,fill:'#fff3cf'})));
      add(svg('rect',{x:-10,y:215,width:W+20,height:110,fill:grad([[0,'#3d5878'],[.45,'#1f3552'],[1,'#0c1a2e']])}));
      const shim=svg('g',{class:'ew-shimmer'});for(let i=0;i<11;i++){const y=220+i*9,w=34-i*1.8+r()*10;shim.append(svg('rect',{x:M-w/2+(r()-.5)*8,y,width:w,height:2.2,rx:1.1,fill:'#f2dfae',opacity:(.6-i*.04).toFixed(2)}));}add(shim);
      const waves=svg('g',{class:'ew-waves',stroke:'#a9c0d6',opacity:.22,fill:'none','stroke-width':1});for(let i=0;i<9;i++){const y=228+i*10,x=r()*(W-60)-20;waves.append(svg('path',{d:`M${x} ${y}q12 -3 24 0t24 0`}));}add(waves);
    }else if(world==='city'){
      add(svg('rect',{x:-10,y:120,width:W+20,height:200,fill:grad([[0,'#5d5474',0],[1,'#b6869a',.18]])}));
      let x=-12;while(x<W+10){const w=22+r()*26,h=70+r()*90;add(svg('rect',{x,y:300-h,width:w,height:h+20,fill:'#2f3654'}));if(r()<.25)add(svg('rect',{x:x+w/2-1,y:300-h-14,width:2,height:14,fill:'#2f3654'}));x+=w+2;}
      x=-8;let n=0;while(x<W+10){const w=30+r()*34,h=55+r()*110,top=320-h;add(svg('rect',{x,y:top,width:w,height:h,fill:'#151a2d'}),svg('rect',{x,y:top,width:w,height:3,fill:'#3a4060'}));
        if(n===2){add(P(`M${x+w*.3} ${top}v-10h${w*.4}v10`,'none',{stroke:'#151a2d','stroke-width':3}),P(`M${x+w*.22} ${top-10}h${w*.56}l-${w*.08} -16h-${w*.4}Z`,'#151a2d'));}
        for(let wy=top+10;wy<316;wy+=12)for(let wx=x+5;wx<x+w-7;wx+=10)if(r()<.3)add(svg('rect',{class:r()<.08?'ew-flicker':'',x:wx,y:wy,width:5,height:6,fill:r()<.8?'#f0c97c':'#cfe1f2',opacity:(.45+r()*.5).toFixed(2)}));x+=w+3;n++;}
      add(svg('rect',{x:-10,y:288,width:W+20,height:32,fill:grad([[0,'#f0c97c',0],[1,'#f0c97c',.22]])}));
    }else{
      const snow=world==='snow';
      if(snow){add(S(P('M-10 200L40 150L80 178L130 128L190 186L240 140L300 176L370 132V230H-10Z','#8e93ae'),P('M130 128L148 146L136 144L126 152L118 140ZM240 140L256 156L244 152L232 158L228 150Z','#dfe3ee')));}
      else add(S(P('M-10 190Q40 150 90 168T190 150T290 166T370 150V240H-10Z','#3a5d5a')));
      const far=snow?'#61798a':'#2f524c',mid=snow?'#3f5a68':'#15302f',near=snow?'#2b4352':'#071315';
      for(let i=0;i<Math.ceil(16*k);i++){const x=i*24+r()*10-6,y=snow?212:196+r()*8;add(P(pine(x,y,26+r()*22,16+r()*6),far));}
      add(S(P(snow?'M-10 236Q60 206 140 222T290 214T370 222V330H-10Z':'M-10 240Q70 210 160 226T370 218V330H-10Z',snow?'#c3cada':'#14292c')));
      for(let i=0;i<Math.ceil(8*k);i++){const x=i*50+r()*20-10,h=60+r()*50,y=snow?250:252;add(P(pine(x,y,h,h*.55),mid));add(P(`M${x} ${y-h}l${h*.1} ${h*.13}h-${h*.2}Z`,snow?'#eef2f7':'#6f9a86',snow?{}:{opacity:.45}));}
      if(snow){
        add(S(P('M-10 270Q90 246 200 262T370 258V330H-10Z','#e3e8f0')));
        const cx=Math.round(W>360?W*.58:W*.33),cy=270;add(svg('circle',{cx:cx+26,cy:cy-22,r:40,fill:'#f2c46f',opacity:.12}),svg('rect',{x:cx+44,y:cy-62,width:9,height:22,fill:'#4a3e4c'}),svg('rect',{x:cx,y:cy-40,width:56,height:36,fill:'#4e4252'}),P(`M${cx-8} ${cy-38}L${cx+28} ${cy-66}L${cx+64} ${cy-38}Z`,'#2e2b3c'),P(`M${cx-10} ${cy-37}L${cx+28} ${cy-68}L${cx+66} ${cy-37}L${cx+60} ${cy-35}L${cx+28} ${cy-60}L${cx-4} ${cy-35}Z`,'#f1f4f8'),svg('rect',{x:cx+18,y:cy-30,width:18,height:16,rx:2,fill:'#f4c66f'}),P(`M${cx+27} ${cy-30}v16M${cx+18} ${cy-22}h18`,'none',{stroke:'#8a6b49','stroke-width':1.5}),svg('rect',{x:cx-4,y:cy-5,width:64,height:6,rx:3,fill:'#f1f4f8'}));
        const smoke=svg('g',{class:'ew-smoke',fill:'#dfe3ee'});[0,1,2].forEach(i=>smoke.append(svg('circle',{cx:cx+48,cy:cy-68,r:4+i,style:`animation-delay:-${i*2}s`})));add(smoke);
      }
      for(let i=0;i<3;i++){const x=[8,W-20,W-60][i],h=[200,230,150][i];add(P(pine(x,330,h,h*.5),near));if(snow)add(P(`M${x} ${330-h}l${h*.09} ${h*.12}h-${h*.18}Z`,'#e8edf3'));}
    }
    return g;
  }
  function scenery(world,W){
    const n=el('div',{class:'ew-scenery','data-world':world,'aria-hidden':'true'},el('div',{class:'ew-stars'}),el('div',{class:'ew-moon'}),landscape(world,W),el('div',{class:'ew-mist'}));
    if(world==='city')n.append(el('div',{class:'ew-rain'}),el('div',{class:'ew-rain ew-rain-far'}));
    else if(world!=='sea')for(let i=0;i<30;i++)n.append(el('i',{class:'ew-particle',style:`left:${i*37%100}%;top:${i*29%100}%;animation-delay:-${i*.73}s;animation-duration:${world==='city'?1.3+(i%5)/8:6+i%9}s;`}));
    return n;
  }
  function previewScenery(w){const n=scenery(w,560);n.querySelector('.ew-land').setAttribute('preserveAspectRatio','xMidYMid slice');return n;}
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
    const titleId='ew-title';modal=el('dialog',{class:'ew-dialog'+(reopening?' ew-again':''),'aria-labelledby':titleId});
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
    body.append(el('div',{class:'ew-flex'},button('Pet gently',()=>{showToast(data.petName+(data.petLook==='cat'?' closes their eyes and purrs.':' leans into your hand.'));document.querySelectorAll('.ew-pet').forEach(p=>{p.dataset.pet='true';setTimeout(()=>p.dataset.pet='false',650);});}),button('Study with me',()=>{closeDialog();goRoom();roomAction('focus');},'ew-primary'),button('Let me explain',()=>{closeDialog();courseBooks('review');}),button('Walk to the balcony',()=>{closeDialog();balcony();})));
    const name=input(data.petName,{maxlength:24,oninput:e=>{data.petName=e.target.value.trim()||'Moth';save();updatePet();}});
    body.append(field('Companion name',name),el('div',{class:'ew-flex',role:'group','aria-label':'Companion appearance'},...['cat','owl','ghost'].map(look=>{const b=button(look[0].toUpperCase()+look.slice(1),()=>{data.petLook=look;save();updatePet();petDialog();});b.setAttribute('aria-pressed',String(data.petLook===look));return b;})),help('You can change your companion’s appearance whenever you like.'));
  });}
  function worldDialog(){openDialog('Beyond the window','Four places, one little room',body=>{
    const worlds=el('div',{class:'ew-grid'});const descriptions={forest:'Fireflies, deep greens, soft wind.',sea:'A silver path on the water. Slow waves.',city:'Warm distant windows. Rain on the glass.',snow:'A quiet village tucked under fresh snow.'};
    Object.keys(C.WORLDS).forEach(w=>{const b=el('button',{type:'button',class:'ew-world-card','aria-pressed':String(data.world===w),onclick:()=>{applyWorld(w);worldDialog();}},el('div',{class:'ew-world-preview'},previewScenery(w)),el('strong',{},C.WORLDS[w]),el('span',{class:'ew-help'},descriptions[w]));worlds.append(b);});body.append(worlds);
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
    const n=view('The moonlit balcony','A little air, a little space');n.prepend(scenery(data.world,512));n.append(stringLights(),el('div',{class:'ew-railing'}),el('div',{class:'ew-balcony-floor'}),el('div',{class:'ew-balcony-chair'}),el('div',{class:'ew-balcony-table'}));
    const card=el('div',{class:'ew-break-card ew-stack'});const clock=el('div',{class:'ew-break-clock','aria-label':'Break time remaining'});const status=el('p',{class:'ew-help'});function update(){const remaining=Math.max(0,Math.ceil((data.breakEnd-Date.now())/1000));clock.textContent=data.breakEnd?`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`:'Take a breath';status.textContent=data.breakEnd?(remaining?'Your break is yours. Return whenever you’re ready.':'Break complete. The desk is waiting, whenever you are ready.'):'Unclench your jaw. Roll your shoulders. Look away from the screen.';}
    const reflection=textarea('',{placeholder:'Before I go back, I want to…','aria-label':'Break reflection',maxlength:4000});
    card.append(el('p',{class:'ew-eyebrow'},'Between chapters'),clock,status,el('div',{class:'ew-flex'},...[3,5,10].map(m=>button(m+' min',()=>{data.breakEnd=Date.now()+m*60000;save();update();})),button('End break',()=>{data.breakEnd=0;save();update();})),reflection,button('Save reflection',()=>{if(!reflection.value.trim())return;data.reflections.unshift({id:C.id(),text:reflection.value.trim(),at:new Date().toISOString()});reflection.value='';save();showToast('A small thought, safely tucked away.');},'ew-primary'),el('div',{class:'ew-flex'},button('Visit the greenhouse',greenhouse),button('Look through the telescope',observatory)));
    n.append(card);makePet(n,PET_CHAIR);update();breakTick=setInterval(update,1000);
    const star=el('button',{type:'button',class:'ew-secret',style:'right:330px;top:260px;','aria-label':'Inspect a glimmer near the moon',onclick:()=>{showToast('Four windows look onto four worlds. Visit them all, and the sea may leave you a gift.');discoveryJournal();}},'✧');n.append(star);
  }
  function leaf(cx,cy,len,rot,fill){return svg('g',{transform:`translate(${cx} ${cy}) rotate(${rot})`},svg('path',{d:`M0 0Q${len*.45} ${-len*.32} ${len} 0Q${len*.45} ${len*.32} 0 0Z`,fill}),svg('path',{d:`M2 0Q${len*.5} -1 ${len*.9} 0`,fill:'none',stroke:'#e9f2df',opacity:.35,'stroke-width':1.2}));}
  function stringLights(){const s=svg('svg',{class:'ew-string-lights',viewBox:'0 0 1600 200',preserveAspectRatio:'none','aria-hidden':'true'});[[0,800],[800,1600]].forEach(([a,b])=>{const m=(a+b)/2;s.append(svg('path',{d:`M${a} 40Q${m} 170 ${b} 40`,fill:'none',stroke:'#2a2236','stroke-width':2}));for(let i=1;i<12;i++){const t=i/12,x=(1-t)*(1-t)*a+2*(1-t)*t*m+t*t*b,y=(1-t)*(1-t)*40+2*(1-t)*t*170+t*t*40;s.append(svg('g',{class:'ew-bulb'+(i%2?'':' ew-bulb-b')},svg('circle',{cx:x,cy:y+7,r:15,fill:'#ffd98f',opacity:.12}),svg('circle',{cx:x,cy:y+7,r:4.5,fill:'#ffe2a6'}),svg('rect',{x:x-2.5,y:y-1,width:5,height:4,fill:'#4a3e52'})));}});return s;}
  function plantSVG(level){
    const top=80-level*10,kids=[svg('ellipse',{cx:82,cy:155,rx:34,ry:4,fill:'#000',opacity:.25}),svg('path',{d:'M53 115L61 153H103L111 115Z',fill:'#a77e68'}),svg('path',{d:'M93 115H111L103 153H91Z',fill:'#7e5a49',opacity:.55}),svg('path',{d:'M60 120L66 148',stroke:'#d8b399','stroke-width':2.5,opacity:.5,'stroke-linecap':'round'}),svg('ellipse',{cx:82,cy:115,rx:30,ry:4,fill:'#4a3328'}),svg('path',{d:'M49 115H115',stroke:'#d4ae8b','stroke-width':8,'stroke-linecap':'round'}),svg('path',{d:'M51 119H113',stroke:'#7e5a49','stroke-width':2,opacity:.6}),
      svg('path',{d:`M82 114Q75 85 82 ${top}`,fill:'none',stroke:'#8fba98','stroke-width':4,'stroke-linecap':'round'}),
      leaf(80,98-level*4,28,-150,'#5f9381'),leaf(83,90-level*6,28,-30,'#9fba97')];
    if(level>=1)kids.push(leaf(81,108-level*3,20,-10,'#7fae8e'));
    if(level>=2)kids.push(leaf(80,72-level*2,26,-160,'#87a998'),leaf(82,66,18,-40,'#a9c79f'));
    if(level>=3){const fl=svg('g',{class:'ew-bloom',transform:`translate(82 ${top-6})`});for(let i=0;i<6;i++)fl.append(svg('ellipse',{cx:0,cy:-9,rx:6,ry:10,fill:i%2?'#c3a9ce':'#d3bddc',transform:`rotate(${i*60})`}));fl.append(svg('circle',{r:5.5,fill:'#e5cea1'}),svg('circle',{r:2,cx:-1.5,cy:-1.5,fill:'#fff3d6'}));kids.push(fl);}
    return svg('svg',{viewBox:'0 0 160 160','aria-hidden':'true'},...kids);
  }
  function greenhouse(){
    if(!data.discoveries.includes('key')){openDialog('A locked glass door','The greenhouse',b=>b.append(help('A little brass key is missing. The field journal whispers: look closely where the forest meets the window.'),button('Go to the window',worldDialog)));return;}
    const n=view('The secret greenhouse','Grow something alongside your learning','ew-greenhouse');n.prepend(scenery('forest',512));n.append(el('div',{class:'ew-glass'}),el('div',{class:'ew-ground'}));
    const intro=el('div',{style:'position:absolute;left:90px;right:90px;top:170px;display:flex;justify-content:space-between;align-items:center;gap:30px;'},help('Plants grow with focus blocks completed after this room update. They never wilt while you’re away.'),button('Plant a topic',newPlant,'ew-primary'));n.append(intro);
    const shelf=el('div',{class:'ew-plant-shelf'});
    if(!data.plants.length)shelf.append(el('div',{class:'ew-note',style:'grid-column:span 2;'},'An empty shelf, full of possibility. Plant a topic such as “Cell division” or “Derivatives.”'));
    data.plants.forEach(p=>{const min=C.minutes(data,p.course),level=Math.min(3,Math.floor(min/50));const pot=el('button',{type:'button',class:'ew-pot',onclick:()=>plantDetail(p)},plantSVG(level),el('strong',{},p.name),el('small',{},Math.round(min)+' focus minutes · '+(C.COURSES[p.course]||'All subjects')));shelf.append(pot);});n.append(shelf);makePet(n,PET_CORNER);
  }
  function newPlant(){openDialog('Plant a topic','A growing collection',b=>{const name=input('',{maxlength:80,placeholder:'e.g. Cellular respiration'});let selected='open';const note=textarea('',{maxlength:1000});b.append(field('Topic',name),field('Count focus time from',courseSelect(selected,k=>selected=k,true)),field('What are you working toward?',note),button('Place on the shelf',()=>{if(!name.value.trim()){name.focus();return;}if(data.plants.length>=24){showToast('All 24 places on the shelf are filled.');return;}data.plants.push({id:C.id(),name:name.value.trim(),course:selected,note:note.value});save();closeDialog();greenhouse();},'ew-primary'));});}
  function plantDetail(p){openDialog(p.name,'A learning plant',b=>{const min=C.minutes(data,p.course);const note=textarea(p.note,{maxlength:1000,oninput:e=>{p.note=e.target.value;save();}});b.append(plantSVG(Math.min(3,Math.floor(min/50))),help(`${Math.round(min)} completed focus minutes in ${C.COURSES[p.course]||'all subjects'}. Each 50 minutes adds a growth stage, up to a blossom.`),field('Your topic note',note),button('Study this subject',()=>{closeDialog();goRoom();roomAction('focus',{course:p.course});}));});}
  const discoveryInfo={key:['⚿','The brass key','Found beneath a forest fern. Opens the secret greenhouse.','Something catches the light beyond the forest window.'],moth:['ʚɞ','The lamplight moth','A shy visitor arrived after your first completed focus block.','A warm lamp and a finished focus block may attract a visitor.'],shell:['◔','The moon shell','A keepsake from visiting all four window worlds.','Four windows. Four worlds. One gift from the sea.'],star:['✧','The patient star','Three completed focus blocks left a new star in your journal.','Some stars reveal themselves after three completed focus blocks.']};
  function discoveryJournal(){openDialog('Field journal','Small wonders, quietly collected',b=>{b.append(help(`${data.discoveries.length} of 4 discoveries. Explore at your own pace. Nothing expires.`));Object.entries(discoveryInfo).forEach(([k,[symbol,title,desc,clue]])=>{const found=data.discoveries.includes(k);b.append(el('div',{class:'ew-discovery'+(found?'':' locked')},el('div',{class:'ew-discovery-symbol'},found?symbol:'?'),el('div',{},el('h3',{},found?title:'An unfinished page'),help(found?desc:clue))));});b.append(el('h3',{},'Balcony reflections'));if(!data.reflections.length)b.append(help('Your saved reflections will appear here.'));data.reflections.forEach(x=>b.append(el('article',{class:'ew-journal-entry'},el('time',{},dateText(x.at)),x.text)));});}
  function thoughtDrawer(){openDialog('The loose-thought drawer','Put it here. Come back to it later.',b=>{const thought=textarea('',{maxlength:2000,placeholder:'An idea, a reminder, something to look up…'});const rows=el('div');const render=()=>{rows.replaceChildren();data.thoughts.forEach(x=>{const check=el('input',{type:'checkbox',checked:x.done,'aria-label':'Mark thought reviewed',onchange:e=>{x.done=e.target.checked;save();render();}});rows.append(el('article',{class:'ew-journal-entry'},el('time',{},dateText(x.at)),el('label',{class:'ew-flex',style:x.done?'text-decoration:line-through;opacity:.6':''},check,el('span',{},x.text))));});};b.append(field('Leave a thought',thought),button('Tuck it away',()=>{if(!thought.value.trim())return;data.thoughts.unshift({id:C.id(),text:thought.value.trim(),at:new Date().toISOString(),done:false});thought.value='';save();render();},'ew-primary'),help('Saved locally, without interrupting your current timer.'),rows);render();});}
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
    const grid=svg('g',{class:'ew-graticule','aria-hidden':'true'});[1,.75,.5,.25].forEach(k=>grid.append(svg('ellipse',{cx:650,cy:325,rx:640*k,ry:320*k})));for(let a=0;a<6;a++)grid.append(svg('line',{x1:650+Math.cos(a*Math.PI/6)*640,y1:325+Math.sin(a*Math.PI/6)*320,x2:650-Math.cos(a*Math.PI/6)*640,y2:325-Math.sin(a*Math.PI/6)*320}));canvas.append(grid);
    if(current){const points=current.concepts.map((x,i)=>{const angle=-Math.PI/2+i*(Math.PI*2/Math.max(3,current.concepts.length));return{x:650+Math.cos(angle)*380,y:325+Math.sin(angle)*205,text:x};});
      points.forEach((p,i)=>{if(i>0){const prev=points[i-1];canvas.append(svg('line',{class:'ew-map-line',pathLength:1,style:`animation-delay:${i*.18}s`,x1:prev.x,y1:prev.y,x2:p.x,y2:p.y}));}canvas.append(svg('circle',{class:'ew-map-halo',cx:p.x,cy:p.y,r:22}),svg('circle',{class:'ew-map-halo',cx:p.x,cy:p.y,r:12}),svg('circle',{class:'ew-map-star',cx:p.x,cy:p.y,r:6}),svg('text',{class:'ew-map-text',x:p.x,y:p.y+30},p.text));});canvas.append(svg('text',{class:'ew-map-text',x:650,y:325,style:'font-size:30px;font-family:"Fraunces",serif;'},current.title));
    }else canvas.append(svg('text',{class:'ew-map-text',x:650,y:325},'An empty sky. Add a concept constellation to begin.'));
    map.append(canvas);n.append(map,el('div',{style:'position:absolute;left:100px;bottom:35px;display:flex;gap:15px;'},button('Create a constellation',constellationDialog),button('Open saved constellations',constellationLibrary)));makePet(n,PET_CORNER);
  }
  /* A scattered (not tiled) star field for the observatory dome. Fixed seed, so it looks the same every visit. */
  function skyDome(){const n=el('div',{class:'ew-scenery','data-world':'dome','aria-hidden':'true'},el('div',{class:'ew-mist'}));const layers=[0,1,2].map(i=>el('div',{class:'ew-dome-layer',style:`animation-delay:-${i*2.7}s`}));n.append(...layers);const rnd=rng(7);for(let i=0;i<140;i++){const r=rnd()<.12?2.4:rnd()<.5?1.6:1;layers[i%3].append(el('i',{class:'ew-dome-star',style:`left:${(rnd()*100).toFixed(2)}%;top:${(rnd()*100).toFixed(2)}%;width:${r}px;height:${r}px;`}));}return n;}
  function constellationDialog(){openDialog('Draw a constellation','A small map of an idea',b=>{const title=input('',{maxlength:120,placeholder:'e.g. The central dogma'}),concepts=textarea('',{maxlength:1000,placeholder:'DNA\nTranscription\nRNA\nTranslation\nProtein'});b.append(field('Title',title),field('Concepts, in order · one per line · up to 8',concepts),help('Stars connect in the order you enter. Use them for a process, an argument, or the steps of a problem.'),button('Place in the sky',()=>{const names=concepts.value.split('\n').map(s=>s.trim().slice(0,120)).filter(Boolean);if(!title.value.trim()||names.length<2||names.length>8){showToast('Give it a title and between 2 and 8 concepts.');return;}data.constellations.push({id:C.id(),title:title.value.trim(),concepts:names});save();closeDialog();observatory();},'ew-primary'));});}
  function constellationLibrary(){openDialog('Your constellations','A sky full of connections',b=>{if(!data.constellations.length)b.append(help('You haven’t placed any constellations yet.'));data.constellations.forEach(x=>b.append(button(x.title,()=>{data.constellations=data.constellations.filter(c=>c.id!==x.id).concat([x]);save();closeDialog();observatory();})));b.append(button('Create a constellation',constellationDialog));});}
  function travelDialog(){openDialog('Where shall we go?','The room has more to it than you think.',b=>{
    b.append(el('div',{class:'ew-grid'},button('The moonlit balcony\nBreaks & reflections',()=>{closeDialog();balcony();}),button('The secret greenhouse\nTopics that grow with you',()=>{closeDialog();greenhouse();}),button('The little observatory\nMap your ideas in stars',()=>{closeDialog();observatory();}),button('Back to the desk\nYour familiar study room',()=>{closeDialog();goRoom();})),help('The balcony and observatory are open. Find a little key to open the greenhouse.'));
  });}
  function guide(){openDialog('A room to make your own','A pocket guide',b=>{
    b.append(el('div',{class:'ew-note'},'Start at the window. Choose your world, then say hello to your companion. The little door leads out to the balcony and observatory. A key is hiding somewhere green.'),el('div',{class:'ew-grid'},button('Meet my companion',petDialog),button('Turn the window',worldDialog),button('Explore the rooms',travelDialog),button('Open a course book',()=>courseBooks()),button('Use the chalkboard',boardDialog),button('Leave a loose thought',thoughtDrawer),button('Read the field journal',discoveryJournal),button('Open the original notebook',()=>{closeDialog();goRoom();roomAction('notebook');})));
    b.append(help('Your room saves in this browser. Use the original Settings → Backup & restore to export both your original room data and these new spaces. Ambient audio is always off when you first open the app.'),help(storageOK?'Local saving is available.':'Local saving is unavailable; export a backup before closing.'));
  });}
  /* The lamplight moth, drawn rather than typed, so it reads clearly at any size. */
  function mothSVG(){return svg('svg',{viewBox:'0 0 48 36',width:44,height:33,'aria-hidden':'true'},svg('circle',{cx:24,cy:18,r:24,fill:'#f3dfa8',opacity:.04}),svg('circle',{cx:24,cy:18,r:17,fill:'#f3dfa8',opacity:.06}),svg('circle',{cx:24,cy:18,r:11,fill:'#f3dfa8',opacity:.08}),svg('g',{class:'ew-moth-wings'},svg('path',{d:'M24 18C16 4 4 3 3 11C2 18 13 20 24 18Z',fill:'#e9dcc0'}),svg('path',{d:'M24 18C32 4 44 3 45 11C46 18 35 20 24 18Z',fill:'#e9dcc0'}),svg('path',{d:'M24 19C17 22 9 29 12 33C16 35 21 27 24 19Z',fill:'#cdbfe0'}),svg('path',{d:'M24 19C31 22 39 29 36 33C32 35 27 27 24 19Z',fill:'#cdbfe0'}),svg('circle',{cx:12,cy:11,r:2.4,fill:'#b99a61'}),svg('circle',{cx:36,cy:11,r:2.4,fill:'#b99a61'})),svg('ellipse',{cx:24,cy:19,rx:2.2,ry:7,fill:'#8c7a9e'}),svg('path',{d:'M23 12Q19 5 15 4M25 12Q29 5 33 4',stroke:'#8c7a9e','stroke-width':1.2,fill:'none'}));}
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
    setInterval(()=>{if(!data.quiet&&!screen&&!modal?.open){const p=host.querySelector(':scope > .ew-pet');if(p&&!p.matches('[data-rest=true]'))p.dataset.wander=String(p.dataset.wander!=='true');}},30000);
    window.addEventListener('msr:focus-complete',e=>{if(C.session(data,{...e.detail,at:new Date().toISOString()})){save();renderVisitors();showToast('A focus block is complete. Your plants grew a little, and something may have visited the lamp.');if(screen?.classList.contains('ew-greenhouse'))greenhouse();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal?.open&&screen)goRoom();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
    if(!data.visited.length){C.visit(data,data.world);save();}
    window.EnchantedRoom={exportData:()=>C.norm(data),importData:incoming=>{data=C.merge(data,incoming);save();applyWorld(data.world);updatePet();},hasUnsaved:()=>dirty};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
