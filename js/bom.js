/* IO counting from canvas symbols and an indicative hardware/software BOM (AED). Prices are placeholders: replace with vendor quotes. */
(function(){
const $=s=>document.querySelector(s);let rows=[];
const P={DI:{n:'PLC digital input module, 16 ch (24 VDC)',u:1450,per:16},DO:{n:'PLC digital output module, 16 ch (relay)',u:1700,per:16},AI:{n:'PLC analog input module, 8 ch (4-20 mA)',u:2900,per:8},AO:{n:'PLC analog output module, 4 ch (4-20 mA)',u:2600,per:4}};
function calc(){
 const io={DI:0,DO:0,AI:0,AO:0};HMI.els.forEach(e=>HMI.types[e.type].io.forEach((n,i)=>io[['DI','DO','AI','AO'][i]]+=n));
 const spare=Math.ceil;rows=[];
 for(const k in io){const need=spare(io[k]*1.2),q=Math.ceil(need/P[k].per);if(io[k])rows.push([P[k].n+` (${io[k]} ${k} + 20% spare)`,q,P[k].u])}
 const mods=rows.reduce((a,r)=>a+r[1],0);
 rows.push(['PLC CPU, rack and 24 VDC power supply',1,6800],['Control panel enclosure, wiring and terminals',1,4200+mods*350],['Operator HMI panel, 10" (or SCADA runtime licence)',1,7500],['SCADA development and licence allowance (System Platform / InTouch)',1,12000],['Engineering, FAT and site commissioning (days)',Math.max(3,Math.ceil(HMI.els.length/4)),1900]);
 $('#ioSummary').innerHTML=Object.keys(io).map(k=>`<div class="io"><b>${io[k]}</b>${k}</div>`).join('')+`<div class="io"><b>${HMI.els.length}</b>Symbols</div>`;
 $('#bomTable tbody').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2].toLocaleString()}</td><td>${(r[1]*r[2]).toLocaleString()}</td></tr>`).join('')+`<tr><th colspan="3">Estimated total</th><th>${rows.reduce((a,r)=>a+r[1]*r[2],0).toLocaleString()}</th></tr>`;
}
HMI.on('change',calc);HMI.on('tab',t=>t==='bom'&&calc());
$('#bomCsv').onclick=()=>{calc();const csv='Item,Qty,Unit AED,Total AED\n'+rows.map(r=>`"${r[0]}",${r[1]},${r[2]},${r[1]*r[2]}`).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='hmi-bom.csv';a.click()};
calc();
})();
