// ===================== NAVIGATION =====================
function goToPage(n){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page'+n).classList.add('active');
  if(n===2) startPage2();
  if(n===4) startPage4();
}

// ===================== PAGE 1 =====================
document.getElementById('btnKlik').addEventListener('click',()=>goToPage(2));

// ===================== PAGE 2 =====================
function startPage2(){
  candleBlown=false;
  document.getElementById('flameGroup').classList.remove('blown');
  document.getElementById('candleGroup').classList.remove('blown-state');
  document.getElementById('blowHint').classList.add('hidden');
  document.getElementById('micBarWrap').classList.add('hidden');
  setTimeout(()=>document.getElementById('wishOverlay').classList.add('show'),300);
  const container=document.getElementById('confettiContainer');
  container.innerHTML='';
  const colors=['#f48fb1','#f8bbd0','#ffffff','#fff176','#ffcc80','#ce93d8','#80cbc4','#ff8a65'];
  for(let i=0;i<100;i++){
    const el=document.createElement('div');
    el.classList.add('confetti-piece');
    const size=Math.random()*10+6,isCircle=Math.random()>.5;
    el.style.cssText=`left:${Math.random()*100}%;width:${size}px;height:${isCircle?size:size*.5}px;background:${colors[~~(Math.random()*colors.length)]};border-radius:${isCircle?'50%':'2px'};animation-duration:${(Math.random()*2.5+2).toFixed(2)}s;animation-delay:${(Math.random()*2.2).toFixed(2)}s;`;
    container.appendChild(el);
  }
  setTimeout(()=>container.innerHTML='',7000);
}

document.getElementById('btnWish').addEventListener('click',()=>{
  document.getElementById('wishOverlay').classList.remove('show');
  document.getElementById('blowHint').classList.remove('hidden');
  document.getElementById('micBarWrap').classList.remove('hidden');
  startMic();
});

document.getElementById('btnNext').addEventListener('click',()=>{stopMic();goToPage(3);});

// ===================== BLOW CANDLE =====================
let candleBlown=false;

function blowCandle(){
  if(candleBlown)return;
  candleBlown=true;
  stopMic();
  const flame=document.getElementById('flameGroup');
  flame.classList.add('blown');
  document.getElementById('candleGroup').classList.add('blown-state');
  document.getElementById('blowHint').classList.add('hidden');
  document.getElementById('micBarWrap').classList.add('hidden');

  const page2=document.getElementById('page2');
  const svgRect=document.querySelector('.cake-svg').getBoundingClientRect();
  const p2Rect=page2.getBoundingClientRect();
  const fx=svgRect.left-p2Rect.left+(130/260)*svgRect.width;
  const fy=svgRect.top -p2Rect.top +(55/280)*svgRect.height;

  for(let i=0;i<7;i++){
    const s=document.createElement('div');
    s.classList.add('smoke');
    const sz=Math.random()*14+8;
    s.style.cssText=`left:${fx+(Math.random()-.5)*20}px;top:${fy}px;width:${sz}px;height:${sz}px;animation-duration:${(Math.random()*.5+.7).toFixed(2)}s;animation-delay:${(i*.09).toFixed(2)}s;`;
    page2.appendChild(s);
    setTimeout(()=>s.remove(),1900);
  }

  const cols=['#fff176','#f48fb1','#ce93d8','#80cbc4','#ffcc80','#ffffff','#ff8a65','#aed581'];
  for(let i=0;i<70;i++){
    const b=document.createElement('div');
    const sz=Math.random()*9+5;
    b.style.cssText=`position:absolute;border-radius:50%;pointer-events:none;left:${fx}px;top:${fy}px;width:${sz}px;height:${sz}px;background:${cols[~~(Math.random()*cols.length)]};`;
    const angle=Math.random()*360,dist=Math.random()*200+60;
    const tx=Math.cos(angle*Math.PI/180)*dist,ty=Math.sin(angle*Math.PI/180)*dist;
    page2.appendChild(b);
    setTimeout(()=>{
      b.style.transition=`transform ${(Math.random()*.5+.6).toFixed(2)}s ease-out,opacity .6s ease-out`;
      b.style.transform=`translate(${tx}px,${ty}px) scale(.15)`;
      b.style.opacity='0';
      setTimeout(()=>b.remove(),1400);
    },10);
  }

  setTimeout(()=>{
    const msg=document.getElementById('blownMsg');
    msg.classList.add('show');
    setTimeout(()=>{
      msg.classList.remove('show');
      setTimeout(()=>{
        candleBlown=false;
        flame.classList.remove('blown');
        document.getElementById('candleGroup').classList.remove('blown-state');
        document.getElementById('blowHint').classList.remove('hidden');
        document.getElementById('micBarWrap').classList.remove('hidden');
        startMic();
      },900);
    },3000);
  },350);
}

document.getElementById('candleGroup').addEventListener('click',blowCandle);

// ===================== MIC DETECTION =====================
let audioCtx=null,analyser=null,micStream=null,micActive=false,animFrame=null;
const BLOW_THRESHOLD=5; // turunkan = lebih sensitif

async function startMic(){
  if(micActive)return;
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    micStream=stream;
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    analyser=audioCtx.createAnalyser();
    analyser.fftSize=512;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    micActive=true;
    detectBlow();
  }catch(e){
    document.getElementById('blowHint').textContent='🕯️ klik lilinnya untuk meniup!';
    document.getElementById('micBarWrap').classList.add('hidden');
  }
}

function stopMic(){
  micActive=false;
  if(animFrame)cancelAnimationFrame(animFrame);
  if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null;}
  if(audioCtx){audioCtx.close();audioCtx=null;}
  analyser=null;
}

function detectBlow(){
  if(!micActive||!analyser)return;
  const data=new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum=0;
  for(let i=0;i<data.length;i++){const v=(data[i]-128)/128;sum+=v*v;}
  const rms=Math.sqrt(sum/data.length)*100;
  const pct=Math.min(rms*3,100);
  document.getElementById('micBar').style.width=pct+'%';
  document.getElementById('micBar').style.background=pct>65
    ?'linear-gradient(90deg,#fff9c4,#ffeb3b)'
    :'linear-gradient(90deg,#fff9c4,#fff)';
  if(rms>BLOW_THRESHOLD){blowCandle();return;}
  animFrame=requestAnimationFrame(detectBlow);
}

// ===================== PAGE 3 — ENVELOPE =====================
const env=document.getElementById('envelopeWrapper');
let envClicked=false;
env.addEventListener('click',()=>{
  if(envClicked)return;
  envClicked=true;
  env.style.animation='none';
  env.classList.add('opening');
  setTimeout(()=>{
    goToPage(4);
    setTimeout(()=>{
      env.classList.remove('opening');
      env.style.animation='';
      envClicked=false;
    },100);
  },1300);
});

// ===================== PAGE 4 — LETTER =====================
// ✏️ EDIT PESAN DI SINI:
const MESSAGE=`Happy birthday, Lala! 🎉 Semoga kamu selalu diberikan kesehatan, kebahagiaan, dan dikelilingi oleh hal-hal baik. Semoga semua yang kamu inginkan di tahun ini bisa tercapai ✨

Don’t forget to keep smiling ya, because your smile makes my day better too 🤓🙂

Btw, kamu suka ga kadonya? Sorry ya kalau kadonya agak telat hehe.`;

function startPage4(){
  const card=document.getElementById('letterCard');
  const body=document.getElementById('letterBody');
  card.style.animation='none';
  card.offsetHeight;
  card.style.animation='letterPop .75s cubic-bezier(.34,1.4,.64,1) both';
  body.innerHTML='';
  let i=0;
  function type(){
    if(i<MESSAGE.length){
      if(MESSAGE[i]==='\n')body.innerHTML+='<br>';
      else body.textContent+=MESSAGE[i];
      i++;
      setTimeout(type,42);
    }
  }
  setTimeout(type,600);
}

document.getElementById('btnBack').addEventListener('click',()=>goToPage(1));

// ===================== STARS =====================
function addStars(id,n){
  const page=document.getElementById(id);
  const icons=['✿','✦','✧','⋆','˚','·','✼','❋'];
  for(let i=0;i<n;i++){
    const s=document.createElement('div');
    s.classList.add('star');
    s.textContent=icons[~~(Math.random()*icons.length)];
    s.style.cssText=`left:${Math.random()*88+4}%;top:${Math.random()*80+5}%;animation-delay:${(Math.random()*2.5).toFixed(1)}s;font-size:${(Math.random()*.9+.8).toFixed(1)}rem;color:#f48fb1;`;
    page.appendChild(s);
  }
}
addStars('page1',16);
addStars('page3',14);
addStars('page4',10);

// ===================== INIT =====================
goToPage(1);