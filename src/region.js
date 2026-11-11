// Stylised regional map: 长沙南 (north) to 衡山西 (south) along the Wuhan–Guangzhou HSR. 1 unit ≈ 1 km, schematic.
import * as THREE from '../three.module.js';
import {V,NOISE,routeTube,pinMesh,makeNoise} from './util.js';
export const REG={cs:V(0,0,-62),zz:V(8,0,-20),hs:V(-14,0,66)};
export function buildRegion(){
  const scene=new THREE.Scene();
  const n=makeNoise(11);
  const H=(x,z)=>{let h=n(x*.03,z*.03)*3.0;
    const d=Math.hypot(x+48,z-78);h+=18*Math.exp(-d*d/(2*16*16))*(0.6+0.8*n(x*.12,z*.12)); // 衡山 massif to the SW of the station
    const rv=Math.abs(x-(-4+10*Math.sin(z*.03)));h*=Math.min(1,rv/6);return h;};
  const geo=new THREE.PlaneGeometry(260,300,200,230);geo.rotateX(-Math.PI/2);
  const pa=geo.attributes.position;for(let i=0;i<pa.count;i++){pa.setY(i,H(pa.getX(i),pa.getZ(i)));}geo.computeVertexNormals();
  const tm=new THREE.ShaderMaterial({uniforms:{},vertexShader:`varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:NOISE+`varying vec3 vP;varying vec3 vN;void main(){float l=.45+.55*max(dot(normalize(vN),normalize(vec3(-.5,.8,-.3))),0.);
      vec3 c=mix(vec3(.20,.27,.22),vec3(.36,.42,.30),fbm(vP.xz*.05));c=mix(c,vec3(.42,.46,.40),smoothstep(6.,16.,vP.y));
      float rv=abs(vP.x-(-4.+10.*sin(vP.z*.03)));if(rv<1.6&&vP.y<.4)c=vec3(.20,.30,.34);
      float f=fract(vP.x*.5)*fract(vP.z*.5);c*=.95+.05*step(.5,f);
      float d=length(vP.xz-vec2(0.,10.));c=mix(c*l,vec3(.80,.84,.88),smoothstep(90.,170.,d));
      gl_FragColor=vec4(c,1.);}`});
  scene.add(new THREE.Mesh(geo,tm));
  const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vD;void main(){vec3 d=normalize(vD);gl_FragColor=vec4(mix(vec3(.82,.86,.90),vec3(.42,.58,.82),pow(clamp(d.y,0.,1.),.5)),1.);}`}));scene.add(sky);
  const pts=[REG.cs,V(6,0,-40),REG.zz,V(10,0,5),V(2,0,35),REG.hs].map(p=>V(p.x,H(p.x,p.z)+1.2,p.z));
  const curve=new THREE.CatmullRomCurve3(pts);
  const route=routeTube(curve,{radius:.9,color:0x6fb6ff,dim:0x3a6fc0});scene.add(route);
  const marker=pinMesh(0x5aa8ff);marker.scale.setScalar(1.3);scene.add(marker);
  // train body: elongated capsule aligned with the curve
  const train=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.8,4,6,12),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3}));body.rotation.x=Math.PI/2;train.add(body);
  const stripe=new THREE.Mesh(new THREE.CapsuleGeometry(.83,3.7,6,12,1),new THREE.MeshStandardMaterial({color:0xd8342c}));stripe.rotation.x=Math.PI/2;stripe.scale.set(1,.25,1);stripe.position.y=-.1;train.add(stripe);
  scene.add(train);
  scene.add(new THREE.HemisphereLight(0xffffff,0x556655,1.2));const dl=new THREE.DirectionalLight(0xffffff,1.2);dl.position.set(-40,60,-20);scene.add(dl);
  for(const p of [REG.cs,REG.hs]){const m=pinMesh(0xffffff);m.position.set(p.x,H(p.x,p.z)+1.4,p.z);m.scale.setScalar(1.2);scene.add(m);}
  function placeTrain(u){const p=curve.getPointAt(Math.min(u,.999));const q=curve.getPointAt(Math.min(u+.002,1));train.position.copy(p).add(V(0,.5,0));train.lookAt(q.clone().add(V(0,.5,0)));marker.position.copy(p);}
  function update(t){route.material.uniforms.uT.value=t;marker.pulse(t);}
  return {scene,update,route,curve,placeTrain,H,train,marker};
}
