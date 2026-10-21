/* Canvas: palette, drag/drop, SVG symbol library, property inspector, JSON import/export */
(function(){
const $=s=>document.querySelector(s),st=$('#stage');
const S='fill="none" stroke="#2b3338" stroke-width="3"';
// type -> {label, analog, io:[DI,DO,AI,AO], svg(el)}
const T=HMI.types={
 pump:{label:'Pump',io:[2,1,0,0],svg:e=>`<circle cx="40" cy="42" r="24" ${S} fill="${col(e)}"/><path d="M40 18h30v14M28 30l24 12-24 12z" ${S}/>`},
 solenoid:{label:'Solenoid valve',io:[1,1,0,0],svg:e=>`<path d="M14 40l26 16V24zM66 40L40 56V24z" ${S} fill="${col(e)}"/><rect x="30" y="8" width="20" height="16" ${S}/>`},
 control:{label:'Control valve',io:[0,0,1,1],svg:e=>`<path d="M14 50l26 16V34zM66 50L40 66V34z" ${S} fill="${col(e)}"/><path d="M40 34V22" ${S}/><path d="M20 22a20 14 0 0140 0z" ${S}/>`},
 tank:{label:'Tank',analog:1,io:[0,0,1,0],svg:e=>{const p=Math.max(0,Math.min(1,(e.value-e.euMin)/((e.euMax-e.euMin)||1)));return `<rect x="16" y="10" width="48" height="62" rx="6" ${S}/><rect x="18" y="${70-58*p}" width="44" height="${58*p}" fill="#3a7ca5" style="transition:all .8s"/>`}},
 pipe:{label:'Pipe',io:[0,0,0,0],svg:e=>`<rect x="0" y="32" width="80" height="16" fill="#8b9397" stroke="#2b3338" stroke-width="2"/>`},
 motor:{label:'Motor',io:[2,1,0,0],svg:e=>`<circle cx="40" cy="40" r="26" ${S} fill="${col(e)}"/><text x="40" y="49" text-anchor="middle" font-size="26" font-weight="700" fill="#2b3338">M</text>`},
 conveyor:{label:'Conveyor',io:[1,1,0,0],svg:e=>`<rect x="6" y="28" width="68" height="24" rx="12" ${S} fill="${col(e)}"/><circle cx="18" cy="40" r="5" ${S}/><circle cx="62" cy="40" r="5" ${S}/>`},
 button:{label:'Pushbutton',io:[1,0,0,0],svg:e=>`<circle cx="40" cy="40" r="22" ${S}/><circle cx="40" cy="40" r="15" fill="${e.value?'#2e7d32':'#8b9397'}" stroke="#2b3338" stroke-width="2"/>`},
 light:{label:'Indicator light',io:[0,1,0,0],svg:e=>`<circle cx="40" cy="40" r="20" ${S} fill="${col(e)}"/>`},
 digital:{label:'Digital gauge',analog:1,io:[0,0,1,0],svg:e=>`<rect x="6" y="22" width="68" height="36" ${S} fill="#101417"/><text x="40" y="48" text-anchor="middle" font-size="18" font-family="monospace" fill="#9be">${(+e.value).toFixed(1)}</text>`},
 meter:{label:'Analog meter',analog:1,io:[0,0,1,0],svg:e=>{const p=Math.max(0,Math.min(1,(e.value-e.euMin)/((e.euMax-e.euMin)||1))),a=(-150+120*p)*Math.PI/180;return `<path d="M10 56a30 30 0 0160 0z" ${S}/><path d="M40 56L${40+26*Math.cos(a)} ${56+26*Math.sin(a)}" stroke="#c62828" stroke-width="3"/>`}},
 banner:{label:'Alarm banner',io:[0,0,0,0],svg:e=>{const n=document.getElementById('alarmCount').textContent;return `<rect x="2" y="26" width="76" height="28" ${S} fill="${n>0?'#c62828':'#8b9397'}"/><text x="40" y="45" text-anchor="middle" font-size="13" fill="#fff">ALM ${n}</text>`}}};
function col(e){const on=e.value>0;return e.fault?e.faultColor:on?e.runColor:'#8b9397'}
let uid=1;
function mk(type,x,y){const a=T[type].analog;return{id:'e'+Date.now()+uid++,type,x,y,tag:type.toUpperCase().slice(0,5)+'_'+String(100+HMI.els.length+1),addr:'40001',dtype:a?'Float':'Bool',rawMin:0,rawMax:32767,euMin:0,euMax:100,unit:a?'%':'',hh:90,h:80,l:20,ll:10,runColor:'#2e7d32',faultColor:'#c62828',value:a?50:0,fault:false,w:80}}
HMI.mk=mk;
$('#palette').innerHTML=Object.entries(T).map(([k,t])=>`<div class="pal" draggable="true" data-t="${k}"><svg viewBox="0 0 80 80">${t.svg({value:1,euMin:0,euMax:100,runColor:'#2e7d32',faultColor:'#c62828'})}</svg>${t.label}</div>`).join('');
$('#palette').addEventListener('dragstart',e=>{const p=e.target.closest('.pal');if(p)e.dataTransfer.setData('text/plain',p.dataset.t)});
$('#palette').addEventListener('click',e=>{const p=e.target.closest('.pal');if(p)add(p.dataset.t,40+HMI.els.length*12%200,40+HMI.els.length*20%200)});
st.addEventListener('dragover',e=>e.preventDefault());
st.addEventListener('drop',e=>{e.preventDefault();const t=e.dataTransfer.getData('text/plain');if(!T[t])return;const r=st.getBoundingClientRect();add(t,e.clientX-r.left+st.scrollLeft-40,e.clientY-r.top+st.scrollTop-40)});
function add(t,x,y){const e=mk(t,Math.round(x/20)*20,Math.round(y/20)*20);HMI.els.push(e);select(e.id);render();HMI.save();HMI.emit('change')}
function ortho(a,q){return a&&a[0]!==q[0]&&a[1]!==q[1]?[[q[0],a[1]],q]:[q]}
function render(){st.innerHTML='';
 const dr=HMI.draft?HMI.draft.concat(HMI.cursor?ortho(HMI.draft.at(-1),HMI.cursor):[]):null;
 const all=HMI.pipes.concat(dr?[{id:'draft',pts:dr}]:[]),pts=p=>p.pts.map(q=>q.join(',')).join(' ');
 const sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.setAttribute('class','pipes');
 sv.innerHTML=all.map(p=>`<polyline class="pout" points="${pts(p)}"/><polyline class="pipe${p.id===HMI.sel?' sel':''}${p.id==='draft'?' draft':''}" data-pipe="${p.id}" points="${pts(p)}"/>`).join('');st.append(sv);
 HMI.els.forEach(e=>{const w=e.w||80,d=document.createElement('div');d.className='el'+(e.id===HMI.sel?' sel':'');d.dataset.id=e.id;d.style.cssText=`left:${e.x}px;top:${e.y}px;width:${w}px`;
 d.innerHTML=`<svg viewBox="0 0 80 80" style="width:${w}px;height:${w}px">${T[e.type].svg(e)}</svg><span class="lbl">${esc(e.tag)}</span><i class="rz" style="top:${w-6}px"></i>`;st.append(d)})}
HMI.render=render;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let drag=null;const snap=v=>Math.round(v/20)*20;
const pos=e=>{const r=st.getBoundingClientRect();return[snap(e.clientX-r.left+st.scrollLeft),snap(e.clientY-r.top+st.scrollTop)]};
function endDraft(keep){if(keep&&HMI.draft){const p=HMI.draft.filter((q,i,a)=>!i||q[0]!==a[i-1][0]||q[1]!==a[i-1][1]);if(p.length>1){HMI.pipes.push({id:'p'+Date.now(),pts:p});HMI.save();HMI.emit('change')}}HMI.draft=null;HMI.cursor=null;HMI.busy=false;$('#btnPipe').classList.remove('on');st.style.cursor='';render()}
st.addEventListener('pointerdown',e=>{
 if(HMI.draft){HMI.draft.push(...ortho(HMI.draft.at(-1),pos(e)));render();return}
 const rz=e.target.closest('.rz'),d=e.target.closest('.el');
 if(!d){const pp=e.target.closest('[data-pipe]');select(pp?pp.dataset.pipe:null);return}
 const el=HMI.els.find(x=>x.id===d.dataset.id);select(el.id);HMI.busy=true;
 drag=rz?{el,rs:1,x:e.clientX,w:el.w||80}:{el,dx:e.clientX-el.x,dy:e.clientY-el.y};d.setPointerCapture(e.pointerId)});
st.addEventListener('pointermove',e=>{
 if(HMI.draft){HMI.cursor=pos(e);render();return}
 if(!drag)return;const d=st.querySelector(`[data-id="${drag.el.id}"]`);
 if(drag.rs){const w=Math.max(40,Math.min(240,Math.round((drag.w+e.clientX-drag.x)/10)*10)),v=d.querySelector('svg');drag.el.w=w;d.style.width=w+'px';v.style.width=v.style.height=w+'px';d.querySelector('.rz').style.top=(w-6)+'px';return}
 drag.el.x=Math.max(0,Math.round((e.clientX-drag.dx)/10)*10);drag.el.y=Math.max(0,Math.round((e.clientY-drag.dy)/10)*10);d.style.left=drag.el.x+'px';d.style.top=drag.el.y+'px'});
st.addEventListener('pointerup',()=>{if(drag){HMI.save();drag=null}HMI.busy=!!HMI.draft});
st.addEventListener('dblclick',()=>HMI.draft&&endDraft(true));
function delSel(){if(!HMI.sel)return;HMI.els=HMI.els.filter(x=>x.id!==HMI.sel);HMI.pipes=HMI.pipes.filter(x=>x.id!==HMI.sel);select(null);render();HMI.save();HMI.emit('change')}
function apply(s){const j=JSON.parse(s);HMI.els=j.els;HMI.pipes=j.pipes||[];HMI.sel=null;render();props();try{localStorage.setItem('hmi-layout',s)}catch(e){}HMI.emit('change')}
function undo(){if(!HMI.hist.length)return HMI.toast('Nothing to undo');HMI.fut.push(HMI._last);HMI._last=HMI.hist.pop();apply(HMI._last)}
function redo(){if(!HMI.fut.length)return HMI.toast('Nothing to redo');HMI.hist.push(HMI._last);HMI._last=HMI.fut.pop();apply(HMI._last)}
addEventListener('keydown',e=>{
 if(HMI.draft){if(e.key==='Enter')endDraft(true);if(e.key==='Escape')endDraft(false);return}
 if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;const k=e.key.toLowerCase(),m=e.ctrlKey||e.metaKey;
 if(m&&k==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(m&&k==='y'){e.preventDefault();redo()}else if(e.key==='Delete'||e.key==='Backspace')delSel()});
$('#btnUndo').onclick=undo;$('#btnRedo').onclick=redo;
$('#btnPipe').onclick=e=>{if(HMI.draft)return endDraft(true);HMI.draft=[];HMI.busy=true;select(null);e.currentTarget.classList.add('on');st.style.cursor='crosshair';HMI.toast('Click to place points. Double-click or Enter to finish, Esc to cancel.')};
function select(id){HMI.sel=id;st.querySelectorAll('.el').forEach(d=>d.classList.toggle('sel',d.dataset.id===id));st.querySelectorAll('[data-pipe]').forEach(p=>p.classList.toggle('sel',p.dataset.pipe===id));props()}
const F=[['tag','Tag name','text'],['addr','PLC address (Modbus/OPC)','text'],['dtype','Data type','sel'],['unit','Engineering unit','unit'],['rawMin','Raw min','number'],['rawMax','Raw max','number'],['euMin','EU min','number'],['euMax','EU max','number'],['hh','HH','number'],['h','H','number'],['l','L','number'],['ll','LL','number'],['runColor','Running colour','color'],['faultColor','Fault colour','color']];
function props(){const p=$('#props'),e=HMI.els.find(x=>x.id===HMI.sel);if(!e&&HMI.pipes.some(q=>q.id===HMI.sel)){p.innerHTML='<b>Pipe</b><p class="muted">Press Delete to remove it, or Ctrl+Z to undo.</p><button id="pdel">Delete pipe</button>';$('#pdel').onclick=delSel;return}
 if(!e){p.innerHTML='<p class="muted">Drag a symbol onto the canvas, then select it to edit its tag.</p>';return}
 const inp=([k,l,t])=>t==='sel'?`<label>${l}<select data-k="${k}">${['Bool','Int16','Int32','Float'].map(o=>`<option${e[k]===o?' selected':''}>${o}</option>`).join('')}</select></label>`:t==='unit'?`<label>${l}<input data-k="${k}" list="units" value="${esc(e[k])}"><datalist id="units"><option>°C<option>Bar<option>L/s<option>%<option>kW</datalist></label>`:`<label>${l}<input data-k="${k}" type="${t}" value="${esc(e[k])}"></label>`;
 const f=Object.fromEntries(F.map(x=>[x[0],x]));
 p.innerHTML=`<b>${T[e.type].label}</b>${['tag','addr','dtype','unit'].map(k=>inp(f[k])).join('')}<div class="row">${['rawMin','rawMax','euMin','euMax'].map(k=>inp(f[k])).join('')}</div><b style="display:block;margin-top:.6rem">Alarm limits</b><div class="row">${['hh','h','l','ll'].map(k=>inp(f[k])).join('')}</div><div class="row">${['runColor','faultColor'].map(k=>inp(f[k])).join('')}</div><button id="del" style="margin-top:.8rem">Delete symbol</button>`;
 p.querySelectorAll('[data-k]').forEach(i=>i.addEventListener('input',()=>{const k=i.dataset.k;e[k]=i.type==='number'?+i.value:i.value;HMI.save();render();HMI.emit('change')}));
 $('#del').onclick=()=>{HMI.els=HMI.els.filter(x=>x.id!==e.id);select(null);render();HMI.save();HMI.emit('change')}}
$('#btnExport').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app:'hmi-canvas-studio',els:HMI.els,pipes:HMI.pipes},null,2)],{type:'application/json'}));a.download='hmi-layout.json';a.click();HMI.toast('Layout exported')};
$('#btnImport').onclick=()=>$('#fileIn').click();
$('#fileIn').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());HMI.els=j.els;HMI.pipes=j.pipes||[];select(null);render();HMI.save();HMI.emit('change');HMI.toast('Layout imported')}catch(x){HMI.toast('Import failed: not a valid layout file')}e.target.value=''};
$('#btnClear').onclick=()=>{if(confirm('Remove all symbols from the canvas?')){HMI.els=[];HMI.pipes=[];select(null);render();HMI.save();HMI.emit('change')}};
try{const j=JSON.parse(localStorage.getItem('hmi-layout'));HMI.els=Array.isArray(j)?j:(j&&j.els)||[];HMI.pipes=(j&&j.pipes)||[]}catch(e){HMI.els=[];HMI.pipes=[]}
if(!HMI.els.length){const a=mk('tank',80,60);a.tag='TK_101';const b=mk('pump',240,80);b.tag='P_101';b.value=1;const c=mk('meter',400,60);c.tag='PT_101';c.unit='Bar';HMI.els.push(a,b,c)}
render();HMI.save();HMI.emit('change');
})();
