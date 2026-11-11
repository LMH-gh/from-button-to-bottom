// Stylised Changsha riverside (night / dawn). 1 unit ≈ 20 m. Not survey-accurate.
import * as THREE from '../three.module.js';
import {V,rng,NOISE,routeTube,pinMesh} from './util.js';

export const CITY={
  hotel:V(-20,0,6),      // 异国印象酒店 · 湘江中路
  cinema:V(16,0,32),     // 万达影城 · 解放西路
  ifs:V(30,0,-6),
  metro:V(-26,0,-4),     // 湘江中路站
  south:V(150,0,60),     // 长沙南 (off to the east)
};
export function buildCity(){
  const scene=new THREE.Scene();
  const R=rng(7);
  // sky
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uDawn:{value:0}},
    vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vD;uniform float uDawn;void main(){vec3 d=normalize(vD);float h=clamp(d.y,0.,1.);
      vec3 n=mix(vec3(.10,.10,.16),vec3(.03,.03,.06),pow(h,.5));
      vec3 dw=mix(vec3(.95,.62,.45),vec3(.30,.40,.62),pow(h,.45));dw+=vec3(.5,.3,.1)*pow(max(dot(d,normalize(vec3(1.,.08,.3))),0.),8.);
      gl_FragColor=vec4(mix(n,dw,uDawn),1.);}`});
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),skyMat));
  scene.fog=new THREE.Fog(0x0c0c12,180,700);
  // ground + water
  const groundMat=new THREE.ShaderMaterial({uniforms:{uDawn:{value:0}},
    vertexShader:`varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:NOISE+`varying vec3 vP;uniform float uDawn;void main(){
      vec3 land=mix(vec3(.075,.078,.09),vec3(.42,.40,.40),uDawn);
      vec3 water=mix(vec3(.05,.10,.16),vec3(.45,.55,.68),uDawn);
      float riv=smoothstep(-31.,-30.,vP.x)*(1.-smoothstep(-62.,-61.,vP.x));
      riv=1.-step(-30.,vP.x); riv*=step(-64.,vP.x);
      float isle=1.-smoothstep(3.,3.6,length(vec2((vP.x+47.)/3.6,vP.z/80.))*3.);
      vec3 c=mix(land,water+.04*fbm(vP.xz*.08),riv);
      c=mix(c,mix(vec3(.07,.13,.09),vec3(.35,.48,.33),uDawn),isle*riv);
      if(vP.x<-64.)c=mix(vec3(.06,.09,.07),vec3(.30,.40,.30),uDawn)*(.8+.4*fbm(vP.xz*.03));
      float d=length(vP.xz);c=mix(c,mix(vec3(.05,.05,.08),vec3(.75,.62,.55),uDawn),smoothstep(250.,700.,d));
      gl_FragColor=vec4(c,1.);}`});
  const g=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),groundMat);g.rotation.x=-Math.PI/2;scene.add(g);
  // roads (lit lines)
  const roadMat=new THREE.MeshBasicMaterial({color:0x2a2c34});
  const roads=[[-26,0,4,400,'ns'],[0,24,400,3.2,'ew'],[0,-12,400,2.4,'ew'],[4,0,2.4,400,'ns'],[40,0,2.4,400,'ns'],[0,60,400,2.4,'ew'],[0,-48,400,2.4,'ew'],[76,0,2.4,400,'ns']];
  for(const [x,z,w,l] of roads){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),roadMat);m.rotation.x=-Math.PI/2;m.position.set(x===0?120:x,0.02,z===0?0:z);if(x===0)m.position.x=120;if(z!==0)m.position.z=z;scene.add(m);}
  const onRoad=(x,z)=>roads.some(([rx,rz,w,l])=>{if(rz===0)return Math.abs(x-rx)<w/2+2.5;return Math.abs(z-rz)<l/2+2.5;});
  // buildings
  const bGeo=new THREE.BoxGeometry(1,1,1);bGeo.translate(0,.5,0);
  const bMat=new THREE.ShaderMaterial({uniforms:{uDawn:{value:0}},
    vertexShader:`varying vec3 vP;varying vec3 vN;varying vec3 vC;varying vec3 vL;
      void main(){vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vP=w.xyz;vL=position;vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);vC=instanceColor;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:NOISE+`varying vec3 vP;varying vec3 vN;varying vec3 vC;varying vec3 vL;uniform float uDawn;void main(){
      float lit=.35+.65*max(dot(vN,normalize(vec3(.4,.8,.3))),0.);
      vec3 base=mix(vec3(.11,.115,.135),vec3(.62,.62,.64),uDawn)*lit*vC.x;
      if(vN.y<.5){vec2 q=vec2(vP.x+vP.z,vP.y)*vec2(1.4,1.6);vec2 f=fract(q);float on=step(.55,hash(floor(q)+vC.yz*13.));
        float win=step(.25,f.x)*step(f.x,.75)*step(.3,f.y)*step(f.y,.7);
        base+=win*on*mix(vec3(1.,.78,.45)*.55,vec3(0.),uDawn);}
      if(vN.y>.5)base*=1.15;
      float d=length(vP.xz-cameraPosition.xz);base=mix(base,mix(vec3(.05,.05,.08),vec3(.75,.65,.6),uDawn),smoothstep(200.,650.,d));
      gl_FragColor=vec4(base,1.);}`});
  const blds=[];
  for(let x=-24;x<260;x+=7)for(let z=-150;z<200;z+=7){
    const bx=x+R()*2,bz=z+R()*2;if(onRoad(bx,bz))continue;
    const near=[CITY.hotel,CITY.cinema,CITY.ifs].some(p=>Math.hypot(p.x-bx,p.z-bz)<9);if(near)continue;
    const far=Math.hypot(bx,bz);const h=1.5+R()*R()*(far<60?7:far<140?11:8);blds.push([bx,bz,4+R()*2,h,4+R()*2]);}
  // west bank low blocks near 岳麓山
  for(let i=0;i<120;i++){const x=-70-R()*120,z=-160+R()*340;blds.push([x,z,3+R()*2,1.5+R()*3,3+R()*2]);}
  const im=new THREE.InstancedMesh(bGeo,bMat,blds.length);const m4=new THREE.Matrix4();
  blds.forEach((b,i)=>{m4.compose(V(b[0],0,b[1]),new THREE.Quaternion(),V(b[2],b[3],b[4]));im.setMatrixAt(i,m4);im.setColorAt(i,new THREE.Color(.8+R()*.4,R(),R()));});
  scene.add(im);
  // hills west
  const hm=new THREE.MeshStandardMaterial({color:0x0f1813,roughness:1,flatShading:true});
  for(const [x,z,s] of [[-140,-40,40],[-120,40,30],[-170,80,45],[-110,-110,26]]){const h=new THREE.Mesh(new THREE.IcosahedronGeometry(s,2),hm);h.scale.y=.45;h.position.set(x,-s*.15,z);scene.add(h);}
  scene.add(new THREE.HemisphereLight(0x9aa6c8,0x202024,.6));const dl=new THREE.DirectionalLight(0xffffff,.8);dl.position.set(40,80,30);scene.add(dl);
  // hero buildings
  const hero=(p,w,h,d,col)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:col,roughness:.4,metalness:.2,emissive:col,emissiveIntensity:.25}));m.position.set(p.x,h/2,p.z);scene.add(m);return m;};
  const ifsA=hero(CITY.ifs,7,64,7,0x39404c),ifsB=hero(V(CITY.ifs.x+10,0,CITY.ifs.z+6),6,48,6,0x353b46);
  const hotelM=hero(CITY.hotel,6,16,8,0x2e6b4a);const cinM=hero(CITY.cinema,14,8,12,0x6a3b2e);
  // route 1: hotel -> cinema (walk)
  const c1=new THREE.CurvePath();
  const pts1=[V(-23,0,6),V(-26,0,6),V(-26,0,24),V(16,0,24),V(16,0,24.5)].map(p=>p.setY(.6));
  for(let i=0;i<pts1.length-1;i++)c1.add(new THREE.LineCurve3(pts1[i],pts1[i+1]));
  const r1=routeTube(c1,{radius:.55});scene.add(r1);
  // route 2: hotel -> metro (walk) then metro to 长沙南 (dashed, elevated arc)
  const c2=new THREE.CurvePath();const pts2=[V(-23,0,6),V(-26,0,6),V(-26,0,-4)].map(p=>p.setY(.6));
  for(let i=0;i<pts2.length-1;i++)c2.add(new THREE.LineCurve3(pts2[i],pts2[i+1]));
  const r2=routeTube(c2,{radius:.55});scene.add(r2);
  const c3=new THREE.CatmullRomCurve3([V(-26,.6,-4),V(20,6,-14),V(80,8,10),V(120,6,40),V(150,.6,60)]);
  const r3=routeTube(c3,{radius:.9,color:0x5aa8ff,dim:0x1e3a5a,dash:60});scene.add(r3);
  const southM=hero(CITY.south,40,6,14,0x3a4a66);
  const marker=pinMesh();marker.scale.setScalar(.9);scene.add(marker);
  function update(t,{dawn=0}={}){skyMat.uniforms.uDawn.value=dawn;groundMat.uniforms.uDawn.value=dawn;bMat.uniforms.uDawn.value=dawn;
    scene.fog.color.setRGB(.05+.7*dawn,.05+.6*dawn,.08+.55*dawn);
    for(const r of [r1,r2,r3])r.material.uniforms.uT.value=t*.6;marker.pulse(t);}
  return {scene,update,r1,r2,r3,c1,c2,c3,marker,hotelM,cinM,ifsA};
}
