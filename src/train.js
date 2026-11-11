import * as THREE from '../three.module.js';
import { RoundedBoxGeometry } from '../RoundedBoxGeometry.js';
import {V,clamp,seg,eio,sm,bez} from './util.js';

const ROWS=[];for(let r=1;r<=17;r++)ROWS.push(r);
const COLS=['A','B','C','D','F'];
export const PITCH=0.98;
export const rowZ=r=>(r-1)*PITCH;
export const colX={A:-1.18,B:-0.72,C:-0.26,D:0.62,F:1.08};
const WL=-1.48,WR=1.38,Z0=-1.0,Z1=17.0;
export const EYEOFF=0.12;
// windows: left pillars centred on 05A eye, right windows centred on 08F eye
export const winL=[],winR=[];
for(let k=-6;k<12;k++){const a=rowZ(5)+EYEOFF+0.725+k*1.45;if(a>-0.25&&a<16.4)winL.push(a);const b=rowZ(6)+EYEOFF+k*1.45;if(b>-0.25&&b<16.4)winR.push(b);}

export const COLS_T=COLS, ROWS_T=ROWS;
export function buildTrain(camera){
const scene=new THREE.Scene();
const cutPlane=new THREE.Plane(new THREE.Vector3(0,-1,0),100);
const SPEED=24;
const SUN=V(0.55,0.42,-0.55).normalize();
const NOISE=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*vnoise(p);p*=2.03;a*=.5;}return v;}
const vec3 HAZE=vec3(.80,.85,.88);`;
// sky with mountain ridges
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uT:{value:0},uSun:{value:SUN}},
 vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:NOISE+`varying vec3 vDir;uniform float uT;uniform vec3 uSun;
 void main(){vec3 d=normalize(vDir);float sd=max(dot(d,uSun),0.);
  vec3 top=vec3(.30,.50,.80);vec3 col=mix(HAZE,top,pow(clamp(d.y*1.8,0.,1.),.55));
  if(d.y>0.){vec2 cu=d.xz/(d.y+.1)*.9+vec2(0.,-uT*.004);float ci=smoothstep(.5,.85,fbm(cu*vec2(1.,2.)));col=mix(col,vec3(1.),ci*.55*smoothstep(0.,.2,d.y));}
  col+=vec3(1.,.85,.6)*(pow(sd,6.)*.25+pow(sd,300.)*1.5);
  float a=atan(d.x,-d.z);float s=sign(d.x);
  // right: river side, layered misty mountains far
  if(d.x>0.){
    float r3=.045+.075*fbm(vec2(a*2.2-uT*.002,3.));if(d.y<r3)col=mix(col,vec3(.62,.70,.76),.75);
    float r2=.03+.05*fbm(vec2(a*3.5-uT*.004,7.));if(d.y<r2)col=mix(col,vec3(.44,.54,.58),.85);
    float r1=.012+.03*fbm(vec2(a*6.-uT*.008,11.));if(d.y<r1)col=vec3(.30,.40,.38);
  }else{
    float r2=.04+.07*fbm(vec2(a*3.-uT*.006,5.));if(d.y<r2)col=mix(col,vec3(.42,.52,.50),.8);
    float r1=.02+.06*fbm(vec2(a*6.+uT*.02,9.));if(d.y<r1)col=mix(vec3(.24,.36,.26),vec3(.32,.42,.34),fbm(vec2(a*40.,d.y*60.)));
  }
  if(d.y<0.)col=mix(col,HAZE,.0);
  gl_FragColor=vec4(col,1.);}`});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(900,48,32),skyMat));
// ground (scrolling)
const groundMat=new THREE.ShaderMaterial({uniforms:{uOff:{value:0},uSun:{value:SUN}},
 vertexShader:`varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:NOISE+`varying vec3 vP;uniform float uOff;uniform vec3 uSun;
 void main(){vec2 q=vec2(vP.x,vP.z-uOff);float dist=length(vP.xz-vec2(0.,8.));vec3 col;
  float ax=abs(vP.x+0.05);
  if(vP.x>26.&&vP.x<220.){ // river
    vec3 w1=vec3(.36,.50,.58),w2=vec3(.62,.72,.78);float rip=fbm(q*vec2(.25,.06));
    col=mix(w1,w2,smoothstep(.3,.8,rip)*.7+smoothstep(30.,200.,dist)*.5);
    col+=vec3(1.,.9,.7)*pow(fbm(q*vec2(.8,.15)+3.),6.)*2.*smoothstep(.2,.8,vP.x/dist);
  }else if(vP.x>=21.&&vP.x<=26.){col=vec3(.62,.58,.48);
  }else if(ax<1.9||abs(vP.x+5.)<1.9){ // ballast + rails
    float tx=ax<1.9?ax:abs(vP.x+5.);col=vec3(.42,.41,.40)*(.85+.3*hash(floor(q*12.)));
    if(tx<1.3&&fract(q.y/.6)<.35)col=vec3(.55,.53,.50);
    if(abs(tx-.72)<.04)col=vec3(.75,.75,.78);
  }else{
    vec2 cell=floor(q/vec2(16.,26.));float hc=hash(cell);
    vec3 a=mix(vec3(.36,.52,.24),vec3(.56,.62,.30),hc);if(hc>.78)a=vec3(.72,.66,.38);if(hc<.12)a=vec3(.22,.36,.20);
    float rows=.5+.5*sin(q.x*2.2+hc*20.);a*=.88+.16*rows;a*=.85+.3*fbm(q*.08);
    col=a;
  }
  col*=.75+.35*max(uSun.y,0.);
  col=mix(col,HAZE,1.-exp(-dist/320.));
  gl_FragColor=vec4(col,1.);}`});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),groundMat);ground.rotation.x=-Math.PI/2;ground.position.set(0,-1.15,8);scene.add(ground);

// lights
scene.add(new THREE.HemisphereLight(0xf4f6ff,0x5a5a55,1.15));
const sunL=new THREE.DirectionalLight(0xfff0dc,1.5);sunL.position.copy(SUN).multiplyScalar(10);scene.add(sunL);
for(let i=0;i<4;i++){const p=new THREE.PointLight(0xf6f8ff,3.5,0,2);p.position.set(0,2.15,i*4.5);scene.add(p);}

// trees (scrolling instanced)
const TREEN=320,TL=600;const trees=[];
let hs=3;const rnd=()=>{hs=(hs*9301+49297)%233280;return hs/233280;};
for(let i=0;i<TREEN;i++){let x;const k=rnd();
  if(k<.85)x=-(8+Math.pow(rnd(),1.4)*90);else x=9+rnd()*10;
  trees.push({x,z:rnd()*TL,s:(x>0?1.4:2.0)+rnd()*(x>0?1.2:3.0)});}
const gCone=new THREE.IcosahedronGeometry(1,1);gCone.scale(1,1.1,1);gCone.translate(0,1.7,0);
const gTrunk=new THREE.CylinderGeometry(.12,.15,.8,5);gTrunk.translate(0,.4,0);
const imCone=new THREE.InstancedMesh(gCone,new THREE.MeshStandardMaterial({color:0x3d6a3a,roughness:1,flatShading:true}),TREEN);
const imTrunk=new THREE.InstancedMesh(gTrunk,new THREE.MeshStandardMaterial({color:0x4a3a2a,roughness:1}),TREEN);
scene.add(imCone,imTrunk);
const tm=new THREE.Matrix4(),tq=new THREE.Quaternion(),tsv=V(1,1,1);
function updTrees(t){trees.forEach((tr,i)=>{const z=((tr.z+SPEED*t)%TL)-TL/2+8;tsv.set(tr.s*.8,tr.s,tr.s*.8);
  tm.compose(V(tr.x,-1.15,z),tq,tsv);imCone.setMatrixAt(i,tm);imTrunk.setMatrixAt(i,tm);});
  imCone.instanceMatrix.needsUpdate=true;imTrunk.instanceMatrix.needsUpdate=true;}
// catenary poles on left
const POLN=30,PL=600;const gPole=new THREE.BoxGeometry(.18,6.5,.18);gPole.translate(0,3.25,0);
const gArmP=new THREE.BoxGeometry(2.6,.08,.08);gArmP.translate(1.3,5.9,0);
const imPole=new THREE.InstancedMesh(gPole,new THREE.MeshStandardMaterial({color:0x8f9296}),POLN);
const imArm=new THREE.InstancedMesh(gArmP,new THREE.MeshStandardMaterial({color:0x8f9296}),POLN);scene.add(imPole,imArm);
function updPoles(t){for(let i=0;i<POLN;i++){const z=((i*20+SPEED*t)%PL)-PL/2+8;tm.makeTranslation(-3.1,-1.15,z);imPole.setMatrixAt(i,tm);imArm.setMatrixAt(i,tm);}
  imPole.instanceMatrix.needsUpdate=true;imArm.instanceMatrix.needsUpdate=true;}

// side walls with window cut-outs
function wallMatFor(list,side){const arr=list.slice();while(arr.length<14)arr.push(-99);
 return new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{uCut:{value:100},uWin:{value:arr}},
 vertexShader:`varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`varying vec3 vP;uniform float uCut;uniform float uWin[14];
 float rbox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
 void main(){if(vP.y>uCut)discard;
  float best=99.;for(int i=0;i<14;i++){float dz=vP.z-uWin[i];if(abs(dz)<abs(best))best=dz;}
  float e=rbox(vec2(best,vP.y-1.32),vec2(.55,.39),.11);
  if(e<0.)discard;
  vec3 col=vec3(.90,.90,.89)*(.62+.38*smoothstep(0.,2.2,vP.y));
  if(e<.045)col=vec3(.30,.31,.33);else if(e<.07)col=vec3(.78,.78,.78);
  if(vP.y<.75&&vP.y>.70)col*=.8;
  if(vP.y<.12)col=vec3(.25,.26,.28);
  gl_FragColor=vec4(col,1.);}`});}
const wallMats=[wallMatFor(winL),wallMatFor(winR)];
for(const [i,x] of [[0,WL],[1,WR]]){const w=new THREE.Mesh(new THREE.PlaneGeometry(Z1-Z0,2.35),wallMats[i]);w.rotation.y=Math.PI/2;w.position.set(x,1.175,(Z0+Z1)/2);scene.add(w);}
// outer body below sill (seen in cutaway)
const bodyMat=new THREE.MeshStandardMaterial({color:0xf2f3f5,roughness:.4});
for(const x of [WL-0.12,WR+0.12]){const b=new THREE.Mesh(new THREE.BoxGeometry(0.12,1.9,Z1-Z0+2),bodyMat);b.position.set(x,-0.2,(Z0+Z1)/2);scene.add(b);
  const st=new THREE.Mesh(new THREE.BoxGeometry(0.125,0.12,Z1-Z0+2),new THREE.MeshStandardMaterial({color:0xd8342c}));st.position.set(x,0.25,(Z0+Z1)/2);scene.add(st);}
// floor, ceiling
const floor=new THREE.Mesh(new THREE.PlaneGeometry(WR-WL,Z1-Z0),new THREE.MeshStandardMaterial({color:0x5d6066,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.set((WL+WR)/2,0.001,(Z0+Z1)/2);scene.add(floor);
const aisle=new THREE.Mesh(new THREE.PlaneGeometry(0.62,Z1-Z0),new THREE.MeshStandardMaterial({color:0x7a6e60,roughness:1}));aisle.rotation.x=-Math.PI/2;aisle.position.set(0.18,0.004,(Z0+Z1)/2);scene.add(aisle);
const ceil=new THREE.Mesh(new THREE.PlaneGeometry(WR-WL,Z1-Z0),new THREE.MeshStandardMaterial({color:0xf0f0ee,roughness:.8,side:THREE.DoubleSide}));ceil.rotation.x=Math.PI/2;ceil.position.set((WL+WR)/2,2.35,(Z0+Z1)/2);scene.add(ceil);
for(const x of [-0.45,0.8]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.02,Z1-Z0-0.4),new THREE.MeshBasicMaterial({color:0xffffff}));l.position.set(x,2.33,(Z0+Z1)/2);scene.add(l);}
// luggage racks
const rackMat=new THREE.MeshStandardMaterial({color:0xc9ccd1,roughness:.35,metalness:.5});
const rackGlass=new THREE.MeshStandardMaterial({color:0x9fb3c4,roughness:.1,transparent:true,opacity:.35});
for(const [x,s] of [[WL,1],[WR,-1]]){const sh=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.03,Z1-Z0-0.2),rackMat);sh.position.set(x+s*0.23,1.98,(Z0+Z1)/2);scene.add(sh);
  const lip=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.12,Z1-Z0-0.2),rackGlass);lip.position.set(x+s*0.46,2.03,(Z0+Z1)/2);scene.add(lip);}
// front wall with door + LED
const endMat=new THREE.MeshStandardMaterial({color:0xdcdcda,roughness:.7});
const front=new THREE.Mesh(new THREE.PlaneGeometry(WR-WL,2.35),endMat);front.position.set((WL+WR)/2,1.175,Z0);scene.add(front);
const door=new THREE.Mesh(new THREE.PlaneGeometry(0.8,1.9),new THREE.MeshStandardMaterial({color:0x8d949c,roughness:.3,metalness:.4}));door.position.set(0.18,0.95,Z0+0.01);scene.add(door);
const ledTex=(()=>{const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d');x.fillStyle='#120804';x.fillRect(0,0,512,64);x.fillStyle='#ff6a2a';x.font='700 36px "Noto Sans CJK SC"';x.textBaseline='middle';x.fillText('G6021  长沙南→衡山西  6车',16,34);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
const led=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.175),new THREE.MeshBasicMaterial({map:ledTex}));led.position.set(0.18,2.08,Z0+0.02);scene.add(led);
const back=front.clone();back.rotation.y=Math.PI;back.position.z=Z1;scene.add(back);

// seats
const seatList=[];for(const r of ROWS)for(const c of COLS)seatList.push({r,c,x:colX[c],z:rowZ(r)});
function part(geo,color,rough=0.9){const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:rough});
  const im=new THREE.InstancedMesh(geo,m,seatList.length);const mat=new THREE.Matrix4();const col=new THREE.Color(color);
  seatList.forEach((s,i)=>{mat.makeTranslation(s.x,0,s.z);im.setMatrixAt(i,mat);im.setColorAt(i,col);});
  im.userData.base=col.clone();scene.add(im);return im;}
const gCush=new RoundedBoxGeometry(0.44,0.13,0.48,3,0.05);gCush.translate(0,0.46,-0.02);
const gBack=new RoundedBoxGeometry(0.44,0.78,0.12,3,0.05);gBack.translate(0,0.39,0);gBack.rotateX(0.14);gBack.translate(0,0.5,0.22);
const gHead=new RoundedBoxGeometry(0.42,0.24,0.03,2,0.012);gHead.translate(0,0.64,-0.07);gHead.rotateX(0.14);gHead.translate(0,0.5,0.22);
const gTray=new RoundedBoxGeometry(0.34,0.24,0.02,2,0.01);gTray.translate(0,0.30,-0.07);gTray.rotateX(0.14);gTray.translate(0,0.5,0.22);
const gLeg=new THREE.BoxGeometry(0.3,0.36,0.06);gLeg.translate(0,0.2,0.05);
const gArm=new THREE.BoxGeometry(0.05,0.05,0.42);const gArmR=gArm.clone();gArm.translate(-0.235,0.66,0.0);gArmR.translate(0.235,0.66,0.0);
const pCush=part(gCush,0x2f5a8a),pBack=part(gBack,0x2a5182),pHead=part(gHead,0xf3f4f6,0.8),pTray=part(gTray,0x3d4148,0.5),pLeg=part(gLeg,0x2a2c30,0.5),pArm=part(gArm,0x4a4e57,0.5),pArmR=part(gArmR,0x4a4e57,0.5);
const SELC=new THREE.Color(0x63d68f);
let selIdx=-1;function setSelAmt(a){if(selIdx<0)return;for(const p of [pCush,pBack,pArm,pArmR]){p.setColorAt(selIdx,p.userData.base.clone().lerp(SELC,a));p.instanceColor.needsUpdate=true;}}
function setSel3D(id){selIdx=seatList.findIndex(s=>(s.r+s.c)===id);seatList.forEach((s,i)=>{const on=(s.r+s.c)===id;for(const p of [pCush,pBack,pArm,pArmR]){p.setColorAt(i,on?SELC:p.userData.base);p.instanceColor.needsUpdate=true;}});}

function pose(seat,s,turn,t){
  const sx=colX[seat.col],sz=rowZ(seat.row);
  const eye=V(seat.eye[0],seat.eye[1],sz+EYEOFF);
  const P0=V(sx*0.3,14,sz+0.6),P1=V(sx*0.8,6,sz+1.6),P2=V(sx,2.0,sz+0.5);
  const pos=bez(P0,P1,P2,eye,s);
  const w=sm(0.3,1,s);
  const d0=V(0,-1,-0.04).normalize(),d1=V(0,-0.06,-1).normalize();
  let dir=d0.clone().lerp(d1,w).normalize();
  const tw=eio(turn);setSelAmt(1-sm(0.75,0.95,s));
  dir=dir.lerp(seat.turn.clone().normalize(),tw).normalize();
  dir.x+=0.012*Math.sin(t*0.9)*w;dir.y+=0.008*Math.sin(t*0.7)*w;dir.normalize();
  const up=V(0,0,-1).lerp(V(0,1,0),w).normalize();
  // gentle train sway
  pos.y+=0.004*Math.sin(t*6.1)*w;pos.x+=0.003*Math.sin(t*3.3)*w;
  camera.position.copy(pos);camera.up.copy(up);camera.lookAt(pos.clone().add(dir));
  camera.fov=40+(74-40)*w;camera.updateProjectionMatrix();
  const cut=1.25+(6-1.25)*sm(0.72,0.97,s);
  cutPlane.constant=cut;wallMats.forEach(m=>m.uniforms.uCut.value=cut);
}


function update(t){skyMat.uniforms.uT.value=t;groundMat.uniforms.uOff.value=SPEED*t;updTrees(t);updPoles(t);}
return {scene,cutPlane,update,pose,setSel3D,setSelAmt};
}
