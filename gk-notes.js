/* Grand Keys: find the notes of your own song (MP3/WAV) and teach it with falling notes. */
(()=>{
const FN=4096,HOP=512,TS=11025,LOM=48,NN=37,MAXS=120;
const cs=new Float32Array(FN/2),sn=new Float32Array(FN/2),win=new Float32Array(FN);
for(let i=0;i<FN/2;i++){cs[i]=Math.cos(-2*Math.PI*i/FN);sn[i]=Math.sin(-2*Math.PI*i/FN)}
for(let i=0;i<FN;i++)win[i]=.5-.5*Math.cos(2*Math.PI*i/(FN-1));
const rv=new Uint16Array(FN);for(let i=0,b=Math.log2(FN);i<FN;i++){let r=0;for(let j=0;j<b;j++)if(i>>j&1)r|=1<<(b-1-j);rv[i]=r}
function fft(re,im){const n=FN;for(let i=0;i<n;i++){const j=rv[i];if(j>i){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t}}
 for(let s=2;s<=n;s<<=1){const h=s>>1,st=n/s;for(let k=0;k<n;k+=s)for(let j=0;j<h;j++){const c=cs[j*st],d=sn[j*st],a=k+j,b=a+h,tr=re[b]*c-im[b]*d,ti=re[b]*d+im[b]*c;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti}}}
const wait=()=>new Promise(r=>setTimeout(r));
function chordsOf(chr,nF){const W=Math.round(TS/HOP),nw=Math.floor(nF/W),ids=[],en=[];
 for(let w=0;w<nw;w++){const c=new Float32Array(12);for(let i=w*W;i<(w+1)*W;i++)for(let p=0;p<12;p++)c[p]+=chr[i*12+p];en.push(c.reduce((a,b)=>a+b,0));const nm=Math.hypot(...c)||1;let b=-1,bs=0;
  for(let r=0;r<12;r++)for(let mn=0;mn<2;mn++){const q=(c[r]+c[(r+(mn?3:4))%12]+c[(r+7)%12])/nm/1.732-(mn?.02:0);if(q>bs){bs=q;b=r+12*mn}}ids.push(b)}
 const med=[...en].sort((a,b)=>a-b)[nw>>1];ids.forEach((v,i)=>{if(en[i]<.3*med)ids[i]=-1});
 const s2=ids.map((v,i)=>{const a=ids[Math.max(0,i-1)],c=ids[Math.min(nw-1,i+1)];return a==c?a:v}),out=[];
 s2.forEach((v,i)=>{if(v<0)return;const l=out[out.length-1];if(l&&l.v==v&&l.e==i)l.e=i+1;else out.push({v,s:i,e:i+1})});
 const T=W*HOP/TS,res=[];out.forEach(o=>{const r=o.v%12,mn=o.v>=12,t=o.s*T,d=(o.e-o.s)*T*.97,b=48+r;[36+r,b,b+(mn?3:4),b+7].forEach(n=>res.push({t,d,n}))});return res}
async function transcribe(file,say){
 init();say('Opening the song…');
 const raw=await ac.decodeAudioData(await file.arrayBuffer()),secs=Math.min(raw.duration,MAXS);
 const oc=new OfflineAudioContext(1,Math.ceil(secs*TS),TS),s=oc.createBufferSource();s.buffer=raw;s.connect(oc.destination);s.start(0);
 const x=(await oc.startRendering()).getChannelData(0),nF=Math.floor((x.length-FN)/HOP)+1;
 if(nF<10)throw 0;
 const re=new Float32Array(FN),im=new Float32Array(FN),mg=new Float32Array(FN/2),note=new Int16Array(nF),val=new Float32Array(nF),chr=new Float32Array(nF*12),pcs=new Uint8Array(FN/2);for(let k=30;k<372;k++)pcs[k]=((Math.round(12*Math.log2(k*TS/FN/440)+69)%12)+12)%12;
 const sal=m=>{const f=440*Math.pow(2,(LOM+m-69)/12);let t=0;for(let h=1;h<=5;h++){const k=Math.round(f*h*FN/TS);if(k+1>=FN/2)break;t+=Math.max(mg[k-1],mg[k],mg[k+1])*Math.pow(.85,h-1)}return t};
 for(let i=0;i<nF;i++){
  for(let j=0;j<FN;j++){re[j]=x[i*HOP+j]*win[j];im[j]=0}
  fft(re,im);for(let k=0;k<FN/2;k++)mg[k]=Math.sqrt(Math.hypot(re[k],im[k]));for(let k=30;k<372;k++)chr[i*12+pcs[k]]+=mg[k];
  let b=0,bv=-1;const S=[];for(let m=0;m<NN;m++){S[m]=sal(m);if(S[m]>bv){bv=S[m];b=m}}
  if(b>=12&&S[b-12]>.75*bv)b-=12;
  note[i]=b;val[i]=bv;
  if(i%150==0){say('Finding the notes… '+Math.round(i/nF*100)+'%');await wait()}}
 const p90=[...val].sort((a,b)=>a-b)[Math.floor(nF*.9)],raw2=new Int16Array(nF);
 for(let i=0;i<nF;i++)raw2[i]=val[i]>.3*p90?note[i]+LOM:-1;
 const sm=new Int16Array(nF);for(let i=0;i<nF;i++){const w=[];for(let j=-2;j<=2;j++)w.push(raw2[Math.max(0,Math.min(nF-1,i+j))]);w.sort((a,b)=>a-b);sm[i]=w[2]}
 let runs=[];for(let i=0;i<nF;){let j=i;while(j<nF&&sm[j]==sm[i])j++;if(sm[i]>=0)runs.push({n:sm[i],a:i,b:j});i=j}
 runs=runs.filter(r=>r.b-r.a>=3);const mr=[];
 runs.forEach(r=>{const l=mr[mr.length-1];if(l&&l.n==r.n&&r.a-l.b<=2)l.b=r.b;else mr.push({...r})});
 const T=HOP/TS;return{mel:mr.map(r=>({t:r.a*T,d:Math.max(.12,(r.b-r.a)*T),n:r.n})),chords:chordsOf(chr,nF)}}
const SK='gkmine',mine=()=>{try{return JSON.parse(localStorage[SK]||'[]')}catch(e){return[]}},keep=a=>{try{localStorage[SK]=JSON.stringify(a);return 1}catch(e){return 0}};
const nn=n=>NM[n%12]+(Math.floor(n/12)-1);
function mys(){const d=$('#mys');if(!d)return;d.innerHTML='';const a=mine();if(!a.length)return;d.insertAdjacentHTML('beforeend','<b>My songs</b>');
 a.forEach((q,i)=>{const b=document.createElement('button');b.className='s';b.innerHTML='<small>🗑</small>';b.append(q.name);b.onclick=ev=>{if(ev.target.tagName=='SMALL'){a.splice(i,1);keep(a);mys();return}load(q.name,q.bpm||60,q.notes,12)};d.appendChild(b)})}
function ui(){
 const e=$('#songs');if(!e||e.querySelector('#aud'))return;
 const w=document.createElement('div');w.id='aud';
 w.innerHTML='<b>Your own song</b><button class="s" id="audb">🎵 Import my song (MP3 / WAV) and find the notes</button><label style="display:flex;gap:8px;margin:6px 0"><input type="checkbox" id="auc" checked> Add chords (left hand)</label><p id="aus">Works best when one clear melody leads. Full bands are rough. First 2 minutes are used. After import, tap a note to fix it, or tap empty space to add one.</p><input type="file" id="auf" accept="audio/*" hidden><div id="mys"></div>';
 e.insertBefore(w,e.querySelector('#slist'));mys();
 $('#audb').onclick=()=>$('#auf').click();
 $('#auf').onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const say=t=>{$('#aus').textContent=t;$('#lat').textContent=t};
  try{const r=await transcribe(f,say);if(r.mel.length<4){say('Could not find clear notes in this song. Try a simpler recording, or a MIDI file.');return}
   const n=r.mel.concat($('#auc').checked?r.chords:[]);say('Found '+r.mel.length+' melody notes'+($('#auc').checked?' and '+r.chords.length/4+' chords.':'.'));load(f.name.replace(/\.[^.]+$/,'')+' (found notes)',60,n,12)}
  catch(x){say('This file could not be opened. Try an MP3 or WAV.')}ev.target.value=''}}
const _s=showSongs;showSongs=function(){_s();ui()};
// ---- fix notes: tap a falling note to change it, tap empty space to add ----
const ed=document.createElement('div');ed.className='pop sl';ed.hidden=true;ed.style.cssText='right:auto;left:50%;transform:translateX(-50%);top:64px;width:min(330px,92%);text-align:center;z-index:12;box-shadow:0 8px 30px #0008';$('#app').appendChild(ed);
const fin=()=>{ed.hidden=true;L.notes.sort((a,b)=>a.t-b.t);L.tot=Math.max(...L.notes.map(q=>q.t+q.d))};
function save(){const a=mine().filter(q=>q.name!=L.s);a.unshift({name:L.s,bpm:L.bpm,notes:L.notes.map(q=>({t:+q.t.toFixed(3),d:+q.d.toFixed(3),n:q.n}))});$('#lat').textContent=keep(a)?'Saved to My songs (Learn > Songs > Find / Import).':'Could not save: phone storage is full.';mys()}
function edit(x,mode){ed.innerHTML='';
 const T=t=>{const b=document.createElement('b');b.textContent=t;ed.appendChild(b)},A=(t,f)=>{const b=document.createElement('button');b.className='s';b.textContent=t;b.style.cssText='display:inline-block;width:48%;margin:2px 1%;text-align:center';b.onclick=f;ed.appendChild(b)};
 if(mode=='add'){T('Add note '+nn(x.n));A('Add note',()=>{L.notes.push({t:x.t,d:.5,n:x.n,done:0,pl:0});fin()})}
 else{T('Note '+nn(x.n));const mv=d=>()=>{const n=x.n+d;if(n<21||n>108)return;x.n=n;x.done=x.pl=0;pl(n,.7,ac.currentTime,.4);edit(x,'e')};
  A('♯ up',mv(1));A('♭ down',mv(-1));A('Octave ↑',mv(12));A('Octave ↓',mv(-12));
  A('Longer',()=>{x.d+=.25;edit(x,'e')});A('Shorter',()=>{x.d=Math.max(.15,x.d-.25);edit(x,'e')});
  A('Delete',()=>{L.notes.splice(L.notes.indexOf(x),1);fin()})}
 A('💾 Save song',save);A('Done',fin);ed.hidden=false}
cv.addEventListener('pointerdown',e=>{if(!L.s||!$('#sp').hidden)return;const h=cv.clientHeight,ppb=h/6,x=e.offsetX+kw.scrollLeft,y=e.offsetY;let best=null,bd=1e9;
 L.notes.forEach(q=>{const k=kx[q.n];if(!k||x<k.x-3||x>k.x+k.w+3)return;const y1=h-(q.t-L.pos)*ppb,y0=Math.min(y1-8,h-(q.t+q.d-L.pos)*ppb);if(y<y0-4||y>y1+4)return;const dd=Math.abs((y0+y1)/2-y);if(dd<bd){bd=dd;best=q}});
 L.play=false;lpl();
 if(best){pl(best.n,.7,ac.currentTime,.4);edit(best,'e');return}
 let kn=0;for(let n=LO;n<=HI;n++){const k=kx[n];if(x>=k.x&&x<=k.x+k.w){if(k.b){kn=n;break}if(!kn)kn=n}}
 if(kn)edit({n:kn,t:Math.max(0,Math.round((L.pos+(h-y)/ppb)*4)/4)},'add')});
})();
