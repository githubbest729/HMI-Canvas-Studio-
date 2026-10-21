/* App shell: PWA registration, tab routing, toasts, scripting sandbox, shared state */
window.HMI={els:[],pipes:[],hist:[],fut:[],sel:null,vals:{},ev:{},on(n,f){(this.ev[n]=this.ev[n]||[]).push(f)},emit(n,d){(this.ev[n]||[]).forEach(f=>f(d))},
 save(){const s=JSON.stringify({els:this.els,pipes:this.pipes});try{localStorage.setItem('hmi-layout',s)}catch(e){}if(this._last===s)return;const n=Date.now();if(this._last!==undefined&&(n-(this._t||0)>500||!this.hist.length))this.hist.push(this._last);this._last=s;this._t=n;this.fut=[];if(this.hist.length>100)this.hist.shift()},
 toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.getElementById('toasts').append(t);setTimeout(()=>t.remove(),2800)}};
(function(){
 const $=s=>document.querySelector(s);
 function show(n){document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.id==='tab-'+n));document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===n));HMI.emit('tab',n)}
 $('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b){show(b.dataset.tab);history.replaceState(null,'','#'+b.dataset.tab)}});
 const h=location.hash.slice(1);if(document.getElementById('tab-'+h))show(h);
 if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(e=>console.warn('SW',e)));
 let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#installBtn').hidden=false});
 $('#installBtn').onclick=async()=>{if(!dp)return;dp.prompt();await dp.userChoice;dp=null;$('#installBtn').hidden=true};
 addEventListener('appinstalled',()=>HMI.toast('Installed'));
 addEventListener('offline',()=>HMI.toast('Offline – working from cache'));addEventListener('online',()=>HMI.toast('Back online'));
 // Scripting sandbox (runs user code each second with a tag API)
 let timer=null;const out=$('#scriptLog');
 const log=m=>{out.textContent+=new Date().toLocaleTimeString()+'  '+m+'\n';out.scrollTop=out.scrollHeight};
 function run(){let fn;try{fn=new Function('tag','set','log',$('#scriptSrc').value)}catch(e){log('Syntax error: '+e.message);return}
  clearInterval(timer);log('Script started');
  timer=setInterval(()=>{try{fn(n=>HMI.vals[n],(n,v)=>{HMI.vals[n]=v;HMI.forced=HMI.forced||{};HMI.forced[n]=v},log)}catch(e){log('Runtime error: '+e.message);clearInterval(timer)}},1000)}
 $('#runScript').onclick=run;$('#stopScript').onclick=()=>{clearInterval(timer);log('Script stopped')};
})();
