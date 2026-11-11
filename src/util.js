import * as THREE from '../three.module.js';
export const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const seg=(t,a,b)=>clamp((t-a)/(b-a));
export const eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
export const eo=x=>1-Math.pow(1-x,3);
export const sm=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const lerp=(a,b,k)=>a+(b-a)*k;
export function bez(p0,p1,p2,p3,t){const u=1-t;return p0.clone().multiplyScalar(u*u*u).add(p1.clone().multiplyScalar(3*u*u*t)).add(p2.clone().multiplyScalar(3*u*t*t)).add(p3.clone().multiplyScalar(t*t*t));}
export function rng(seed){let h=seed;return()=>{h=(h*9301+49297)%233280;return h/233280;};}
export const NOISE=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*vnoise(p);p*=2.03;a*=.5;}return v;}`;
// JS value noise matching nothing in GLSL; used for terrain heights
export function makeNoise(seed){
  const hh=(x,y)=>{const v=Math.sin(x*127.1+y*311.7+seed*17.3)*43758.5453;return v-Math.floor(v);};
  const vn=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
    const a=hh(ix,iy),b=hh(ix+1,iy),c=hh(ix,iy+1),d=hh(ix+1,iy+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;};
  return (x,y)=>{let v=0,a=.5;for(let i=0;i<5;i++){v+=a*vn(x,y);x*=2.03;y*=2.03;a*=.5;}return v;};
}
// route tube with progress shader: draws dim full path up to uDraw, bright up to uProg
export function routeTube(curve,{radius=.6,color=0x7ee0a0,dim=0x2c5a3e,dash=0,segs=400}={}){
  const geo=new THREE.TubeGeometry(curve,segs,radius,8,false);
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,
    uniforms:{uDraw:{value:0},uProg:{value:0},uC:{value:new THREE.Color(color)},uD:{value:new THREE.Color(dim)},uDash:{value:dash},uT:{value:0},uA:{value:1}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float uDraw,uProg,uDash,uT,uA;uniform vec3 uC,uD;
    void main(){if(vUv.x>uDraw)discard;
      if(uDash>0.&&fract(vUv.x*uDash-uT)>.55)discard;
      vec3 c=vUv.x<uProg?uC:uD;float a=vUv.x<uProg?1.:.85;
      gl_FragColor=vec4(c*(vUv.x<uProg?1.25:1.),a*uA);}`});
  const m=new THREE.Mesh(geo,mat);m.renderOrder=20;return m;
}
export function pinMesh(color=0x7ee0a0){
  const g=new THREE.Group();
  const core=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));core.renderOrder=22;
  const halo=new THREE.Mesh(new THREE.SphereGeometry(1.7,20,14),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.35,depthWrite:false,depthTest:false}));
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.8,2.3,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false,depthTest:false}));
  ring.rotation.x=-Math.PI/2;halo.renderOrder=21;ring.renderOrder=21;g.add(core,halo,ring);g.userData={ring,halo};
  g.pulse=t=>{const k=(t*1.2)%1;ring.scale.setScalar(1+k*2.2);ring.material.opacity=.7*(1-k);};
  return g;
}
