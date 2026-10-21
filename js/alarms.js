/* Live simulation engine, HH/H/L/LL checking, alarm table with ACK/clear/filter/sort */
(function(){
const $=s=>document.querySelector(s);let alarms=[],sortK='time',sortD=-1,seq=1,active={};HMI.act=active;
const analog=e=>HMI.types[e.type].analog,digital=e=>/pump|motor|conveyor|solenoid|control|light|button/.test(e.type);
function level(e){const v=e.value;return v>=e.hh?'HH':v>=e.h?'H':v<=e.ll?'LL':v<=e.l?'L':null}
function tick(){
 HMI.els.forEach(e=>{
  HMI.forced=HMI.forced||{};
  if(e.tag in HMI.forced){e.value=HMI.forced[e.tag];delete HMI.forced[e.tag]}
  else if(analog(e)){const span=e.euMax-e.euMin;e.value=Math.min(e.euMax,Math.max(e.euMin,e.value+(Math.random()-.5)*span*.06))}
  else if(digital(e)){const rot=/pump|motor|conveyor/.test(e.type);if(e.fault){if(--e._ft<=0)e.fault=false}else if(rot&&e.value&&Math.random()<.01){e.fault=true;e._ft=6;e.value=0;HMI.toast('Fault: '+e.tag)}else if(Math.random()<.03)e.value=e.value?0:1}
  HMI.vals[e.tag]=e.value;
  if(!analog(e))return;
  const lv=level(e),k=e.id;
  if(lv&&active[k]!==lv){active[k]=lv;alarms.push({id:seq++,time:Date.now(),tag:e.tag,level:lv,value:e.value.toFixed(1)+' '+e.unit,state:'Unacked'});HMI.toast(`${lv} alarm: ${e.tag}`)}
  else if(!lv)delete active[k];
 });
 if(!HMI.busy)HMI.render();draw();HMI.emit('tick');
}
function draw(){
 const fl=$('#fLevel').value,fs=$('#fState').value;
 const rows=alarms.filter(a=>(!fl||a.level===fl)&&(!fs||a.state===fs)).sort((a,b)=>(a[sortK]>b[sortK]?1:-1)*sortD);
 $('#alarmTable tbody').innerHTML=rows.map(a=>`<tr class="${a.state==='Unacked'?'unack':''}"><td>${new Date(a.time).toLocaleTimeString()}</td><td>${a.tag}</td><td class="lvl-${a.level}">${a.level}</td><td>${a.value}</td><td>${a.state}</td><td>${a.state==='Unacked'?`<button data-ack="${a.id}">ACK</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">No alarms. Values drift randomly; limits are set per symbol on the Canvas tab.</td></tr>';
 $('#alarmCount').textContent=alarms.filter(a=>a.state==='Unacked').length;
}
$('#alarmTable tbody').addEventListener('click',e=>{const id=e.target.dataset.ack;if(!id)return;alarms.find(a=>a.id==id).state='Acked';draw()});
$('#ackAll').onclick=()=>{alarms.forEach(a=>a.state='Acked');draw()};
$('#clrAck').onclick=()=>{alarms=alarms.filter(a=>a.state==='Unacked');draw()};
$('#fLevel').onchange=$('#fState').onchange=draw;
$('#alarmTable thead').addEventListener('click',e=>{const k=e.target.dataset.k;if(!k)return;sortD=k===sortK?-sortD:1;sortK=k;draw()});
setInterval(tick,1000);tick();
})();
