// Procedural cinema hall. Metres. Screen at z=0 facing +z.
import * as THREE from '../three.module.js';
import { RoundedBoxGeometry } from '../RoundedBoxGeometry.js';
import {V,NOISE,sm,bez} from './util.js';
export const CROWS='ABCDEFGHIJKL'.split('');
export const CCOLS=16;
export const cSeat=(r,c)=>{const gap=c>4?0.5:0;const gap2=c>12?0.5:0;return V((c-8.5)*0.58+gap+gap2-0.5,r*0.36,5.2+r*1.05);};
export function buildCinema(){
  const scene=new THREE.Scene();
  const W=22,D=20,H=10;
  // screen showing a misty mountain sunrise (teaser for chapter 3)
  const scrMat=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uOn:{value:1}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:NOISE+`varying vec2 vUv;uniform float uT,uOn;void main(){vec2 p=vUv;
      vec3 c=mix(vec3(1.,.72,.45),vec3(.35,.45,.70),p.y);c+=vec3(1.,.8,.5)*pow(max(0.,1.-length((p-vec2(.62,.42))*vec2(1.,1.8))*2.2),3.);
      for(int i=0;i<4;i++){float fi=float(i);float h=.62-.14*fi+.13*fbm(vec2(p.x*(2.2+fi*1.6)+fi*7.+uT*.004*(fi+1.),fi*3.));
        if(p.y<h)c=mix(mix(vec3(.62,.60,.70),vec3(.10,.12,.18),fi/3.),c,.25*(1.-fi/3.));}
      float cl=smoothstep(.45,.8,fbm(vec2(p.x*3.+uT*.03,p.y*6.)));c=mix(c,vec3(1.,.95,.9),cl*.5*smoothstep(.35,.1,p.y));
      gl_FragColor=vec4(c*uOn*1.15,1.);}`});
  const scrGeo=new THREE.CylinderGeometry(40,40,7.6,64,1,true,Math.PI-0.27,0.54);scrGeo.translate(0,4.6,40.6);
  // CylinderGeometry with open sector: center at origin; translate so arc front sits near z=0
  const scr=new THREE.Mesh(scrGeo,scrMat);scr.material.side=THREE.DoubleSide;scene.add(scr);
  // walls, floor
  const wallMat=new THREE.MeshStandardMaterial({color:0x1a1416,roughness:.95});
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,D+6),new THREE.MeshStandardMaterial({color:0x14100f,roughness:1}));fl.rotation.x=-Math.PI/2;fl.position.set(0,0,D/2);scene.add(fl);
  for(const s of [-1,1]){const w=new THREE.Mesh(new THREE.PlaneGeometry(D+6,H),wallMat);w.rotation.y=-s*Math.PI/2;w.position.set(s*W/2,H/2,D/2);scene.add(w);
    for(let i=0;i<6;i++){const l=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.6),new THREE.MeshBasicMaterial({color:0xffb070}));l.position.set(s*(W/2-.05),2.6+i*.2*0,4+i*3);scene.add(l);}}
  const bw=new THREE.Mesh(new THREE.PlaneGeometry(W,H),wallMat);bw.position.set(0,H/2,-1.2);scene.add(bw);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(W,D+6),wallMat);ceil.rotation.x=Math.PI/2;ceil.position.set(0,H+1,D/2);scene.add(ceil);
  // stadium steps
  const stepMat=new THREE.MeshStandardMaterial({color:0x221a1a,roughness:1});
  CROWS.forEach((_,r)=>{const p=cSeat(r,8);const s=new THREE.Mesh(new THREE.BoxGeometry(W,p.y+.01,1.05),stepMat);s.position.set(0,(p.y)/2,p.z+.1);scene.add(s);
    const strip=new THREE.Mesh(new THREE.BoxGeometry(W,.02,.03),new THREE.MeshBasicMaterial({color:0x5a3a20}));strip.position.set(0,p.y+.01,p.z-.42);scene.add(strip);});
  // seats
  const list=[];CROWS.forEach((_,r)=>{for(let c=1;c<=CCOLS;c++)list.push({r,c,p:cSeat(r,c)});});
  const gC=new RoundedBoxGeometry(.5,.12,.5,2,.04);gC.translate(0,.45,0);
  const gB=new RoundedBoxGeometry(.52,.75,.12,2,.05);gB.rotateX(-.15);gB.translate(0,.82,.27);
  const mk=(geo,col)=>{const im=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85}),list.length);const m=new THREE.Matrix4();
    list.forEach((s,i)=>{m.makeTranslation(s.p.x,s.p.y,s.p.z);im.setMatrixAt(i,m);im.setColorAt(i,new THREE.Color(col));});im.userData.base=new THREE.Color(col);scene.add(im);return im;};
  const pc=mk(gC,0x7a1f26),pb=mk(gB,0x8a2530);
  const SEL=new THREE.Color(0x63d68f);
  let selI=-1;
  function setSel(r,c,a=1){selI=list.findIndex(s=>s.r===r&&s.c===c);list.forEach((s,i)=>{for(const p of [pc,pb])p.setColorAt(i,i===selI?p.userData.base.clone().lerp(SEL,a):p.userData.base);});pc.instanceColor.needsUpdate=pb.instanceColor.needsUpdate=true;}
  // light: screen glow + dim house light
  scene.add(new THREE.HemisphereLight(0xffe2c8,0x100808,.35));
  const sl=new THREE.PointLight(0xffd0a0,60,0,1.6);sl.position.set(0,4.5,2);scene.add(sl);
  const sl2=new THREE.PointLight(0xffb080,20,0,1.6);sl2.position.set(0,8,18);scene.add(sl2);
  function pose(cam,r,c,s,t){
    const seat=cSeat(r,c);const eye=seat.clone().add(V(0,1.15,.05));
    const P0=V(0,24,20),P1=V(seat.x*.5,14,seat.z+6),P2=V(seat.x,3.5,seat.z+2.2);
    const pos=bez(P0,P1,P2,eye,s);
    const target=V(0,3.6,0);const look0=V(0,0,seat.z-2);
    const w=sm(.25,1,s);const look=look0.clone().lerp(target,w);
    look.x+=0.15*Math.sin(t*.5)*w;
    cam.position.copy(pos);cam.up.set(0,1,0);cam.lookAt(look);cam.fov=46+(72-46)*w;cam.updateProjectionMatrix();
    setSel(r,c,1-sm(.8,.97,s));
  }
  function update(t){scrMat.uniforms.uT.value=t;}
  return {scene,update,pose,setSel};
}
