/* Multi-pen trend chart drawn on Canvas 2D; play/pause and time-scale */
(function(){
const $=s=>document.querySelector(s),cv=$('#trendCv'),g=cv.getContext('2d'),hist={},C=['#4fc3f7','#ffb74d','#81c784','#e57373','#ba68c8','#fff176'];let run=true;
HMI.on('tick',()=>{if(!run)return;HMI.els.filter(e=>HMI.types[e.type].analog).forEach(e=>{const h=hist[e.tag]=hist[e.tag]||[];h.push([Date.now(),(e.value-e.euMin)/((e.euMax-e.euMin)||1),e.value,e.unit]);if(h.length>900)h.shift()});draw()});
HMI.on('tab',draw);
function draw(){
 if(!$('#tab-trends').classList.contains('on'))return;
 const W=cv.width,H=cv.height,span=+$('#trScale').value*1000,now=Date.now(),pens=Object.keys(hist).filter(t=>HMI.els.some(e=>e.tag===t));
 g.fillStyle='#101417';g.fillRect(0,0,W,H);g.strokeStyle='#27323a';g.lineWidth=1;g.fillStyle='#7d8b93';g.font='12px system-ui';
 for(let i=0;i<=10;i++){const y=20+(H-40)*i/10;g.beginPath();g.moveTo(40,y);g.lineTo(W-10,y);g.stroke();g.fillText((100-i*10)+'%',4,y+4)}
 pens.forEach((t,i)=>{g.strokeStyle=C[i%C.length];g.lineWidth=2;g.beginPath();let first=true;
  hist[t].forEach(p=>{const x=40+(W-50)*(1-(now-p[0])/span);if(x<40)return;const y=20+(H-40)*(1-p[1]);first?g.moveTo(x,y):g.lineTo(x,y);first=false});g.stroke()});
 $('#legend').innerHTML=pens.map((t,i)=>{const l=hist[t].at(-1);return `<b style="color:${C[i%C.length]}">${t} ${l?l[2].toFixed(1)+' '+l[3]:''}</b>`}).join(' &nbsp; ')||'<span class="muted">Add a tank, gauge or meter to see a pen.</span>';
}
$('#trPlay').onclick=e=>{run=!run;e.target.textContent=run?'Pause':'Resume'};
$('#trScale').onchange=draw;
})();
