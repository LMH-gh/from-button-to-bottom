import * as THREE from '../three.module.js';
import {V,clamp,seg,eio,eo,sm,lerp} from './util.js';
import {buildCity,CITY} from './city.js';
import {buildCinema,CROWS,CCOLS,cSeat} from './cinema.js';
import {buildTrain,winL,winR,colX as tColX,rowZ as tRowZ,EYEOFF,PITCH} from './train.js';
import {buildRegion,REG} from './region.js';
import {buildMountain} from './mountain.js';
await document.fonts.load('700 30px "Noto Sans CJK SC"');await document.fonts.load('500 13px "Noto Sans CJK SC"');

const $=id=>document.getElementById(id);
const canvas=$('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(2);renderer.setSize(390,844,false);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
const camera=new THREE.PerspectiveCamera(40,390/844,0.04,3000);

const city=buildCity(),cine=buildCinema(),train=buildTrain(camera),region=buildRegion(),mtn=buildMountain();

// ---------- timeline ----------
const T={intro:[0,4],city1:[3.6,13.2],cmap:[12.8,16.8],cine:[16.2,24.6],card2:[24.4,26],city2:[25.6,30.8],
  reg1:[30.4,34],tmap:[33.4,37.2],train:[36.6,45.4],reg2:[45,49.6],card3:[49.4,51],mtn:[50.6,80.4],outro:[80,87]};
window.DURATION=87;

// ---------- icons ----------
const IC={
 walk:'<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="10" cy="3" r="1.8" fill="#7ee0a0"/><path d="M9 6l-2 5 3 2 1 4M9 6l3 3 2.5 .5M8 11l-2.5 5" stroke="#7ee0a0" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 film:'<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="4" width="14" height="10" rx="2" stroke="#7ee0a0" stroke-width="1.7" fill="none"/><path d="M7.5 7v4l3.5-2z" fill="#7ee0a0"/></svg>',
 metro:'<svg width="18" height="18" viewBox="0 0 18 18"><rect x="4" y="2.5" width="10" height="11" rx="3" stroke="#5aa8ff" stroke-width="1.7" fill="none"/><path d="M4 8.5h10M6 16l1.5-2.5M12 16l-1.5-2.5" stroke="#5aa8ff" stroke-width="1.7" stroke-linecap="round"/></svg>',
 train:'<svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 12.5V7c0-2.5 2-4.5 6-4.5s6 2 6 4.5v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 12.5z" stroke="#5aa8ff" stroke-width="1.7" fill="none"/><path d="M3.5 8.5h11M6 16.5l1.2-2.5M12 16.5l-1.2-2.5" stroke="#5aa8ff" stroke-width="1.7" stroke-linecap="round"/></svg>',
 bus:'<svg width="18" height="18" viewBox="0 0 18 18"><rect x="3" y="3" width="12" height="11" rx="2.5" stroke="#ffb347" stroke-width="1.7" fill="none"/><path d="M3 9h12M6 16v-2M12 16v-2" stroke="#ffb347" stroke-width="1.7" stroke-linecap="round"/></svg>',
 ticket:'<svg width="18" height="18" viewBox="0 0 18 18"><path d="M2.5 6V4.5h13V6a2 2 0 0 0 0 4v3.5h-13V10a2 2 0 0 0 0-4z" stroke="#ffb347" stroke-width="1.6" fill="none"/></svg>',
 mtn:'<svg width="18" height="18" viewBox="0 0 18 18"><path d="M1.5 15l5-8 3 4.5 2-3 5 6.5z" stroke="#7ee0a0" stroke-width="1.7" fill="none" stroke-linejoin="round"/></svg>',
 flag:'<svg width="18" height="18" viewBox="0 0 18 18"><path d="M4.5 16V2.5M4.5 3h9l-2 3 2 3h-9" stroke="#7ee0a0" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const STEPS=['影院','地铁','高铁','上山','登顶'];
$('steps').innerHTML=STEPS.map((s,i)=>`<div class="st" id="st${i}"><b></b>${s}</div>`).join('');

// ---------- labels ----------
const labs=[];
function label(world,txt,sub,opts={}){const el=document.createElement('div');el.className='lab'+(opts.minor?' minor':'');
  el.innerHTML=`<div class="p">${txt}${sub?`<small>${sub}</small>`:''}</div><div class="stem"></div>`;$('labels').appendChild(el);
  const L={el,world,set:opts.set,dy:opts.dy||0,from:opts.from??-1,to:opts.to??999};labs.push(L);return L;}
const tv=new THREE.Vector3();
function drawLabels(set,t){for(const L of labs){if(L.set!==set||t<L.from||t>L.to){L.el.style.display='none';continue;}
  tv.copy(typeof L.world==='function'?L.world():L.world);tv.project(camera);
  if(tv.z>1||tv.z<-1){L.el.style.display='none';continue;}
  const x=(tv.x+1)/2*390,y=(1-tv.y)/2*844+L.dy;if(x<-60||x>450||y<160||y>860){L.el.style.display='none';continue;}
  L.el.style.display='block';L.el.style.left=x+'px';L.el.style.top=y+'px';
  L.el.style.opacity=Math.min(sm(L.from,L.from+.4,t),1-sm(L.to-.3,L.to,t));}}
// city
label(()=>CITY.hotel.clone().setY(17),'异国印象酒店','湘江中路 · 出发',{set:'city',to:13.2});
label(()=>CITY.cinema.clone().setY(9),'万达影城','IMAX厅 · 19:40',{set:'city',to:13.2});
label(()=>CITY.ifs.clone().setY(66),'IFS 国金中心','',{set:'city',minor:1});
label(V(-46,0,-40),'湘江','',{set:'city',minor:1});
label(V(-47,0,40),'橘子洲','',{set:'city',minor:1});
label(()=>CITY.metro.clone().setY(2),'湘江中路站','地铁2号线',{set:'city',from:25.6});
label(()=>CITY.south.clone().setY(7),'长沙南站','约 23 分钟',{set:'city',from:27.2});
// region
const rH=(p,o)=>V(p.x,region.H(p.x,p.z)+o,p.z);
label(rH(REG.cs,2),'长沙南','07:52 发车',{set:'reg'});
label(rH(REG.hs,2),'衡山西','08:20 到达',{set:'reg'});
label(rH(REG.zz,1),'株洲','',{set:'reg',minor:1});
label(V(-48,26,78),'南岳衡山','',{set:'reg',minor:1});
// mountain
const mo=(p,o)=>mtn.onT(p,o);
label(mo(mtn.STA,4),'衡山西站','高铁到达 08:20',{set:'mtn'});
label(mo(mtn.VC,3),'游客服务中心','购票 · 环保车起点',{set:'mtn'});
label(mo(mtn.NT,6),'南天门','海拔约 1100 m',{set:'mtn'});
label(mo(V(0,0,0),7),'祝融峰','海拔 1300.2 m',{set:'mtn',to:73.8});

// ---------- cinema seat map ----------
const gC=$('gridC');const cX=c=>18+(c-1)*21.2+(c>4?8:0)+(c>12?8:0);const cY=r=>236+r*36;
const cTaken=new Set();{let h=5;CROWS.forEach((R,r)=>{for(let c=1;c<=CCOLS;c++){h=(h*9301+49297)%233280;if(h/233280<(r>=4&&r<=8&&c>=5&&c<=12?.55:.3))cTaken.add(r+'-'+c);}});}
cTaken.delete('6-9');
const cEl={};
CROWS.forEach((R,r)=>{const n=document.createElement('div');n.className='rown';n.style.cssText=`left:2px;top:${cY(r)+3}px;width:14px`;n.textContent=R;gC.appendChild(n);
  for(let c=1;c<=CCOLS;c++){const d=document.createElement('div');const b=cTaken.has(r+'-'+c)?'tk':'av';d.dataset.base=b;d.className='seat '+b;d.style.cssText=`left:${cX(c)}px;top:${cY(r)}px;width:17px;height:17px;border-radius:5px`;gC.appendChild(d);cEl[r+'-'+c]=d;}});
{const b=document.createElement('div');b.className='best';b.style.cssText=`left:${cX(5)-5}px;top:${cY(4)-5}px;width:${cX(12)-cX(5)+27}px;height:${cY(8)-cY(4)+27}px`;gC.appendChild(b);}
// ---------- train seat map ----------
const gT=$('gridT');const TROWS=[...Array(17)].map((_,i)=>i+1),TCOLS=['A','B','C','D','F'];
const mX={A:78,B:116,C:154,D:244,F:282},mY=r=>232+(r-1)*27.5,zY=z=>243+(z-EYEOFF)/PITCH*27.5;
const tTaken=new Set();{let h=19;for(const r of TROWS)for(const c of TCOLS){h=(h*9301+49297)%233280;if(h/233280<.5)tTaken.add(r+c);}}
['6F'].forEach(s=>tTaken.delete(s));['5F','7F','4F','8F','6D'].forEach(s=>tTaken.add(s));
const tEl={};
for(const c of TCOLS){const d=document.createElement('div');d.className='rown';d.style.cssText=`left:${mX[c]}px;top:212px;width:30px;font-size:10.5px;color:#6b6b71;font-weight:600`;d.textContent=c;gT.appendChild(d);}
for(const r of TROWS){const n=document.createElement('div');n.className='rown';n.style.cssText=`left:199px;top:${mY(r)+5}px;width:30px`;n.textContent=String(r).padStart(2,'0');gT.appendChild(n);
  for(const c of TCOLS){const d=document.createElement('div');const b=tTaken.has(r+c)?'tk':'av';d.dataset.base=b;d.className='seat '+b;d.style.cssText=`left:${mX[c]}px;top:${mY(r)}px;width:30px;height:22px`;gT.appendChild(d);tEl[r+c]=d;}}
{const y0=mY(1)-4,y1=mY(17)+26;for(const [list,x] of [[winL,62],[winR,318]]){const rl=document.createElement('div');rl.style.cssText=`position:absolute;left:${x}px;top:${y0}px;width:3px;height:${y1-y0}px;border-radius:2px;background:#232327`;gT.appendChild(rl);
  for(const w of list){let a=Math.max(zY(w-.55),y0),b=Math.min(zY(w+.55),y1);if(b-a<4)continue;const s=document.createElement('div');s.style.cssText=`position:absolute;left:${x}px;top:${a}px;width:3px;height:${b-a}px;border-radius:2px;background:#8fb7ff;opacity:.75`;gT.appendChild(s);}}}
const TSEAT={row:6,col:'F',eye:[0.45,1.24],turn:V(0.93,-0.07,-0.36)};

// ---------- helpers ----------
function tapAt(x,y,t,t0){const k=(t-t0)/0.45;if(k<0||k>1)return;const el=$('tap');el.style.left=(x-22)+'px';el.style.top=(y-22)+'px';el.style.opacity=(k<.25?1:1-(k-.25)/.75)*.9;el.style.transform=`scale(${.7+.5*k})`;}
const fmt=m=>{m=Math.round(m);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
const hm=s=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
const clockBetween=(t,a,b,ta,tb)=>fmt(lerp(hm(ta),hm(tb),eio(seg(t,a,b))));
let legKey='';
function setLeg(day,ico,title,sub,right,rsub,prog,step){const k=day+title+sub+right;if(k!==legKey){legKey=k;
  $('legDay').textContent=day;$('legIco').innerHTML=IC[ico];$('legT').textContent=title;$('legS').textContent=sub;$('legR').innerHTML=right+(rsub?`<small>${rsub}</small>`:'');}
  $('legBar').firstChild.style.width=(prog*100)+'%';
  for(let i=0;i<5;i++)$('st'+i).className='st'+(i<step?' done':i===step?' on':'');}
let sheetKey='';
function setSheet(tag,title,sub,stats,btn,tagc='#7ee0a0'){const k=title+btn;if(k===sheetKey)return;sheetKey=k;
  $('sTag').textContent=tag;$('sTag').style.color=tagc;$('sTitle').textContent=title;$('sSub').textContent=sub;
  $('stats').innerHTML=stats.map(x=>`<div class="stat"><div class="v">${x[0]}</div><div class="l">${x[1]}</div></div>`).join('');$('bMain').innerHTML=btn;}
const CHECK='<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" stroke="#0b2a18" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function bMainState(done){$('bMain').style.background=done?'#7ee0a0':'#f2f0ec';$('bMain').style.color=done?'#0b2a18':'#111';}
const press=(t,t0)=>{const k=seg(t,t0,t0+.25);return(k>0&&k<1)?1-.06*Math.sin(k*Math.PI):1;};
function sheetY(k){$('sheet').style.transform=`translateY(${(1-k)*300}px)`;}
function card(t,[a,b],kick,title,sub){const k=sm(a,a+.35,t)*(1-sm(b-.4,b,t));$('card').style.opacity=k;if(k>0){$('cardK').textContent=kick;$('cardT').textContent=title;$('cardS').textContent=sub;}return k;}
const camLook=(p,l,fov=40)=>{camera.position.copy(p);camera.up.set(0,1,0);camera.lookAt(l);camera.fov=fov;camera.updateProjectionMatrix();};

// ---------- summary ----------
const SUM=[['第1天 · 11月14日 周六'],['19:05','walk','酒店步行 1.2 km','19:20 到万达影城，开场前留 20 分钟'],['19:40','film','IMAX厅 · G排09座','最佳观影区正中'],
 ['第2天 · 11月15日 周日'],['06:55','metro','地铁2号线 → 长沙南','07:20 到站，发车前留 32 分钟'],['07:52','train','G6021 · 6车06F','整窗视野 · 08:20 衡山西'],
 ['08:25','bus','旅游专线 ¥6','约 20 分钟到游客服务中心'],['09:00','mtn','环保车 → 南天门','约 50 分钟 · 海拔约 1100 m'],['09:55','flag','步行 → 祝融峰','约 1 小时 · 海拔 1300.2 m']];
$('sum').innerHTML=SUM.map((r,i)=>r.length===1?`<div class="sd">${r[0]}</div>`:`<div class="sr" id="sr${i}"><div class="tm">${r[0]}</div><div class="ic">${IC[r[1]]}</div><div class="tx">${r[2]}<small>${r[3]}</small></div><div class="ck">✓</div></div>`).join('');

// ---------- frame ----------
window.renderFrame=function(t){
  $('tap').style.opacity=0;
  let active=null;
  // INTRO
  const introK=1-sm(3.4,4.0,t);$('intro').style.opacity=introK;$('intro').style.display=introK>0?'block':'none';
  $('go').style.transform=`scale(${press(t,2.9)})`;tapAt(195,768,t,2.9);
  // default UI states
  let legVis=0,sheetK=0;
  $('seatC').style.opacity=0;$('seatT').style.opacity=0;$('outro').style.opacity=0;$('card').style.opacity=0;
  renderer.clippingPlanes=[];let fadeK=0;

  if(t<T.city1[1]){ // ===== CITY 1 =====
    active='city';city.update(t,{dawn:0});
    city.r2.visible=city.r3.visible=false;city.r1.visible=true;
    const draw=eo(seg(t,4.2,5.8)),u=eio(seg(t,6.4,11.4));
    city.r1.material.uniforms.uDraw.value=draw;city.r1.material.uniforms.uProg.value=u;
    const mp=city.c1.getPointAt(Math.min(u,1));city.marker.position.copy(mp);
    const o0=V(-55,125,105),l0=V(-6,0,14);
    const fol=V(mp.x-16,mp.y+58,mp.z+46),lf=mp.clone();
    const k1=eio(seg(t,5.6,7.0));
    let p=o0.clone().lerp(V(-48,118,98),seg(t,3.6,6.4)).lerp(fol,k1),l=l0.clone().lerp(lf,k1);
    const k2=eio(seg(t,11.2,13.0));const ce=CITY.cinema;
    p.lerp(V(ce.x+22,ce.y+30,ce.z+40),k2);l.lerp(V(ce.x,3,ce.z),k2);
    camLook(p,l,40);
    legVis=sm(4,4.6,t);
    setLeg('第1天 · 11月14日 周六 · 晚','walk','步行 · 酒店 → 万达影城','约 1.2 km · 15 分钟 · 开场前留 20 分钟',clockBetween(t,6.4,11.4,'19:05','19:20'),'到达',u,0);
    $('clock').textContent=clockBetween(t,6.4,11.4,'19:05','19:20');
    fadeK=sm(12.6,13.2,t);
  }
  if(t>=T.cmap[0]&&t<T.cmap[1]){ // ===== CINEMA SEAT MAP =====
    const k=sm(12.9,13.3,t)*(1-sm(16.2,16.8,t));$('seatC').style.opacity=k;$('seatC').style.transform=`scale(${1+.06*sm(16.2,16.8,t)})`;
    const on=t>14.6+.12;for(const key in cEl)cEl[key].className='seat '+(on&&key==='6-9'?'sel':cEl[key].dataset.base);
    const kk=seg(t,14.6,14.95);cEl['6-9'].style.transform=(kk>0&&kk<1)?`scale(${1+.3*Math.sin(kk*Math.PI)})`:'';
    const bar=$('seatC').querySelector('.bar');bar.querySelector('.barL1').textContent=on?'IMAX厅 · 最佳观影区':'请选择座位';bar.querySelector('.barL2').textContent=on?'G排 09座':'—';
    bar.querySelector('.btn').className='btn'+(on?' on':'');bar.querySelector('.btn').style.transform=`scale(${press(t,15.9)})`;
    tapAt(cX(9)+8,cY(6)+8,t,14.6);tapAt(295,792,t,15.9);
    $('clock').textContent='19:20';
    if(t<13.2)fadeK=1-sm(12.9,13.2,t);
  }
  if(t>=T.cine[0]&&t<T.cine[1]){ // ===== CINEMA 3D =====
    active='cine';cine.update(t);
    const s=eio(seg(t,16.4,19.3));cine.pose(camera,6,9,s,t);
    legVis=sm(18.8,19.4,t)*(1-sm(23.8,24.3,t));
    setLeg('第1天 · 11月14日 周六 · 晚','film','IMAX厅 · G排09座','19:40 开场 · 散场约 22:00','19:40','开场',1,0);
    sheetK=eo(seg(t,19.6,20.2))*(1-sm(23.6,24.2,t));
    setSheet('视线正中 · 最佳观影区','G排 09座','万达影城 IMAX厅 · 11月14日 19:40',[['约 11 m','距银幕'],['0°','偏离中轴'],['约 88°','银幕横向视角']],t>22.8?CHECK+'已锁定 · G排09座':'锁定这个座位');
    bMainState(t>22.8);$('bMain').style.transform=`scale(${press(t,22.5)})`;tapAt(195,560+254,t,22.5);
    $('clock').textContent='19:20';
    fadeK=Math.max(1-sm(16.2,16.8,t),sm(24.0,24.6,t));
  }
  if(t>=T.card2[0]&&t<T.card2[1]){fadeK=1;card(t,T.card2,'第 2 天 · 11月15日 周日','长沙 → 衡山西','地铁 23 分钟 + 高铁 28 分钟');$('clock').textContent='06:55';}
  if(t>=T.city2[0]&&t<T.city2[1]){ // ===== CITY 2 (dawn) =====
    active='city';city.update(t,{dawn:.42});city.r1.visible=false;city.r2.visible=city.r3.visible=true;
    const u2=eio(seg(t,26.0,27.0)),u3=eio(seg(t,27.0,29.8));
    city.r2.material.uniforms.uDraw.value=1;city.r2.material.uniforms.uProg.value=u2;
    city.r3.material.uniforms.uDraw.value=eo(seg(t,26.6,28.0));city.r3.material.uniforms.uProg.value=u3;
    const mp=u3>0?city.c3.getPointAt(Math.min(u3,1)):city.c2.getPointAt(Math.min(u2,1));city.marker.position.copy(mp);
    const k=eio(seg(t,26.4,30.0));
    camLook(V(-60,56,60).lerp(V(70,150,200),k),V(-22,0,2).lerp(V(110,0,40),k),40);
    legVis=sm(25.8,26.3,t);
    setLeg('第2天 · 11月15日 周日 · 早','metro','步行 + 地铁2号线 → 长沙南','约 23 分钟 · 发车前留 32 分钟',clockBetween(t,26,29.8,'06:55','07:20'),'到站',eio(seg(t,26,29.8)),1);
    $('clock').textContent=clockBetween(t,26,29.8,'06:55','07:20');
    fadeK=Math.max(1-sm(25.6,26.0,t),sm(30.2,30.8,t));
  }
  if(t>=T.reg1[0]&&t<T.reg1[1]){ // ===== REGION before boarding =====
    active='reg';region.update(t);region.route.material.uniforms.uDraw.value=eo(seg(t,30.8,32.2));region.route.material.uniforms.uProg.value=0;region.placeTrain(0);
    const k=eio(seg(t,30.4,34));camLook(V(30,190,-150).lerp(V(24,170,-136),k),V(-2,0,8),40);
    legVis=1;setLeg('第2天 · 11月15日 周日 · 早','train','G6021 · 长沙南 → 衡山西','07:52 → 08:20 · 28 分钟 · 二等座 ¥71','07:52','发车',0,2);
    sheetK=eo(seg(t,31.6,32.2));
    setSheet('高铁 · 直达','G6021 长沙南 → 衡山西','11月15日 周日 · 参考票价，以 12306 为准',[['07:52','发车'],['28 分钟','车程'],['¥71','二等座']],'选座');bMainState(false);
    $('bMain').style.transform=`scale(${press(t,33.0)})`;tapAt(195,560+254,t,33.0);
    $('clock').textContent='07:21';
    fadeK=Math.max(1-sm(30.4,30.8,t),0);
  }
  if(t>=T.tmap[0]&&t<T.tmap[1]){ // ===== TRAIN SEAT MAP =====
    const k=sm(33.4,33.8,t)*(1-sm(36.6,37.2,t));$('seatT').style.opacity=k;$('seatT').style.transform=`scale(${1+.06*sm(36.6,37.2,t)})`;
    const on=t>34.8+.12;for(const key in tEl)tEl[key].className='seat '+(on&&key==='6F'?'sel':tEl[key].dataset.base);
    const kk=seg(t,34.8,35.15);tEl['6F'].style.transform=(kk>0&&kk<1)?`scale(${1+.25*Math.sin(kk*Math.PI)})`:'';
    const bar=$('seatT').querySelector('.bar');bar.querySelector('.barL1').textContent=on?'6车 · 06F · 靠窗':'请选择座位';bar.querySelector('.barL2').textContent=on?'¥71':'—';
    bar.querySelector('.btn').className='btn'+(on?' on':'');bar.querySelector('.btn').style.transform=`scale(${press(t,36.2)})`;
    tapAt(mX.F+15,mY(6)+11,t,34.8);tapAt(295,792,t,36.2);
    $('clock').textContent='07:22';
  }
  if(t>=T.train[0]&&t<T.train[1]){ // ===== TRAIN 3D =====
    active='train';train.update(t);renderer.clippingPlanes=[train.cutPlane];train.setSel3D('6F');
    const s=eio(seg(t,36.8,39.2)),turn=seg(t,39.0,40.4);train.pose(TSEAT,s,turn,t);
    legVis=sm(39,39.5,t)*(1-sm(44.6,45.1,t));
    setLeg('第2天 · 11月15日 周日 · 早','train','G6021 · 6车 06F','靠窗 · 整窗视野 · 28 分钟','08:20','到达',0,2);
    sheetK=eo(seg(t,40.2,40.8))*(1-sm(44.4,45,t));
    setSheet('整窗视野 · 正对车窗','06排 F座','G6021 · 6车 · 二等座',[['正对车窗','座位位置'],['F 座','靠窗'],['¥71','参考票价']],t>43.5?CHECK+'已预订 · 06F':'预订 · ¥71');
    bMainState(t>43.5);$('bMain').style.transform=`scale(${press(t,43.2)})`;tapAt(195,560+254,t,43.2);
    $('clock').textContent='07:23';
    fadeK=Math.max(1-sm(36.6,37.2,t),sm(44.8,45.4,t));
  }
  if(t>=T.reg2[0]&&t<T.reg2[1]){ // ===== REGION ride =====
    active='reg';region.update(t);region.route.material.uniforms.uDraw.value=1;const u=eio(seg(t,45.4,48.8));region.route.material.uniforms.uProg.value=u;region.placeTrain(u);
    const tp=region.train.position;camLook(V(tp.x+70,tp.y+110,tp.z-90),tp.clone().add(V(0,0,8)),40);
    legVis=1;setLeg('第2天 · 11月15日 周日 · 早','train','G6021 · 长沙南 → 衡山西','6车 06F · 136 km',clockBetween(t,45.4,48.8,'07:52','08:20'),'到达',u,2);
    $('clock').textContent=clockBetween(t,45.4,48.8,'07:52','08:20');
    fadeK=Math.max(1-sm(45.0,45.4,t),sm(49.0,49.6,t));
  }
  if(t>=T.card3[0]&&t<T.card3[1]){fadeK=1;card(t,T.card3,'08:20 · 衡山西','登顶祝融峰','旅游专线 → 环保车 → 步行');$('clock').textContent='08:20';}
  if(t>=T.mtn[0]&&t<T.mtn[1]){ // ===== MOUNTAIN =====
    active='mtn';
    const cloud=sm(68.5,72.5,t);mtn.update(t,{cloud});
    const U=(r,a,b)=>{r.material.uniforms.uDraw.value=1;r.material.uniforms.uProg.value=0;};
    mtn.bus.material.uniforms.uDraw.value=eo(seg(t,51.0,52.0));mtn.road.material.uniforms.uDraw.value=eo(seg(t,51.8,53.0));mtn.trail.material.uniforms.uDraw.value=eo(seg(t,52.8,53.6));
    const ub=eio(seg(t,54,57.4)),ur=eio(seg(t,59.0,67.4)),ut=eio(seg(t,67.6,73.4));
    mtn.bus.material.uniforms.uProg.value=ub;mtn.road.material.uniforms.uProg.value=ur;mtn.trail.material.uniforms.uProg.value=ut;
    let mp;if(t<58.5)mp=mtn.busC.getPointAt(Math.min(ub,1));else if(t<67.5)mp=mtn.roadC.getPointAt(Math.min(ur,1));else mp=mtn.trailC.getPointAt(Math.min(ut,1));
    mtn.marker.position.copy(mp);mtn.marker.visible=t<73.6;
    // camera
    const ov=V(260,150,250),ovL=V(40,10,40);
    const orb=a=>{const r=300,ang=.75+a*.25;return V(60+r*Math.sin(ang),150,60+r*Math.cos(ang));};
    let p=orb(seg(t,50.6,54)),l=ovL.clone();
    const fol=(back,up,side=0)=>{const q=mp.clone();return [V(q.x+back*.6+side,q.y+up,q.z+back),q];};
    const k1=eio(seg(t,53.4,54.4));let [fp,fl]=fol(70,62);p.lerp(fp,k1);l.lerp(fl,k1);
    if(t>=58.6){const [rp,rl]=fol(64,58,-14);const kk=eio(seg(t,58.6,59.6));p=p.lerp(rp,kk);l=l.lerp(rl,kk);}
    if(t>=67.4){const [tp,tl]=fol(42,36,-8);const kk=eio(seg(t,67.4,68.4));p=p.lerp(tp,kk);l=l.lerp(tl,kk);}
    let fov=40;
    if(t>=73.2){ // summit POV: look out over sea of clouds toward the sun
      const top=mtn.onT(V(1.5,0,1.5),15);const kk=eio(seg(t,73.2,75.6));
      const dirOut=V(.55,-.24,-.6).normalize();const look=top.clone().add(dirOut.clone().multiplyScalar(50));
      look.x+=3*Math.sin(t*.25);
      p=p.lerp(top,kk);l=l.lerp(look,kk);fov=lerp(40,62,kk);}
    camLook(p,l,fov);
    // leg card
    const A=mtn.alt(mp.y-.9);
    if(t<57.6){setLeg('第2天 · 11月15日 周日','bus','旅游专线 · 衡山西站 → 游客中心','¥6 · 约 20 分钟（2026年2月开通）',clockBetween(t,54,57.4,'08:25','08:50'),'到达',ub,3);$('clock').textContent=clockBetween(t,54,57.4,'08:25','08:50');}
    else if(t<59){setLeg('第2天 · 11月15日 周日','ticket','游客服务中心 · 购票','门票 ¥80（淡季）· 环保车往返 ¥78','09:00','上车',1,3);$('clock').textContent='08:55';}
    else if(t<67.6){setLeg('第2天 · 11月15日 周日','mtn','环保车 · 游客中心 → 南天门','约 50 分钟 · 盘山公路',Math.round(A)+' m','海拔',ur,3);$('clock').textContent=clockBetween(t,59,67.4,'09:00','09:50');}
    else if(t<73.8){setLeg('第2天 · 11月15日 周日','flag','步行 · 南天门 → 祝融峰','约 1 小时 · 爬升约 200 m',Math.round(A)+' m','海拔',ut,4);$('clock').textContent=clockBetween(t,67.6,73.4,'09:55','10:55');}
    else{setLeg('第2天 · 11月15日 周日','flag','祝融峰 · 已登顶','10:55 到达 · 午饭前可下山','1300.2 m','海拔',1,4);$('clock').textContent='10:55';}
    legVis=sm(50.8,51.3,t)*(1-sm(79.6,80.2,t));
    sheetK=eo(seg(t,75.6,76.2))*(1-sm(79.6,80.2,t));
    setSheet('南岳衡山最高峰','祝融峰 · 1300.2 m','11月15日 10:55 到达 · 来自游客中心约 2 小时',[['¥6','旅游专线'],['¥78','环保车往返'],['¥80','门票（淡季）']],t>78.5?CHECK+'已加入行程':'加入行程');
    bMainState(t>78.5);$('bMain').style.transform=`scale(${press(t,78.2)})`;tapAt(195,560+254,t,78.2);
    fadeK=1-sm(50.6,51.0,t);
  }
  if(t>=T.outro[0]){ // ===== OUTRO =====
    const k=sm(80,80.5,t);$('outro').style.opacity=k;
    SUM.forEach((r,i)=>{const e=$('sr'+i);if(!e)return;const kk=eo(seg(t,80.5+i*.18,81.0+i*.18));e.style.opacity=kk;e.style.transform=`translateY(${(1-kk)*10}px)`;
      e.querySelector('.ck').style.opacity=sm(82.6+i*.12,82.9+i*.12,t);});
    $('clock').textContent='10:55';legVis=0;
  }
  $('leg').style.opacity=legVis;$('leg').style.transform=`translateY(${(1-legVis)*-8}px)`;
  sheetY(window.NOSHEET?0:sheetK);
  $('fade').style.opacity=fadeK;
  $('grad').style.opacity=active==='city'||active==='reg'||active==='mtn'?1:0;
  // render
  const sc=active==='city'?city.scene:active==='cine'?cine.scene:active==='train'?train.scene:active==='reg'?region.scene:active==='mtn'?mtn.scene:null;
  canvas.style.opacity=sc?1:0;
  if(sc){renderer.render(sc,camera);drawLabels(active,t);}else drawLabels('none',t);
  return true;
};
window.ready=true;
