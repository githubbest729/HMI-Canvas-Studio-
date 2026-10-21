/* AGAC-style BOM: rules per project type, grouped by line category, editable unit prices.
   All prices are indicative AED placeholders. Replace them with vendor quotes (edits are saved on this device). */
(function(){
const $=s=>document.querySelector(s),K=['DI','DO','AI','AO'],SIL=2.6;
const M={DI:['Digital input module, 16 ch (24 VDC)',1450,16],DO:['Digital output module, 16 ch (relay)',1700,16],AI:['Analog input module, 8 ch (4-20 mA)',2900,8],AO:['Analog output module, 4 ch (4-20 mA)',2600,4]};
const PT={
 dc:{gw:'Modbus / BACnet communication gateway',btu:1,panel:['Control panel enclosure (IP54), wiring and terminals',4200],note:'Adds BTU metering and Modbus/BACnet gateways.'},
 ww:{ip68:1,ex:1,panel:['Control panel enclosure (IP66), wiring and terminals',4800],note:'Adds IP68 instruments and Ex-d junction boxes.'},
 og:{red:1,sil:1,ex:1,net:1,panel:['Control panel enclosure (IP66, Ex-e), wiring and terminals',7200],note:'Adds redundant controllers, SIL-rated I/O for ESDV signals and Ex-d junction boxes.'},
 infra:{gw:'Modbus TCP gateway (VFD, breaker and transformer status)',net:1,panel:['Control panel enclosure (IP54), wiring and terminals',4200],note:'Adds a Modbus gateway and a managed switch pair.'},
 metals:{panel:['Heavy-duty control panel enclosure (IP66, ventilated), wiring and terminals',5600],note:'Heavy-duty ventilated enclosure for hot, dusty areas.'},
 fb:{panel:['Stainless steel control panel enclosure (SS316, IP66), wiring and terminals',6900],note:'Stainless steel hygienic enclosure.'}};
const sel=$('#projType');let ov={},rows=[];
try{ov=JSON.parse(localStorage.getItem('hmi-prices'))||{};sel.value=localStorage.getItem('hmi-proj')||'dc'}catch(e){}
function build(){
 const pt=PT[sel.value],els=HMI.els,n=t=>els.filter(e=>e.type===t).length,io={DI:0,DO:0,AI:0,AO:0},sl={DI:0,DO:0,AI:0,AO:0},R=[];
 els.forEach(e=>HMI.types[e.type].io.forEach((c,i)=>{(pt.sil&&e.type==='esdv'?sl:io)[K[i]]+=c}));
 const add=(cat,key,name,q,u)=>{if(q>0)R.push({cat,key,name,q,u:ov[key]!==undefined?ov[key]:u})};
 const C1='Controller racks & communications',C2='I/O modules',C3='Field instrumentation',C4='Enclosures & Ex-d',C5='SCADA software & engineering';
 add(C1,'cpu',pt.red?'Redundant PLC CPU pair (hot-standby), rack and dual 24 VDC PSU':'PLC CPU, rack and 24 VDC power supply',1,pt.red?17500:6800);
 if(pt.gw)add(C1,'gw',pt.gw,pt.btu?Math.max(1,n('chiller')):1,5200);
 if(pt.net)add(C1,'net','Managed Ethernet switch pair (redundant ring)',1,6400);
 let mods=0;K.forEach(k=>[[io,'io',1,''],[sl,'sil',SIL,'SIL-rated ']].forEach(([o,p,f,pre])=>{if(!o[k])return;const q=Math.ceil(o[k]*1.2/M[k][2]);mods+=q;add(C2,p+k,`${pre}${M[k][0]} (${o[k]} ${k} + 20% spare)`,q,Math.round(M[k][1]*f))}));
 const inst=n('tank')+n('meter')+n('digital')+n('flow')+n('esdv')+n('control');
 add(C3,'lt',pt.ip68?'IP68 submersible level transmitter (4-20 mA)':'Radar level transmitter (4-20 mA)',n('tank'),pt.ip68?3100:2400);
 add(C3,'pt',pt.ip68?'IP68 pressure transmitter (4-20 mA)':'Pressure transmitter (4-20 mA)',n('meter'),pt.ip68?2300:1800);
 add(C3,'tt','RTD temperature transmitter (4-20 mA)',n('digital'),950);
 add(C3,'ft',pt.btu?'BTU meter (ultrasonic flow, paired RTDs, integrator)':'Electromagnetic flow transmitter (4-20 mA)',n('flow'),pt.btu?11500:6200);
 add(C3,'esdv','ESDV actuator, solenoid and limit-switch kit',n('esdv'),9800);
 add(C3,'pos','Control valve positioner (4-20 mA)',n('control'),3200);
 add(C4,'panel',pt.panel[0],1,pt.panel[1]+mods*350);
 if(pt.ex)add(C4,'exjb','Ex-d junction box for field instruments',Math.max(1,Math.ceil(inst/3)),3200);
 const tot=K.reduce((a,k)=>a+io[k]+sl[k],0),t=tot<=50?[50,8500]:tot<=150?[150,15000]:tot<=500?[500,28000]:[1000,52000];
 add(C5,'rt',`SCADA runtime licence (${t[0]} I/O tier)`,1,t[1]);add(C5,'dev','SCADA development licence and engineering station',1,12000);
 add(C5,'eng','Engineering, FAT and site commissioning (days)',Math.max(3,Math.ceil(els.length/4)),1900);
 if(pt.sil&&sl.DI+sl.DO)add(C5,'sildoc','SIL verification and functional safety documentation',1,9500);
 return{R,io,sl}}
function calc(){
 const b=build(),g=[];rows=b.R;let h='',all=0;
 [...new Set(rows.map(r=>r.cat))].forEach(c=>{const rs=rows.filter(r=>r.cat===c),sub=rs.reduce((a,r)=>a+r.q*r.u,0);all+=sub;
  h+=`<tr class="cat"><th colspan="3">${c}</th><th>${sub.toLocaleString()}</th></tr>`+rs.map(r=>`<tr><td>${r.name}</td><td>${r.q}</td><td><input type="number" min="0" step="50" data-k="${r.key}" value="${r.u}" aria-label="Unit price AED"></td><td>${(r.q*r.u).toLocaleString()}</td></tr>`).join('')});
 $('#bomTable tbody').innerHTML=h+`<tr class="cat"><th colspan="3">Estimated total (AED)</th><th>${all.toLocaleString()}</th></tr>`;
 $('#ioSummary').innerHTML=K.map(k=>`<div class="io"><b>${b.io[k]+b.sl[k]}</b>${k}${b.sl[k]?' ('+b.sl[k]+' SIL)':''}</div>`).join('')+`<div class="io"><b>${HMI.els.length}</b>Symbols</div>`;
 $('#projNote').textContent=PT[sel.value].note+' Unit prices are indicative AED placeholders; edit them to match your quotes.'}
sel.onchange=()=>{try{localStorage.setItem('hmi-proj',sel.value)}catch(e){}calc()};
$('#bomTable tbody').addEventListener('change',e=>{const k=e.target.dataset.k;if(!k)return;ov[k]=Math.max(0,+e.target.value||0);try{localStorage.setItem('hmi-prices',JSON.stringify(ov))}catch(x){}calc()});
$('#bomReset').onclick=()=>{ov={};try{localStorage.removeItem('hmi-prices')}catch(e){}calc();HMI.toast('Prices reset')};
$('#bomCsv').onclick=()=>{calc();const csv='Category,Item,Qty,Unit AED,Total AED\n'+rows.map(r=>`"${r.cat}","${r.name}",${r.q},${r.u},${r.q*r.u}`).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='hmi-bom.csv';a.click()};
HMI.on('change',calc);HMI.on('tab',t=>t==='bom'&&calc());
HMI.on('template',k=>{sel.value={cooling:'dc',water:'ww',og:'og'}[k]||sel.value;try{localStorage.setItem('hmi-proj',sel.value)}catch(e){}calc()});
calc();
})();
