// 在线演示播放器：实时循环播放时间轴，点击开始（带 BGM），可拖动进度。
// 逐帧渲染时在地址后加 ?render=1，本文件不会生效。
const DUR=window.DURATION||87;
const st=document.createElement('style');
st.textContent=`html,body{width:100%!important;height:100%!important;margin:0;display:flex;align-items:center;justify-content:center;background:#050506}
#app{transform-origin:center center;flex:none}
#pl{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);width:min(360px,90vw);display:flex;align-items:center;gap:10px;z-index:99;font:600 12px Inter,'Noto Sans SC',sans-serif;color:#cfcfd4;opacity:.85}
#pl button{all:unset;cursor:pointer;width:30px;height:30px;border-radius:50%;background:#1d1d21;display:grid;place-items:center;font-size:13px}
#pl input{flex:1;accent-color:#7ee0a0}
#start{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(5,5,6,.72);color:#fff;font:600 15px Inter,'Noto Sans SC',sans-serif;cursor:pointer}
#start b{width:68px;height:68px;border-radius:50%;background:#7ee0a0;color:#0b0b0d;display:grid;place-items:center;font-size:26px}`;
document.head.appendChild(st);
const app=document.getElementById('app');
function fit(){const s=Math.min(innerWidth/390,(innerHeight-56)/844);app.style.transform=`scale(${s})`;}
addEventListener('resize',fit);fit();
const au=new Audio('media/bgm.m4a');au.preload='auto';
const ui=document.createElement('div');ui.id='pl';
ui.innerHTML='<button id="pp">❚❚</button><input id="sk" type="range" min="0" max="'+DUR+'" step="0.01" value="0"><span id="tt">0:00</span><button id="mu">♪</button>';
document.body.appendChild(ui);
const sv=document.createElement('div');sv.id='start';sv.innerHTML='<b>▶</b>点击播放 · 约 87 秒 · 有背景音乐';document.body.appendChild(sv);
let playing=false,t=0,last=0,muted=false;
const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function syncAudio(){if(muted||!playing){au.pause();return;}au.currentTime=t;au.play().catch(()=>{});}
function loop(now){if(playing){t+=(now-last)/1000;if(t>=DUR){t=0;syncAudio();}}last=now;
  if(window.renderFrame)window.renderFrame(t);sk.value=t;tt.textContent=fmt(t);requestAnimationFrame(loop);}
const sk=ui.querySelector('#sk'),tt=ui.querySelector('#tt'),pp=ui.querySelector('#pp'),mu=ui.querySelector('#mu');
function setPlay(v){playing=v;pp.textContent=v?'❚❚':'▶';syncAudio();}
pp.onclick=()=>setPlay(!playing);
mu.onclick=()=>{muted=!muted;mu.style.opacity=muted?.35:1;syncAudio();};
sk.oninput=()=>{t=+sk.value;syncAudio();};
sv.onclick=()=>{sv.remove();setPlay(true);};
(function wait(){if(window.ready){last=performance.now();requestAnimationFrame(loop);}else setTimeout(wait,50);})();
