/* Run: npm i canvas && node js/generate-icons.js   (writes PNGs into ./icons) */
const {createCanvas}=require('canvas'),fs=require('fs'),path=require('path');
const out=path.join(__dirname,'..','icons');fs.mkdirSync(out,{recursive:true});
function icon(size,name,maskable){
 const c=createCanvas(size,size),g=c.getContext('2d');g.fillStyle='#1d2327';
 if(maskable)g.fillRect(0,0,size,size);else{const r=size*.18;g.beginPath();g.roundRect(0,0,size,size,r);g.fill()}
 const s=size*(maskable?.5:.62),x=(size-s)/2,y=(size-s)/2;
 g.strokeStyle='#dfe3e6';g.lineWidth=size*.04;g.strokeRect(x,y,s,s);          // screen frame
 g.fillStyle='#3a7ca5';g.fillRect(x+s*.1,y+s*.5,s*.22,s*.4);                   // tank fill
 g.strokeRect(x+s*.1,y+s*.12,s*.22,s*.78);
 g.fillStyle='#e0a100';g.beginPath();g.arc(x+s*.68,y+s*.38,s*.16,0,Math.PI*2);g.fill(); // alarm lamp
 g.fillStyle='#dfe3e6';g.fillRect(x+s*.5,y+s*.7,s*.36,s*.06);                  // pipe
 fs.writeFileSync(path.join(out,name),c.toBuffer('image/png'));
}
[72,96,128,144,152,192,384,512].forEach(s=>icon(s,`icon-${s}.png`));
icon(512,'maskable-512.png',true);icon(180,'apple-touch-icon.png',true);icon(32,'favicon-32.png');icon(16,'favicon-16.png');
console.log('Icons written to',out);
