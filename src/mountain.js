// Stylised 南岳衡山 massif. Procedural terrain, not a DEM. Altitude label = 100 m + y/Hs * 1200.2 m.
import * as THREE from '../three.module.js';
import {V,NOISE,routeTube,pinMesh,makeNoise,rng} from './util.js';
export function buildMountain(){
  const scene=new THREE.Scene();
  const n=makeNoise(5),R=rng(21);
  const H=(x,z)=>{const xr=x*.8+z*.35,zr=-x*.35+z*.8;const r2=(xr*xr)/(2*58*58)+(zr*zr)/(2*42*42);
    let h=62*Math.exp(-r2)+9*n(x*.05+3,z*.05)*Math.exp(-r2*.4)-3+6*n(x*.015,z*.015);
    const ridge=1-Math.abs(n(x*.035,z*.035)*2-1);h+=10*ridge*Math.exp(-r2*.6);
    return Math.max(h,0.2*n(x*.1,z*.1));};
  const Hs=H(0,0);
  const alt=y=>100+Math.max(0,y)/Hs*1200.2;
  const S=360,N=260;
  const geo=new THREE.PlaneGeometry(S,S,N,N);geo.rotateX(-Math.PI/2);geo.translate(60,0,60);
  const pa=geo.attributes.position;for(let i=0;i<pa.count;i++)pa.setY(i,H(pa.getX(i),pa.getZ(i)));geo.computeVertexNormals();
  const SUN=V(.55,.5,-.6).normalize();
  const tmat=new THREE.ShaderMaterial({uniforms:{uSun:{value:SUN}},
    vertexShader:`varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:NOISE+`varying vec3 vP;varying vec3 vN;uniform vec3 uSun;void main(){vec3 nn=normalize(vN);float l=.38+.75*max(dot(nn,uSun),0.);
      float f=fbm(vP.xz*.09);vec3 c=mix(vec3(.13,.25,.13),vec3(.24,.36,.18),f);
      c=mix(c,vec3(.55,.40,.22),smoothstep(.55,.75,fbm(vP.xz*.05+7.))*.45); // autumn patches
      c=mix(c,vec3(.46,.44,.40),smoothstep(.55,.3,nn.y)*.7);
      if(vP.y<1.5)c=mix(vec3(.50,.56,.38),vec3(.62,.58,.42),f);
      c*=l;float d=length(vP.xz-cameraPosition.xz);c=mix(c,vec3(.78,.84,.90),smoothstep(260.,620.,d)*.85);
      gl_FragColor=vec4(c,1.);}`});
  scene.add(new THREE.Mesh(geo,tmat));
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uSun:{value:SUN}},
    vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vD;uniform vec3 uSun;void main(){vec3 d=normalize(vD);float s=max(dot(d,uSun),0.);
      vec3 c=mix(vec3(.82,.87,.92),vec3(.32,.52,.82),pow(clamp(d.y,0.,1.),.5));c+=vec3(1.,.85,.6)*(pow(s,8.)*.3+pow(s,400.)*2.);gl_FragColor=vec4(c,1.);}`});
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1200,32,16),skyMat));
  scene.add(new THREE.HemisphereLight(0xf2f6ff,0x45503a,1.0));const dl=new THREE.DirectionalLight(0xfff0dc,1.6);dl.position.copy(SUN).multiplyScalar(100);scene.add(dl);
  // trees
  const tg=new THREE.ConeGeometry(.7,2.2,6);tg.translate(0,1.1,0);
  const TN=3000;const ti=new THREE.InstancedMesh(tg,new THREE.MeshStandardMaterial({color:0x2c5a2e,roughness:1,flatShading:true}),TN);
  const m4=new THREE.Matrix4();let k=0;
  while(k<TN){const x=-120+R()*300,z=-120+R()*300;const y=H(x,z);if(y<4||y>Hs-4)continue;const s=.7+R()*.8;
    m4.compose(V(x,y-.2,z),new THREE.Quaternion(),V(s,s,s));ti.setMatrixAt(k,m4);ti.setColorAt(k,new THREE.Color().setHSL(.28+R()*.08-(R()<.15?.2:0),.45,.18+R()*.12));k++;}
  scene.add(ti);
  // key points
  const STA=V(200,0,190),VC=V(118,0,96);
  // 南天门: walk from summit toward VC until 1100 m
  const dir=VC.clone().setY(0).normalize();let NT=V(0,0,0);
  for(let r=0;r<150;r+=.25){const x=dir.x*r,z=dir.z*r;if(alt(H(x,z))<=1100){NT=V(x,0,z);break;}}
  const onT=(p,o=.7)=>V(p.x,H(p.x,p.z)+o,p.z);
  // bus: station -> VC (flat, gentle curve)
  const busC=new THREE.CatmullRomCurve3([STA,V(176,0,170),V(150,0,128),VC].map(p=>onT(p,.9)));
  const bus=routeTube(busC,{radius:.6,color:0xffb347,dim:0x8a6a40,dash:40});scene.add(bus);
  // eco-bus road: switchbacks VC -> NT
  const rp=[];const ZN=7;
  const lat=V(-dir.z,0,dir.x);
  for(let i=0;i<=160;i++){const u=i/160;const base=VC.clone().lerp(NT,u);const A=(14-6*u)*Math.sin(u*Math.PI*ZN)*Math.min(1,u*8)*Math.min(1,(1-u)*8);
    rp.push(onT(base.clone().add(lat.clone().multiplyScalar(A)),.9));}
  const roadC=new THREE.CatmullRomCurve3(rp);
  const road=routeTube(roadC,{radius:.5,color:0x5aa8ff,dim:0x2f4f78,segs:900});scene.add(road);
  // hiking trail NT -> summit
  const hp=[];for(let i=0;i<=60;i++){const u=i/60;const b=NT.clone().lerp(V(0,0,0),u);b.add(lat.clone().multiplyScalar(3*Math.sin(u*Math.PI*3)*(1-u)));hp.push(onT(b,.8));}
  const trailC=new THREE.CatmullRomCurve3(hp);
  const trail=routeTube(trailC,{radius:.45,color:0x7ee0a0,dim:0x3c6a4c,dash:50,segs:400});scene.add(trail);
  // landmarks
  const stone=new THREE.MeshStandardMaterial({color:0x8a8178,roughness:.9});const roof=new THREE.MeshStandardMaterial({color:0x5a6a5e,roughness:.7});
  const temple=new THREE.Group();const tb=new THREE.Mesh(new THREE.BoxGeometry(5,3,4),stone);tb.position.y=1.5;const tr=new THREE.Mesh(new THREE.ConeGeometry(4.4,1.8,4),roof);tr.rotation.y=Math.PI/4;tr.scale.z=.8;tr.position.y=3.9;temple.add(tb,tr);
  temple.position.copy(onT(V(-2.5,0,-2.5),-.3));scene.add(temple);
  const gate=new THREE.Group();for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(1,4,1),stone);p.position.set(s*2,2,0);gate.add(p);}
  const lin=new THREE.Mesh(new THREE.BoxGeometry(6,1,1.4),roof);lin.position.y=4.4;gate.add(lin);gate.position.copy(onT(NT,-.2));gate.lookAt(onT(V(0,0,0),-.2).setY(gate.position.y));scene.add(gate);
  const stationM=new THREE.Mesh(new THREE.BoxGeometry(18,3,7),new THREE.MeshStandardMaterial({color:0xdfe3e8,roughness:.4}));stationM.position.copy(onT(STA,1.5));stationM.rotation.y=-.7;scene.add(stationM);
  const vcM=new THREE.Mesh(new THREE.BoxGeometry(8,2.4,6),new THREE.MeshStandardMaterial({color:0xb9a27a,roughness:.6}));vcM.position.copy(onT(VC,1.2));scene.add(vcM);
  // sea of clouds
  const cloudMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:0},uA:{value:0}},
    vertexShader:`varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:NOISE+`varying vec3 vP;uniform float uT,uA;void main(){float f=fbm(vP.xz*.025+vec2(uT*.01,0.))*1.1+fbm(vP.xz*.08-vec2(uT*.02,0.))*.35;
      float a=smoothstep(.45,.85,f)*uA;float d=length(vP.xz);a*=smoothstep(30.,70.,d);
      vec3 c=mix(vec3(.88,.90,.95),vec3(1.,.97,.92),f);gl_FragColor=vec4(c,a);}`});
  const clouds=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400,1,1),cloudMat);clouds.rotation.x=-Math.PI/2;clouds.position.y=Hs*.52;clouds.renderOrder=8;scene.add(clouds);
  const clouds2=clouds.clone();clouds2.material=cloudMat.clone();clouds2.position.y=Hs*.47;scene.add(clouds2);
  const marker=pinMesh();marker.scale.setScalar(1.1);scene.add(marker);
  function update(t,{cloud=0}={}){for(const r of [bus,road,trail])r.material.uniforms.uT.value=t*.6;marker.pulse(t);
    cloudMat.uniforms.uT.value=t;cloudMat.uniforms.uA.value=cloud;clouds2.material.uniforms.uT.value=t*1.3+40;clouds2.material.uniforms.uA.value=cloud*.8;}
  return {scene,update,H,Hs,alt,STA,VC,NT,busC,roadC,trailC,bus,road,trail,marker,onT};
}
