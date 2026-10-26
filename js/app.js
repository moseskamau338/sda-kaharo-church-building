(function(){
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed=1234567;
function rand(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const R=(a,b)=>a+rand()*(b-a);

// ---------- renderer / scene ----------
const host=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(45,1,0.1,1200);
const controls=new THREE.OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=0.08;controls.screenSpacePanning=false;controls.panSpeed=1.4;controls.keyPanSpeed=30;
if(controls.listenToKeyEvents)controls.listenToKeyEvents(window);

function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
function speckle(g,x,y,w,h,n,a){for(let k=0;k<n;k++){g.fillStyle=`rgba(${rand()<.5?'40,32,24':'255,250,240'},${rand()*a})`;g.fillRect(x+rand()*w,y+rand()*h,2,2);}}

const sky=canvasTex(2,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#78a9d3');gr.addColorStop(.5,'#c3d8e6');gr.addColorStop(1,'#eef0ea');g.fillStyle=gr;g.fillRect(0,0,w,h);});
sky.wrapS=sky.wrapT=THREE.ClampToEdgeWrapping;scene.background=sky;
scene.fog=new THREE.Fog(0xe2e8e6,140,420);

// Textures (canvas sizes map to real metres)
const stoneTex=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#d6cebd';g.fillRect(0,0,w,h);const rh=h/4,cw=w/4;
  for(let r=0;r<4;r++){const off=(r%2)*cw/2;for(let c=-1;c<=4;c++){const x=c*cw+off;g.fillStyle=`hsl(${R(34,44)},${R(20,34)}%,${R(60,72)}%)`;g.fillRect(x+3,r*rh+3,cw-6,rh-6);speckle(g,x+3,r*rh+3,cw-8,rh-8,60,.14);}}});
stoneTex.repeat.set(1/1.8,1/0.8);
// marble-look porcelain, 600 x 1200 mm, canvas = 1.2 x 1.2 m
const marbleTex=canvasTex(1024,1024,(g,w,h)=>{for(let k=0;k<2;k++){const x0=k*512;g.save();g.beginPath();g.rect(x0,0,512,1024);g.clip();
  g.fillStyle=`hsl(${R(34,42)},${R(10,18)}%,${R(88,91)}%)`;g.fillRect(x0,0,512,1024);
  for(let v=0;v<9;v++){g.strokeStyle=`rgba(${R(110,150)},${R(105,140)},${R(100,130)},${R(.08,.28)})`;g.lineWidth=R(1,4);g.beginPath();let sx=x0+R(-100,600),sy=R(-50,1050);g.moveTo(sx,sy);for(let s=0;s<4;s++){g.bezierCurveTo(sx+R(-160,160),sy+R(-200,200),sx+R(-160,160),sy+R(-200,200),sx+=R(-150,150),sy+=R(-260,260));}g.stroke();}
  speckle(g,x0,0,512,1024,900,.05);g.restore();}
  g.fillStyle='#c9c1b4';g.fillRect(0,0,w,3);g.fillRect(0,0,3,h);g.fillRect(512,0,3,h);});
const terrazzoTex=canvasTex(1024,1024,(g,w,h)=>{g.fillStyle='#ddd6ca';g.fillRect(0,0,w,h);
  const chips=['#f6f3ec','#f6f3ec','#a39d94','#6f6a64','#2f2d2b','#b77a58','#c9bfae'];
  for(let k=0;k<9000;k++){g.fillStyle=chips[Math.floor(rand()*chips.length)];const x=rand()*w,y=rand()*h,r=R(1,5.5);g.beginPath();g.moveTo(x+r,y);for(let a=1;a<6;a++)g.lineTo(x+Math.cos(a*1.05+R(-.3,.3))*r*R(.6,1.2),y+Math.sin(a*1.05)*r*R(.6,1.2));g.fill();}
  g.fillStyle='#b8913a';g.fillRect(0,0,w,3);g.fillRect(0,0,3,h);});
const floorTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#c9c6c0';g.fillRect(0,0,w,h);speckle(g,0,0,w,h,3000,.12);g.fillStyle='#a9a59d';for(let p=0;p<w;p+=170){g.fillRect(p,0,2,h);g.fillRect(0,p,w,2);}});
const wallTileTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#f3f4f2';g.fillRect(0,0,w,h);g.fillStyle='#d4d8d6';[0,128].forEach(p=>{g.fillRect(p,0,2,h);g.fillRect(0,p,w,2);});});
wallTileTex.repeat.set(1/0.6,1/0.6);
const paveTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#9a9286';g.fillRect(0,0,w,h);const rh=64,cw=128;for(let r=0;r<8;r++){const off=(r%2)*cw/2;for(let c=-1;c<=4;c++){const x=c*cw+off;const dark=rand()<.12;g.fillStyle=dark?`hsl(30,8%,${R(42,50)}%)`:`hsl(${R(32,40)},${R(18,28)}%,${R(66,74)}%)`;g.fillRect(x+2,r*rh+2,cw-4,rh-4);speckle(g,x,r*rh,cw,rh,30,.1);}}});
const drivewayTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#55524d';g.fillRect(0,0,w,h);const rh=64,cw=128;for(let r=0;r<8;r++){const off=(r%2)*cw/2;for(let c=-1;c<=4;c++){const x=c*cw+off;g.fillStyle=`hsl(${R(20,30)},${R(4,9)}%,${R(36,46)}%)`;g.fillRect(x+2,r*rh+2,cw-4,rh-4);speckle(g,x,r*rh,cw,rh,30,.1);}}});
const grassTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#5f8a3f';g.fillRect(0,0,w,h);for(let k=0;k<4000;k++){g.fillStyle=`hsl(${R(80,105)},${R(35,50)}%,${R(28,44)}%)`;g.fillRect(rand()*w,rand()*h,2,3);}});
const gravelTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#a79d90';g.fillRect(0,0,w,h);for(let k=0;k<5000;k++){g.fillStyle=`hsl(${R(20,40)},${R(5,15)}%,${R(45,75)}%)`;g.fillRect(rand()*w,rand()*h,2,2);}});
const roofTex=canvasTex(4,32,(g,w,h)=>{for(let y=0;y<h;y++){const v=0.5+0.5*Math.sin(y/h*Math.PI*2);const c=Math.round(48+v*30);g.fillStyle=`rgb(${c},${c+6},${c+10})`;g.fillRect(0,y,w,1);}});
function roofMat(len){const t=roofTex.clone();t.needsUpdate=true;t.repeat.set(1,len/0.19);return new THREE.MeshStandardMaterial({map:t,roughness:.55,metalness:.35});}

const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o));
const mat={
  stone:M(0xffffff,{map:stoneTex}), plaster:M(0xefe8dc), plinth:M(0xa8a196),
  fascia:M(0xf2efe9), frame:M(0x2b2f33,{roughness:.5,metalness:.4}),
  glass:M(0xa6cfe0,{transparent:true,opacity:.3,roughness:.05,metalness:.1,depthWrite:false}),
  glassDark:M(0x2a3a44,{roughness:.1,metalness:.5}), brass:M(0xb8913a,{metalness:.7,roughness:.3}),
  door:M(0x3b2b22,{roughness:.55,metalness:.35}), timberDoor:M(0x8a5a36),
  marble:M(0xffffff,{map:marbleTex,roughness:.5}), riser:M(0xe4ded4,{roughness:.6}),
  floorT:M(0xffffff,{map:floorTex,roughness:.8}), wallTile:M(0xffffff,{map:wallTileTex,roughness:.4}),
  timber:M(0x7a4e30), bench:M(0x6a3b24,{roughness:.6}), ceiling:M(0xd9bc93,{side:THREE.DoubleSide}),
  steel:M(0x5c636a,{metalness:.5,roughness:.5}), white:M(0xf7f5f0,{roughness:.3}), screen:M(0xfafafa,{emissive:0x2a2a2a}),
  lamp:M(0xfff2d0,{emissive:0xffcf80,emissiveIntensity:.9}), fabric:M(0x4f6b78), fabric2:M(0x9a6b4b), rug:M(0xb98a5c),
  pave:M(0xffffff,{map:paveTex}), drive:M(0xffffff,{map:drivewayTex}), grass:M(0xffffff,{map:grassTex}), gravel:M(0xffffff,{map:gravelTex}),
  concrete:M(0xc4bdb2), soil:M(0x5e3420), hedge:M(0x3f6b34,{flatShading:true}), dark:M(0x1d1f21,{roughness:.5}),
  chrome:M(0xcfd3d6,{metalness:.8,roughness:.25}), colstone:M(0xbfb197), tank:M(0x2a2c2e,{roughness:.6}),
  line:M(0xf4f4f0), blue:M(0x2f6db5), lam:M(0x3f7f86,{roughness:.5}), mirror:M(0xbcd3dc,{metalness:.7,roughness:.08}),
  red:M(0xc8322f), kidsMat:M(0x6fae9b)
};

function box(w,h,d,m,x,y,z,parent){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=true;b.receiveShadow=true;(parent||scene).add(b);return b;}
function boxR(x0,y0,z0,x1,y1,z1,m,parent){return box(x1-x0,y1-y0,z1-z0,m,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,parent);}
function flatRect(parent,x0,z0,x1,z1,y,m,s=1){const w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;const g=new THREE.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+cx)/s,(p.getZ(i)+cz)/s);const me=new THREE.Mesh(g,m);me.position.set(cx,y,cz);me.receiveShadow=true;parent.add(me);return me;}
function flatCircle(parent,cx,cz,r,y,m,s=1){const g=new THREE.CircleGeometry(r,48);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+cx)/s,(p.getZ(i)+cz)/s);const me=new THREE.Mesh(g,m);me.position.set(cx,y,cz);me.receiveShadow=true;parent.add(me);return me;}
function wallShape(o){const s=new THREE.Shape();s.moveTo(o.a,0);
  (o.doors||[]).slice().sort((p,q)=>p[0]-q[0]).forEach(d=>{s.lineTo(d[0],0);s.lineTo(d[0],d[2]);s.lineTo(d[1],d[2]);s.lineTo(d[1],0);});
  s.lineTo(o.b,0);s.lineTo(o.b,o.H);if(o.rise)s.lineTo((o.a+o.b)/2,o.H+o.rise);s.lineTo(o.a,o.H);
  (o.wins||[]).forEach(w=>{const p=new THREE.Path();p.moveTo(w[0],w[1]);p.lineTo(w[2],w[1]);p.lineTo(w[2],w[3]);p.lineTo(w[0],w[3]);s.holes.push(p);});
  return s;}
function extrude(shape,d,m){const me=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false}),m);me.castShadow=me.receiveShadow=true;return me;}
function wallZ(parent,o,zOut,inward,skins,base){const s=wallShape(o);let off=0;skins.forEach(([m,d])=>{const me=extrude(s,d,m);me.position.set(0,base,inward<0?zOut-off-d:zOut+off);parent.add(me);off+=d;});}
function wallX(parent,o,xOut,inward,skins,base){const s=wallShape(o);let off=0;skins.forEach(([m,d])=>{const me=extrude(s,d,m);me.rotation.y=-Math.PI/2;me.position.set(inward<0?xOut-off:xOut+off+d,base,0);parent.add(me);off+=d;});}

// ang: open door leaf (radians) hinged at u0
function fillOpening(parent,ax,c,u0,u1,y0,y1,kind,base,ang){
  const w=u1-u0,h=y1-y0,uc=(u0+u1)/2,yc=base+(y0+y1)/2;
  const put=(su,sy,sn,u,y,n,m)=>ax==='z'?box(su,sy,sn,m,u,y,c+n,parent):box(sn,sy,su,m,c+n,y,u,parent);
  if(kind==='win'){
    put(w,h,0.02,uc,yc,0,mat.glass).castShadow=false;
    const f=0.06,fd=0.16;
    put(w,f,fd,uc,base+y1-f/2,0,mat.frame);put(w,f,fd,uc,base+y0+f/2,0,mat.frame);
    put(f,h,fd,u0+f/2,yc,0,mat.frame);put(f,h,fd,u1-f/2,yc,0,mat.frame);
    if(w>1.0){const n=w>2?3:2;for(let i=1;i<n;i++)put(0.04,h,0.06,u0+i*w/n,yc,0,mat.frame);}
    if(h>1.5)put(w,0.04,0.06,uc,base+y0+h*0.68,0,mat.frame);
    if(h>1.0){const bars=Math.floor(w/0.15);for(let i=1;i<bars;i++)put(0.015,h,0.015,u0+i*w/bars,yc,0.06,mat.frame);}
    return;
  }
  const two=kind==='door2';
  if(!two&&ang){const pv=new THREE.Group();pv.rotation.y=ang;parent.add(pv);
    if(ax==='z'){pv.position.set(u0,0,c);box(w-0.03,h-0.02,0.05,mat.timberDoor,w/2,yc,0,pv);box(0.04,0.04,0.12,mat.chrome,w-0.12,base+1.0,0,pv);}
    else{pv.position.set(c,0,u0);box(0.05,h-0.02,w-0.03,mat.timberDoor,0,yc,w/2,pv);box(0.12,0.04,0.04,mat.chrome,0,base+1.0,w-0.12,pv);}
  } else {
    const leaves=two?2:1,lw=w/leaves;
    for(let i=0;i<leaves;i++){const lc=u0+lw*(i+.5);
      put(lw-0.03,h-0.02,0.06,lc,yc,0,two?mat.door:mat.timberDoor);
      if(two){put(lw-0.36,h*0.3,0.075,lc,base+y0+h*0.72,0,mat.glassDark);put(0.04,0.45,0.1,lc+(i?-1:1)*(lw/2-0.12),base+1.05,0,mat.brass);}
      else put(0.12,0.04,0.1,lc+lw/2-0.12,base+1.0,0,mat.chrome);}
  }
  put(w+0.12,0.08,0.2,uc,base+y1,0,mat.frame);put(0.06,h,0.2,u0,yc,0,mat.frame);put(0.06,h,0.2,u1,yc,0,mat.frame);
}
function chair(parent,x,z,rot,m,base){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;parent.add(g);
  box(0.46,0.05,0.46,m,0,base+0.45,0,g);box(0.46,0.5,0.05,m,0,base+0.72,-0.21,g);
  [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]].forEach(([a,b])=>box(0.04,0.45,0.04,mat.steel,a,base+0.225,b,g));return g;}
function rail(parent,x0,y0,z0,x1,y1,z1){const len=Math.hypot(x1-x0,y1-y0,z1-z0);const r=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,len,8),mat.chrome);r.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);r.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(x1-x0,y1-y0,z1-z0).normalize());r.castShadow=true;parent.add(r);
  [[x0,y0,z0],[x1,y1,z1]].forEach(([x,y,z])=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.9,8),mat.chrome);p.position.set(x,y-0.45,z);parent.add(p);});}

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0xd6e6f5,0x8a5a3a,0.62));
scene.add(new THREE.AmbientLight(0xffffff,0.12));
const sun=new THREE.DirectionalLight(0xfff1dc,0.95);
sun.position.set(38,62,23);sun.target.position.set(0,0,-7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-54,right:54,top:54,bottom:-54,near:1,far:200});sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.02;
scene.add(sun);scene.add(sun.target);

// ---------- ground ----------
function groundY(x,z){const dx=Math.max(0,Math.abs(x)-31),dz=Math.max(0,z-31,-45-z);const d=Math.hypot(dx,dz);if(d===0)return -0.05;
  let y=-0.05-d*0.12*(x>0?1.6:0.55);y+=Math.sin(x*0.045)*Math.cos(z*0.05)*Math.min(d/25,1)*2.2;
  const far=Math.min(Math.max((d-70)/90,0),1);y+=far*far*30*(0.6+0.4*Math.sin(x*0.021+z*0.017));return y;}
{const g=new THREE.PlaneGeometry(480,480,160,160);g.rotateX(-Math.PI/2);const p=g.attributes.position;const cols=[];
  const soil=new THREE.Color(0x96492a),farm=new THREE.Color(0x60803a),bush=new THREE.Color(0x3f5f2d),c=new THREE.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,groundY(x,z));const n=Math.sin(x*0.09)*Math.cos(z*0.07)+0.6*Math.sin((x+z)*0.13);
    if(n>0.45)c.copy(soil);else if(n<-0.6)c.copy(bush);else c.copy(farm).lerp(soil,Math.max(0,n)*0.6);cols.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));m.receiveShadow=true;scene.add(m);}
flatRect(scene,-30.5,-44.5,30.5,30.5,0,mat.grass,3);

// ---------- church (local: x across, z along, entrance at +z) ----------
const FL=0.45,BX=-6,BZ=-8,T=Math.tan(25*Math.PI/180),RISE=8*T;
const church=new THREE.Group();church.position.set(BX,0,BZ);scene.add(church);
const roofG=new THREE.Group();church.add(roofG);
const worldRoof=new THREE.Group();scene.add(worldRoof);
const two=[[mat.stone,0.1],[mat.plaster,0.1]];

boxR(-8.1,0,-14.1,8.1,FL,14.1,mat.plinth,church);
boxR(8,0,-14.1,13.1,FL,-7.9,mat.plinth,church);
flatRect(church,-9.2,-15.2,9.2,14,0.025,mat.concrete,1);
flatRect(church,9.2,-15.2,14.2,-6.8,0.025,mat.concrete,1);
flatRect(church,-7.8,-13.8,7.8,13.8,FL+0.004,mat.marble,1.2);
flatRect(church,8.0,-13.8,12.8,-8.2,FL+0.004,mat.marble,1.2);

// front wall — gable slits kept; logo plaque and name band are added once fonts load
const frontWins=[[-6.4,1.0,-4.4,2.4],[4.4,1.0,6.4,2.4],[-1.35,6.3,-1.05,8.0],[1.05,6.3,1.35,8.0],[-2.55,6.3,-2.25,7.3],[2.25,6.3,2.55,7.3]];
wallZ(church,{a:-8,b:8,H:6,rise:RISE,doors:[[-1.2,1.2,3.0]],wins:frontWins},14,-1,two,FL);
fillOpening(church,'z',13.9,-1.2,1.2,0,3.0,'door2',FL);
frontWins.forEach(w=>fillOpening(church,'z',13.9,w[0],w[2],w[1],w[3],'win',FL));

// back wall + side walls: two window variants
const winGroups={};
['std','wide'].forEach(kind=>{
  const g=new THREE.Group();church.add(g);winGroups[kind]=g;g.visible=kind==='std';
  const hw=kind==='wide'?1.2:0.7;
  const tall=c=>[c-hw,1.0,c+hw,4.4], clere=c=>[c-hw,4.9,c+hw,5.6];
  const backWins=[[-0.15,6.3,0.15,8.8],[-1.35,6.3,-1.05,8.0],[1.05,6.3,1.35,8.0],[-2.55,6.3,-2.25,7.3],[2.25,6.3,2.55,7.3],
    kind==='wide'?[-7.4,1.2,-5.4,4.4]:[-7.2,1.2,-5.8,4.4], kind==='wide'?[5.4,1.2,7.4,4.4]:[5.8,1.2,7.2,4.4]];
  wallZ(g,{a:-8,b:8,H:6,rise:RISE,wins:backWins},-14,1,two,FL);
  backWins.forEach(w=>fillOpening(g,'z',-13.9,w[0],w[2],w[1],w[3],'win',FL));
  const westWins=[...[6.5,2.5,-1.5,-9,-12].map(tall),[11.2,1.0,12.6,2.4],...[6.5,2.5,-1.5,-5,-9,-12].map(clere)];
  const eastWins=[...[6.5,-1.5,-5.5].map(tall),[11.2,1.0,12.6,2.4],...[6.5,2.5,-1.5,-5.5,-9,-12].map(clere)];
  wallX(g,{a:-14,b:14,H:6,doors:[[-5.9,-4.1,2.4]],wins:westWins},-8,1,two,FL);
  wallX(g,{a:-14,b:14,H:6,doors:[[1.6,3.4,2.4],[-10.9,-9.9,2.2]],wins:eastWins},8,-1,two,FL);
  westWins.forEach(w=>fillOpening(g,'x',-7.9,w[0],w[2],w[1],w[3],'win',FL));
  eastWins.forEach(w=>fillOpening(g,'x',7.9,w[0],w[2],w[1],w[3],'win',FL));
});
fillOpening(church,'x',-7.9,-5.9,-4.1,0,2.4,'door2',FL);
fillOpening(church,'x',7.9,1.6,3.4,0,2.4,'door2',FL);
fillOpening(church,'x',7.9,-10.9,-9.9,0,2.2,'door1',FL,1.3);

// side door landings + right-side ramp
boxR(-9.3,0,-6.1,-8.1,FL-0.15,-3.9,mat.concrete,church);
boxR(8.1,0,1.4,9.3,FL-0.15,3.6,mat.concrete,church);
{const r=box(1.2,0.08,4.0,mat.concrete,8.7,(FL-0.15)/2,5.6,church);r.rotation.x=Math.atan((FL-0.15)/4);}
rail(church,9.35,FL+0.75,3.6,9.35,0.9,7.6);

// partitions: mothers' room | foyer | media (doors shown open)
const pl=[[mat.plaster,0.12]];
wallZ(church,{a:-7.8,b:-3,H:3,wins:[[-6.6,0.9,-4.2,2.6]]},10.06,-1,pl,FL);
wallZ(church,{a:3,b:7.8,H:3,wins:[[4.2,1.0,6.6,2.4]]},10.06,-1,pl,FL);
fillOpening(church,'z',10,-6.6,-4.2,0.9,2.6,'win',FL);fillOpening(church,'z',10,4.2,6.6,1.0,2.4,'win',FL);
wallX(church,{a:10,b:13.8,H:3,doors:[[11.6,12.6,2.2]]},-2.94,-1,pl,FL);
wallX(church,{a:10,b:13.8,H:3,doors:[[11.6,12.6,2.2]]},3.06,-1,pl,FL);
fillOpening(church,'x',-3,11.6,12.6,0,2.2,'door1',FL,-1.3);
fillOpening(church,'x',3,11.6,12.6,0,2.2,'door1',FL,1.3);
boxR(-7.8,FL+3.0,10.0,7.8,FL+3.1,13.8,mat.plaster,roofG);

// vestry annex
wallZ(church,{a:8,b:13,H:3.3,wins:[[9.6,1.2,11.6,2.4]]},-14,1,two,FL);
wallZ(church,{a:8,b:13,H:3.3,doors:[[11.4,12.4,2.2]],wins:[[8.9,1.2,10.7,2.4]]},-8,-1,two,FL);
wallX(church,{a:-14,b:-8,H:3.3,wins:[[-12.2,1.2,-9.8,2.4]]},13,-1,two,FL);
fillOpening(church,'z',-13.9,9.6,11.6,1.2,2.4,'win',FL);fillOpening(church,'z',-8.1,8.9,10.7,1.2,2.4,'win',FL);
fillOpening(church,'x',12.9,-12.2,-9.8,1.2,2.4,'win',FL);fillOpening(church,'z',-8.1,11.4,12.4,0,2.2,'door2',FL);
boxR(8,FL+3.0,-13.9,12.9,FL+3.06,-8.1,mat.plaster,roofG);
{const r=box(6.0,0.06,6.8,roofMat(6.8),10.8,FL+3.55,-11,roofG);r.rotation.z=-Math.atan(0.5/5.6);box(0.04,0.22,6.8,mat.fascia,13.8,FL+3.25,-11,roofG);}

// ---------- roof, ceiling, trusses ----------
{const rm=roofMat(29.2);const L=8.8/Math.cos(25*Math.PI/180),yc=FL+6+(8-4.4)*T+0.18;
 [-1,1].forEach(s=>{const r=box(L,0.06,29.2,rm,s*4.4,yc,0,roofG);r.rotation.z=-s*25*Math.PI/180;
   box(0.05,0.28,29.2,mat.fascia,s*8.8,FL+6-0.8*T+0.08,0,roofG);
   [-14.62,14.62].forEach(z=>{const b=box(L,0.28,0.05,mat.fascia,s*4.4,yc-0.08,z,roofG);b.rotation.z=-s*25*Math.PI/180;});
   const ce=box(8.61,0.04,27.6,mat.ceiling,s*3.9,FL+6+3.9*T,0,roofG);ce.rotation.z=-s*25*Math.PI/180;});
 box(0.55,0.14,29.2,rm,0,FL+6+8*T+0.26,0,roofG);
 for(let z=-12;z<=12;z+=4){box(15.6,0.2,0.14,mat.steel,0,FL+6,z,roofG);box(0.14,3.6,0.14,mat.steel,0,FL+7.8,z,roofG);
   [-1,1].forEach(s=>{const st=box(4.3,0.1,0.1,mat.steel,s*1.95,FL+6.9,z,roofG);st.rotation.z=-s*Math.atan(1.8/3.9);});}
 [[-4,-6],[4,-6],[-4,-2],[4,-2],[-4,2],[4,2],[-4,6],[4,6],[0,-11],[0,-7]].forEach(([x,z])=>{const top=FL+6+(7.8-Math.abs(x))*T;
   box(0.02,top-(FL+4.75),0.02,mat.dark,x,(top+FL+4.75)/2,z,roofG);
   const l=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.32,0.32,20),mat.lamp);l.position.set(x,FL+4.6,z);roofG.add(l);});
 box(0.04,0.5,0.04,mat.dark,0,FL+5.65,-8,roofG);box(0.45,0.16,0.38,mat.white,0,FL+5.35,-8,roofG);
 // hung speakers keep the floor clear
 [-5.6,5.6].forEach(x=>{box(0.03,1.4,0.03,mat.dark,x,FL+5.3,-8,roofG);const sp=box(0.42,0.65,0.38,mat.dark,x,FL+4.3,-8.05,roofG);sp.rotation.x=-0.25;sp.rotation.y=x<0?0.3:-0.3;});
}
// daylight bouncing in through the windows (always on)
[[-5,-7],[5,-7],[-5,5],[5,5]].forEach(([x,z])=>{const p=new THREE.PointLight(0xf3f6fb,0.42,17);p.position.set(x,FL+3.2,z);church.add(p);});
const hallLights=[-8,0,7].map(z=>{const p=new THREE.PointLight(0xffe2b8,0.45,24);p.position.set(0,FL+4.4,z);church.add(p);return p;});

// ---------- porch with ramp ----------
boxR(-3.6,0,14,3.6,FL,17.6,mat.plinth,church);
flatRect(church,-3.6,14,3.6,17.6,FL+0.004,mat.marble,1.2);
boxR(-3.6,0,17.6,3.6,FL*2/3,17.9,mat.plinth,church);boxR(-3.6,0,17.9,3.6,FL/3,18.2,mat.plinth,church);
[-3.45,3.45].forEach(x=>rail(church,x,FL+0.9,17.3,x,0.9+0.05,18.4));
{const ramp=box(4.65,0.1,1.4,mat.concrete,5.9,FL/2-0.02,16.3,church);ramp.rotation.z=-Math.atan(FL/4.6);
 [15.6,17.0].forEach(z=>rail(church,3.8,FL+0.9,z,8.1,0.95,z));}
[-3.2,3.2].forEach(x=>box(0.45,3.4,0.45,mat.colstone,x,FL+1.7,17.2,church));
box(7.0,0.3,0.3,mat.fascia,0,FL+3.25,17.2,church);
{const L=3.8/Math.cos(25*Math.PI/180);const rm=roofMat(3.8);
 [-1,1].forEach(s=>{const r=box(L,0.06,3.8,rm,s*1.9,FL+3.45+1.9*T,15.9,roofG);r.rotation.z=-s*25*Math.PI/180;
   const b=box(L,0.24,0.05,mat.fascia,s*1.9,FL+3.38+1.9*T,17.8,roofG);b.rotation.z=-s*25*Math.PI/180;});}

// ---------- seating: benches or folding chairs ----------
const benchesG=new THREE.Group();church.add(benchesG);
const chairsG=new THREE.Group();church.add(chairsG);chairsG.visible=false;
function pew(x,z,L){box(L,0.05,0.42,mat.bench,x,FL+0.45,z,benchesG);const b=box(L,0.42,0.04,mat.bench,x,FL+0.76,z+0.21,benchesG);b.rotation.x=-0.12;
  [-L/2+0.08,0,L/2-0.08].forEach(lx=>box(0.05,0.45,0.42,mat.bench,x+lx,FL+0.225,z,benchesG));}
const rowZ=[];for(let r=0;r<15;r++)rowZ.push(-4.5+r*0.92);
rowZ.forEach(z=>{pew(-3.9,z,5.4);pew(3.9,z,5.4);});
{const pos=[];rowZ.forEach(z=>[-6.6,1.2].forEach(x0=>{for(let i=0;i<10;i++)pos.push([x0+0.27+i*0.54,z]);}));
 const d=new THREE.Object3D(),cushion=M(0x23395d,{roughness:.9});
 function inst(geo,m,per,fn){const im=new THREE.InstancedMesh(geo,m,pos.length*per);let k=0;pos.forEach(([x,z])=>fn(x,z,(px,py,pz,rx,sy)=>{d.position.set(px,py,pz);d.rotation.set(rx||0,0,0);d.scale.set(1,sy||1,1);d.updateMatrix();im.setMatrixAt(k++,d.matrix);}));im.castShadow=true;im.receiveShadow=true;chairsG.add(im);}
 inst(new THREE.BoxGeometry(0.46,0.07,0.44),cushion,1,(x,z,s)=>s(x,FL+0.47,z));
 inst(new THREE.BoxGeometry(0.44,0.4,0.06),cushion,1,(x,z,s)=>s(x,FL+0.82,z+0.23,-0.12));
 inst(new THREE.BoxGeometry(0.025,1,0.025),mat.steel,4,(x,z,s)=>{[-0.21,0.21].forEach(a=>{s(x+a,FL+0.23,z-0.18,0.1,0.46);s(x+a,FL+0.5,z+0.22,-0.08,1.0);});});
}

// ---------- stage (tiled) ----------
boxR(-5,FL,-13.8,5,FL+0.6,-8.5,mat.riser,church);
flatRect(church,-5,-13.8,5,-8.5,FL+0.603,mat.marble,1.2);
boxR(-2.5,FL,-8.5,2.5,FL+0.4,-8.2,mat.riser,church);boxR(-2.5,FL,-8.5,2.5,FL+0.2,-7.9,mat.riser,church);
[[-7.92,0.205],[-8.22,0.405],[-8.52,0.605]].forEach(([z,y])=>box(5.0,0.012,0.06,mat.dark,0,FL+y,z,church));
[-2.6,2.6].forEach(x=>rail(church,x,FL+1.1,-7.85,x,FL+1.5,-8.8));
for(let i=0;i<25;i++)box(0.12,5.4,0.06,mat.timber,-4.8+i*0.4,FL+0.6+2.7,-13.74,church);
box(4.14,2.39,0.04,mat.dark,0,FL+3.75,-13.68,church);box(4.0,2.25,0.05,mat.screen,0,FL+3.75,-13.66,church);
// pulpit: oak, panelled front with corner columns, wide slanted desk (laptop + books), gooseneck mic; logo added once loaded
const pulpitG=new THREE.Group();pulpitG.position.set(-2.6,FL+0.6,-9.3);church.add(pulpitG);
{const oak=M(0xb27b3f,{roughness:.55}),oakD=M(0x9a6630,{roughness:.55}),g=pulpitG;
 box(1.12,0.1,0.72,oakD,0,0.05,0,g);box(0.98,0.95,0.6,oak,0,0.575,0,g);
 [-0.5,0.5].forEach(x=>{box(0.11,0.95,0.11,oak,x,0.575,0.28,g);box(0.15,0.14,0.15,oakD,x,0.17,0.28,g);box(0.13,0.05,0.13,oakD,x,1.03,0.28,g);});
 [[0.62,0.9],[0.42,0.8],[0.42,0.26]].forEach(([w,y])=>box(w,0.022,0.02,oakD,0,y,0.31,g));
 box(0.66,0.6,0.012,oakD,0,0.53,0.302,g);box(0.62,0.56,0.014,oak,0,0.53,0.306,g);
 box(1.1,0.13,0.7,oak,0,1.11,0,g);box(1.24,0.045,0.8,oakD,0,1.19,0,g);
 const desk=new THREE.Group();desk.position.set(0,1.28,-0.02);desk.rotation.x=-0.14;g.add(desk);
 box(1.18,0.035,0.62,oak,0,0,0,desk);box(1.18,0.06,0.035,oakD,0,0.035,-0.3,desk); // board + book ledge
 const fr=box(1.2,0.15,0.045,oak,0,-0.02,0.32,desk);box(1.08,0.03,0.05,oakD,0,0.03,0.33,desk);
 [-0.6,0.6].forEach(x=>box(0.04,0.12,0.62,oak,x,-0.05,0,desk));
 boxR(-0.56,-0.12,-0.29,0.56,-0.02,0.29,oak,desk);
 // laptop (left) and open Bible (right)
 const lap=new THREE.Group();lap.position.set(-0.3,0.03,0.02);desk.add(lap);
 box(0.34,0.018,0.24,mat.steel,0,0,0,lap);const scr=box(0.34,0.23,0.012,mat.steel,0,0.11,-0.15,lap);scr.rotation.x=-0.25;
 const sc=box(0.31,0.2,0.004,M(0x22344a,{emissive:0x3a5a80,emissiveIntensity:.5}),0,0.11,-0.143,lap);sc.rotation.x=-0.25;
 box(0.22,0.02,0.3,M(0x5a1e1e),0.28,0.025,0.0,desk);[0.225,0.335].forEach(x=>{const pg=box(0.105,0.012,0.28,mat.white,x,0.04,0,desk);pg.rotation.z=x<0.28?0.06:-0.06;});
 // gooseneck microphone
 const mb=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.04,0.025,20),mat.dark);mb.position.set(0.02,0.03,0.2);desk.add(mb);
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0.02,0.04,0.2),new THREE.Vector3(0.02,0.22,0.19),new THREE.Vector3(0.02,0.37,0.08),new THREE.Vector3(0.02,0.42,-0.05)]);
 const neck=new THREE.Mesh(new THREE.TubeGeometry(curve,24,0.007,8),mat.dark);neck.castShadow=true;desk.add(neck);
 const head=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.012,0.09,16),mat.chrome);head.position.set(0.02,0.415,-0.09);head.rotation.x=Math.PI/2+0.4;desk.add(head);
 const foam=new THREE.Mesh(new THREE.SphereGeometry(0.022,14,10),mat.dark);foam.position.set(0.02,0.40,-0.135);desk.add(foam);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(0.016,0.004,6,16),M(0x2f9e5a,{emissive:0x2f9e5a,emissiveIntensity:.6}));ring.position.set(0.02,0.418,-0.06);ring.rotation.x=0.4;desk.add(ring);
}
box(2.0,0.85,0.8,mat.timber,0,FL+0.425,-6.9,church);box(2.06,0.03,0.42,mat.white,0,FL+0.86,-6.9,church);
// auditorium tip-up seats on the stage: 4 beam units of 3, one seat folded down
{const S=FL+0.6,fab=M(0x8f9297,{roughness:.95}),std=M(0x3a3d41,{roughness:.6});const SW=0.56,zc=-12.75;let n=0;
 [-2.625,-0.875,0.875,2.625].forEach(ux=>{const x0=ux-SW*1.5+0.04;
   box(SW*3+0.1,0.08,0.08,std,ux+0.04+SW*0.0,S+0.2,zc-0.12,church);
   [-0.6,0.68].forEach(o=>{box(0.08,0.2,0.08,std,ux+o,S+0.1,zc-0.12,church);box(0.26,0.02,0.36,std,ux+o,S+0.01,zc-0.06,church);});
   for(let i=0;i<=3;i++){const ax=x0+i*SW-0.04+(i===0?0:0);
     box(0.05,0.5,0.48,std,ax,S+0.42,zc+0.02,church);box(0.09,0.04,0.46,mat.timber,ax,S+0.69,zc+0.03,church);}
   for(let i=0;i<3;i++){const sx=x0+SW*(i+0.5)-0.04;
     const bk=box(SW-0.08,0.78,0.12,fab,sx,S+0.92,zc-0.2,church);bk.rotation.x=-0.12;
     box(SW-0.14,0.06,0.04,fab,sx,S+1.33,zc-0.25,church);
     const pv=new THREE.Group();pv.position.set(sx,S+0.42,zc-0.12);church.add(pv);
     const open=(n++===5);pv.rotation.x=open?0:-1.35;
     box(SW-0.1,0.1,0.46,fab,0,0.02,0.24,pv);box(SW-0.12,0.02,0.4,std,0,-0.04,0.24,pv);}
 });}

[-3.2,3.2].forEach(x=>{const w=box(0.5,0.25,0.35,mat.dark,x,FL+0.73,-9.0,church);w.rotation.x=0.4;});
[-4.3,-3.2,3.2,4.3].forEach(x=>box(0.15,0.09,0.02,mat.white,x,FL+0.35,-8.49,church));
[[-3,-10.5],[3,-10.5],[-1.5,-12],[1.5,-12]].forEach(([x,z])=>box(0.16,0.01,0.16,mat.white,x,FL+0.606,z,church));
[-12,-8,-4,0,4,8].forEach(z=>{box(0.02,0.1,0.16,mat.white,-7.79,FL+0.4,z,church);box(0.02,0.1,0.16,mat.white,7.79,FL+0.4,z,church);});

// piano corner (right of stage, pianist faces the pulpit)
box(0.42,0.75,1.4,mat.dark,5.95,FL+0.375,-11.9,church);
box(0.3,0.05,1.36,mat.white,6.27,FL+0.75,-11.9,church);box(0.12,0.02,1.36,mat.dark,6.2,FL+0.785,-11.9,church);
box(0.04,0.32,0.8,mat.dark,5.85,FL+1.0,-11.9,church);
box(0.36,0.48,0.75,mat.dark,6.85,FL+0.24,-11.9,church);
box(0.15,0.09,0.02,mat.white,7.79,FL+0.35,-12.6,church);

// children's corner (left of stage)
flatRect(church,-7.7,-13.3,-5.5,-9.6,FL+0.012,mat.kidsMat,1);
{const cols=[0x2f80c9,0xf2b632,0xd94a3a,0x3fa66b].map(c=>M(c,{roughness:.45}));let k=0;
 [-7.3,-6.7,-6.1].forEach(x=>{for(let i=0;i<6;i++){const z=-12.95+i*0.6;const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=Math.PI/2;church.add(g);const m=cols[k++%4];
   box(0.34,0.035,0.32,m,0,FL+0.3,0,g);const b=box(0.34,0.26,0.035,m,0,FL+0.47,-0.15,g);b.rotation.x=-0.1;
   [[-.15,-.13],[.15,-.13],[-.15,.13],[.15,.13]].forEach(([a,c])=>box(0.03,0.3,0.03,m,a,FL+0.15,c,g));}});}

// wheelchair spaces
{const tex=canvasTex(180,260,(g,w,h)=>{g.fillStyle='#2f6db5';g.fillRect(0,0,w,h);g.strokeStyle='#ffffff';g.fillStyle='#ffffff';g.lineWidth=10;g.lineCap='round';
   g.beginPath();g.arc(92,62,14,0,7);g.fill();g.beginPath();g.moveTo(88,88);g.lineTo(88,150);g.lineTo(130,150);g.lineTo(146,196);g.stroke();
   g.beginPath();g.moveTo(88,112);g.lineTo(120,112);g.stroke();g.beginPath();g.arc(84,176,34,-0.2,Math.PI*1.5,false);g.stroke();});
 tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;
 [-6.5,6.5].forEach(x=>{const g=new THREE.PlaneGeometry(0.9,1.3);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,M(0xffffff,{map:tex}));m.position.set(x,FL+0.012,-6.4);m.receiveShadow=true;church.add(m);});}

// mothers' room
box(2.0,0.42,0.8,mat.fabric,-5.4,FL+0.21,13.3,church);box(2.0,0.5,0.18,mat.fabric,-5.4,FL+0.62,13.68,church);
[-6.45,-4.35].forEach(x=>box(0.18,0.62,0.8,mat.fabric,x,FL+0.31,13.3,church));
chair(church,-7.1,10.7,Math.PI/2,mat.fabric2,FL);chair(church,-3.7,10.7,-Math.PI/2,mat.fabric2,FL);
boxR(-7.8,FL,11.0,-7.2,FL+0.9,12.8,mat.white,church);box(0.38,0.04,0.45,mat.chrome,-7.5,FL+0.92,12.3,church);
flatRect(church,-6.6,10.9,-4.2,12.8,FL+0.01,mat.rug,1);
// media & store
boxR(4.0,FL,10.15,6.8,FL+0.78,10.85,mat.timber,church);box(1.4,0.08,0.5,mat.dark,5.4,FL+0.82,10.5,church);
box(0.6,0.4,0.04,mat.dark,4.5,FL+1.0,10.3,church);
chair(church,5.0,11.3,Math.PI,mat.fabric,FL);chair(church,5.9,11.3,Math.PI,mat.fabric,FL);
boxR(7.25,FL,11.0,7.75,FL+2.0,13.6,mat.timber,church);
// clerk's desk (foyer)
box(1.6,0.76,0.6,mat.timber,1.6,FL+0.38,12.9,church);box(0.4,0.03,0.3,mat.dark,1.4,FL+0.775,12.85,church);
chair(church,1.6,13.45,Math.PI,mat.fabric,FL);
// vestry
boxR(10.6,FL,-12.6,11.4,FL+0.76,-11.0,mat.timber,church);
chair(church,11.95,-11.8,-Math.PI/2,mat.fabric2,FL);chair(church,10.0,-12.2,Math.PI/2,mat.fabric2,FL);chair(church,10.0,-11.4,Math.PI/2,mat.fabric2,FL);
boxR(8.1,FL,-13.7,9.5,FL+2.1,-13.1,mat.timber,church);boxR(8.1,FL,-12.9,8.6,FL+1.0,-11.3,mat.timber,church);
box(1.8,0.42,0.7,mat.fabric,9.8,FL+0.21,-8.75,church);box(1.8,0.48,0.16,mat.fabric,9.8,FL+0.6,-8.35,church);
flatRect(church,9.4,-13.0,12.4,-9.8,FL+0.01,mat.rug,1);

// ---------- compound (world coords) ----------
const W=scene;
// outside public road along the right (east) boundary
{const g=new THREE.PlaneGeometry(7,240,1,120);g.rotateX(-Math.PI/2);const p=g.attributes.position;
 for(let i=0;i<p.count;i++)p.setY(i,groundY(34+p.getX(i),-7+p.getZ(i))+0.06);g.computeVertexNormals();
 const m=new THREE.Mesh(g,M(0xa4552f,{roughness:1}));m.position.set(34,0,-7);m.receiveShadow=true;scene.add(m);}
flatRect(W,-16,9,4.6,17,0.04,mat.pave,1.2);                 // forecourt / drop-off
flatRect(W,4.6,9,30.5,13.5,0.04,mat.drive,1.2);             // single entrance: driveway
flatRect(W,4.6,13.5,30.5,15,0.041,mat.pave,1.2);            //   + footway alongside
flatRect(W,-19,-34,-16.4,11,0.04,mat.pave,1.2);             // step-free path: forecourt - side door - toilets
flatRect(W,-19,8,-16,11,0.04,mat.pave,1.2);
flatRect(W,-16.4,-13.9,-15.3,-12.1,0.04,mat.pave,1.2);
flatRect(W,-26.5,-34,-13,-31.6,0.04,mat.pave,1.2);          // toilet forecourt
flatRect(W,-16,-41.5,-13,-34,0.04,mat.pave,1.2);            // handwash + tank pad
flatRect(W,8.2,-17,10.6,-15.4,0.04,mat.pave,1.2);           // path to caretaker's house
flatRect(W,9,-33,10.6,-15.4,0.04,mat.pave,1.2);
flatCircle(W,-22,17,6,0.045,mat.pave,1.2);                  // resting garden
// parking on both sides of the entrance
flatRect(W,12,4,29.5,9,0.035,mat.gravel,2);
flatRect(W,12,15,29.5,20,0.035,mat.gravel,2);
flatRect(W,12,15,15.6,20,0.045,mat.blue,1);flatRect(W,15.6,15,19.2,20,0.046,M(0x3a78bd),1);
for(let i=0;i<=7;i++){const x=12+i*2.5;flatRect(W,x-0.05,4,x+0.05,9,0.05,mat.line,1);}
[12,15.6,19.2,21.7,24.2,26.7,29.2].forEach(x=>flatRect(W,x-0.05,15,x+0.05,20,0.05,mat.line,1));

{const p=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.2,0.5,28),mat.colstone);p.position.set(1,0.25,13.5);p.castShadow=true;scene.add(p);}

// ---------- toilet block, behind the church on the left: x -26..-16, z -41..-34 ----------
const tw=[[mat.stone,0.15],[mat.wallTile,0.05]];
boxR(-26,0,-41,-16,0.05,-34,mat.plinth);
flatRect(W,-25.8,-40.8,-16.2,-34.2,0.055,mat.floorT,1.2);
wallZ(W,{a:-26,b:-16,H:3,doors:[[-23.2,-22.2,2.1],[-20.9,-19.9,2.1],[-18.4,-17.4,2.1]],wins:[[-25.6,2.3,-23.8,2.7],[-16.9,2.3,-16.4,2.7]]},-34,-1,tw,0.05);
wallZ(W,{a:-26,b:-16,H:3,wins:[[-25.4,2.3,-21.8,2.7],[-19.0,2.3,-16.6,2.7]]},-41,1,tw,0.05);
wallX(W,{a:-41,b:-34,H:3,wins:[[-40.5,2.3,-38.8,2.7],[-35.4,2.3,-34.6,2.7]]},-26,1,tw,0.05);
wallX(W,{a:-41,b:-34,H:3,wins:[[-40.6,2.3,-39.2,2.7]]},-16,-1,tw,0.05);
wallX(W,{a:-40.8,b:-34.2,H:2.95},-21.45,-1,[[mat.wallTile,0.1]],0.05);
wallX(W,{a:-40.8,b:-34.2,H:2.95},-19.25,-1,[[mat.wallTile,0.1]],0.05);
wallZ(W,{a:-21.45,b:-19.35,H:2.95},-37.45,-1,[[mat.wallTile,0.1]],0.05);
fillOpening(W,'z',-34.1,-23.2,-22.2,0,2.1,'door1',0.05,1.2);
fillOpening(W,'z',-34.1,-20.9,-19.9,0,2.1,'door1',0.05,-1.2);
fillOpening(W,'z',-34.1,-18.4,-17.4,0,2.1,'door1',0.05,1.2);
[[-25.6,-23.8],[-16.9,-16.4]].forEach(([a,b])=>fillOpening(W,'z',-34.1,a,b,2.3,2.7,'win',0.05));
[[-25.4,-21.8],[-19.0,-16.6]].forEach(([a,b])=>fillOpening(W,'z',-40.9,a,b,2.3,2.7,'win',0.05));
[[-40.5,-38.8],[-35.4,-34.6]].forEach(([a,b])=>fillOpening(W,'x',-25.9,a,b,2.3,2.7,'win',0.05));
fillOpening(W,'x',-16.1,-40.6,-39.2,2.3,2.7,'win',0.05);
const quartz=M(0x2e2b28,{roughness:.25}), ledMat=M(0xffffff,{emissive:0xfff3dc,emissiveIntensity:1});
function wcG(x,z,rot){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);
  const b=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.15,0.4,16),mat.white);b.position.set(0.12,0.26,0);b.castShadow=true;g.add(b);
  box(0.44,0.03,0.38,mat.white,0.12,0.47,0,g);box(0.18,0.42,0.44,mat.white,-0.2,0.78,0,g);box(0.1,0.02,0.1,mat.chrome,-0.2,1.0,0,g);}
// modern vanity: quartz top, floating cabinet, vessel basins, wide mirror with LED strip
function vanity(wallPos,dir,a0,a1,n,alongZ){
  const d0=wallPos,d1=wallPos+dir*0.55,lo=Math.min(d0,d1),hi=Math.max(d0,d1);
  const R3=(p0,y0,q0,p1,y1,q1,m)=>alongZ?boxR(p0,y0,q0,p1,y1,q1,m):boxR(q0,y0,p0,q1,y1,p1,m);
  R3(lo,0.83,a0,hi,0.88,a1,quartz);R3(lo,0.5,a0+0.05,hi-0.03,0.83,a1-0.05,mat.timber);
  const mw=Math.min(d0,d0+dir*0.015),mx=Math.max(d0,d0+dir*0.015);
  R3(mw,1.1,a0,mx,2.0,a1,mat.mirror);R3(mw,2.04,a0,mx+dir*0.02*0,2.08,a1,ledMat);
  for(let i=0;i<n;i++){const ac=a0+(i+.5)*(a1-a0)/n;const bowl=new THREE.Mesh(new THREE.CylinderGeometry(0.21,0.16,0.14,24),mat.white);
    const pd=wallPos+dir*0.3;alongZ?bowl.position.set(pd,0.95,ac):bowl.position.set(ac,0.95,pd);bowl.castShadow=true;scene.add(bowl);
    const tp=wallPos+dir*0.08,sp=wallPos+dir*0.16;
    alongZ?box(0.03,0.32,0.03,mat.chrome,tp,1.04,ac):box(0.03,0.32,0.03,mat.chrome,ac,1.04,tp);
    alongZ?box(0.16,0.03,0.03,mat.chrome,sp,1.19,ac):box(0.03,0.03,0.16,mat.chrome,ac,1.19,sp);}}
function cubiclesX(xs,zBack,zFront){for(let k=0;k<xs.length-1;k++){const x0=xs[k],x1=xs[k+1],xc=(x0+x1)/2;wcG(xc,zBack+0.32,-Math.PI/2);
    if(k>0)boxR(x0-0.02,0.2,zBack,x0+0.02,2.15,zFront,mat.lam);
    boxR(x0,0.2,zFront-0.02,xc-0.34,2.15,zFront+0.02,mat.lam);boxR(xc+0.34,0.2,zFront-0.02,x1,2.15,zFront+0.02,mat.lam);
    const pv=new THREE.Group();pv.position.set(xc-0.34,0,zFront);pv.rotation.y=0.9;scene.add(pv);box(0.66,1.9,0.03,mat.lam,0.33,1.2,0,pv);}
  boxR(xs[0],2.1,zFront-0.02,xs[xs.length-1],2.15,zFront+0.02,mat.lam);}
// ladies: 3 WCs, 2 basins
cubiclesX([-25.8,-24.4,-23.0,-21.55],-40.8,-39.0);
vanity(-25.8,1,-38.3,-35.3,2,true);
// gents: 2 WCs, 3 urinals, 2 basins
cubiclesX([-19.2,-17.8,-16.2],-40.8,-39.0);
vanity(-19.2,1,-38.4,-36.4,2,true);
[-38.3,-37.5,-36.7].forEach((z,i)=>{box(0.28,0.6,0.36,mat.white,-16.35,0.85,z);box(0.03,0.5,0.03,mat.chrome,-16.25,1.4,z);if(i)box(0.4,0.9,0.03,mat.lam,-16.42,1.1,z+0.4);});
boxR(-18.5,0.2,-35.0,-17.0,2.0,-34.96,mat.lam); // privacy screen inside the gents door
// accessible WC
wcG(-21.03,-36.9,0);
boxR(-21.35,0.78,-37.3,-21.31,0.82,-36.2,mat.chrome);boxR(-21.3,0.78,-36.42,-20.55,0.82,-36.38,mat.chrome);
boxR(-20.2,0.72,-37.35,-19.5,0.8,-37.0,mat.white);boxR(-20.2,1.0,-37.38,-19.5,1.7,-37.36,mat.mirror);
box(0.02,1.9,0.02,mat.red,-20.6,1.15,-36.0);
// outside handwash with one low basin (wheelchair users, children)
boxR(-16,0,-38.8,-15.5,0.85,-36.6,mat.white);boxR(-16,0.68,-36.4,-15.5,0.75,-35.4,mat.white);box(0.05,0.68,0.05,mat.steel,-15.55,0.34,-35.45);
[[-38.2,0.85],[-37.2,0.85],[-35.9,0.75]].forEach(([z,y])=>{box(0.36,0.02,0.42,mat.dark,-15.72,y+0.01,z);box(0.04,0.22,0.04,mat.chrome,-15.94,y+0.12,z);box(0.16,0.03,0.04,mat.chrome,-15.87,y+0.22,z);});
boxR(-16,1.15,-38.8,-15.98,1.8,-35.4,mat.mirror);
{const c=box(1.5,0.05,4.6,roofMat(1.5),-15.3,2.65,-37.1,worldRoof);c.rotation.z=-0.1;
 const r=box(10.8,0.06,7.8,roofMat(7.8),-21,3.28,-37.5,worldRoof);r.rotation.x=0.06;}
// water tank beside the toilets
[[-0.5,-0.5],[0.5,-0.5],[-0.5,0.5],[0.5,0.5]].forEach(([a,b])=>box(0.12,1.0,0.12,mat.steel,-13.9+a,0.5,-40.1+b));
boxR(-14.7,1.0,-40.9,-13.1,1.1,-39.3,mat.steel);
{const t=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,2.3,28),mat.tank);t.position.set(-13.9,2.25,-40.1);t.castShadow=true;scene.add(t);}

// ---------- caretaker's one-bedroom house: x 6.5..15, z -41.5..-34.5 ----------
const F2=0.3;
const houseTile=M(0xffffff,{map:canvasTex(256,256,(g,w,h)=>{g.fillStyle='#cdb89a';g.fillRect(0,0,w,h);speckle(g,0,0,w,h,800,.08);g.fillStyle='#b19c7e';[0,128].forEach(p=>{g.fillRect(p,0,2,h);g.fillRect(0,p,w,2);});}),roughness:.5});
boxR(6.5,0,-41.5,15,F2,-34.5,mat.plinth);boxR(6.5,0,-34.5,11.6,F2,-33,mat.plinth);
flatRect(W,6.6,-41.4,14.9,-34.6,F2+0.004,houseTile,0.8);flatRect(W,6.5,-34.5,11.6,-33,F2+0.004,houseTile,0.8);
const HR=3.5*T;
wallZ(W,{a:6.5,b:15,H:2.8,doors:[[8.0,9.0,2.1]],wins:[[6.9,1.0,7.7,2.1],[9.6,1.0,10.5,2.1],[11.8,1.0,13.8,2.1]]},-34.5,-1,two,F2);
wallZ(W,{a:6.5,b:15,H:2.8,doors:[[7.4,8.3,2.1]],wins:[[9.0,1.1,10.3,2.1],[12.6,1.7,13.6,2.2]]},-41.5,1,two,F2);
wallX(W,{a:-41.5,b:-34.5,H:2.8,rise:HR,wins:[[-40.6,1.1,-39.2,2.1],[-37.2,1.0,-35.6,2.1]]},6.5,1,two,F2);
wallX(W,{a:-41.5,b:-34.5,H:2.8,rise:HR,wins:[[-41.0,1.6,-40.2,2.2]]},15,-1,two,F2);
wallX(W,{a:-41.3,b:-34.7,H:2.8,doors:[[-37.4,-36.6,2.05]]},10.85,-1,[[mat.plaster,0.1]],F2);
wallZ(W,{a:10.85,b:14.8,H:2.8,doors:[[13.6,14.4,2.05]]},-38.45,-1,[[mat.plaster,0.1]],F2);
wallZ(W,{a:6.7,b:10.75,H:2.8,doors:[[7.2,8.8,2.1]]},-37.95,-1,[[mat.plaster,0.1]],F2);
fillOpening(W,'z',-34.6,8.0,9.0,0,2.1,'door1',F2,1.2);
fillOpening(W,'z',-41.4,7.4,8.3,0,2.1,'door1',F2);
fillOpening(W,'x',10.8,-37.4,-36.6,0,2.05,'door1',F2,1.2);
fillOpening(W,'z',-38.5,13.6,14.4,0,2.05,'door1',F2,1.2);
[[6.9,7.7,1.0,2.1],[9.6,10.5,1.0,2.1],[11.8,13.8,1.0,2.1]].forEach(([a,b,c,d])=>fillOpening(W,'z',-34.6,a,b,c,d,'win',F2));
[[9.0,10.3,1.1,2.1],[12.6,13.6,1.7,2.2]].forEach(([a,b,c,d])=>fillOpening(W,'z',-41.4,a,b,c,d,'win',F2));
[[-40.6,-39.2],[-37.2,-35.6]].forEach(([a,b],i)=>fillOpening(W,'x',6.6,a,b,i?1.0:1.1,2.1,'win',F2));
fillOpening(W,'x',14.9,-41.0,-40.2,1.6,2.2,'win',F2);
// living
boxR(6.75,F2,-37.4,7.55,F2+0.42,-35.4,mat.fabric);boxR(6.75,F2+0.42,-37.4,6.95,F2+0.85,-35.4,mat.fabric);
box(0.6,0.4,1.0,mat.timber,8.4,F2+0.2,-36.4);boxR(10.25,F2,-37.2,10.75,F2+0.5,-35.6,mat.timber);box(0.04,0.62,1.05,mat.dark,10.72,F2+1.2,-36.4);
flatRect(W,7.8,-37.4,9.6,-35.4,F2+0.01,mat.rug,1);
// kitchen
boxR(8.5,F2,-41.3,10.75,F2+0.9,-40.7,mat.white);boxR(8.5,F2+0.88,-41.3,10.75,F2+0.92,-40.68,quartz);
box(0.5,0.02,0.4,mat.chrome,9.5,F2+0.93,-41.0);box(0.55,0.02,0.5,mat.dark,10.3,F2+0.93,-41.0);
boxR(8.5,F2+1.5,-41.3,10.75,F2+2.2,-40.95,mat.timber);boxR(6.7,F2,-41.3,7.3,F2+1.75,-40.7,mat.chrome);
box(0.9,0.75,0.8,mat.timber,8.9,F2+0.375,-39.3);chair(W,8.9,-39.95,0,mat.fabric2,F2);chair(W,8.9,-38.65,Math.PI,mat.fabric2,F2);
// bedroom
boxR(12.85,F2,-37.3,14.8,F2+0.5,-35.9,mat.white);boxR(12.85,F2+0.5,-37.3,14.4,F2+0.56,-35.9,M(0x7b8fa0));
boxR(14.7,F2,-37.35,14.8,F2+1.1,-35.85,mat.timber);box(0.45,0.5,0.4,mat.timber,14.5,F2+0.25,-37.65);
boxR(11.0,F2,-38.4,12.6,F2+2.0,-37.8,mat.timber);flatRect(W,11.8,-37.6,12.8,-35.5,F2+0.01,mat.rug,1);
// bathroom
boxR(13.6,F2,-41.3,14.8,F2+0.05,-40.1,mat.white);boxR(13.58,F2,-40.12,14.8,F2+2.0,-40.08,mat.glass);
box(0.03,0.03,0.03,mat.chrome,14.6,F2+2.0,-40.7);box(0.04,0.04,0.25,mat.chrome,14.7,F2+1.9,-40.7);
wcG(12.6,-40.98,-Math.PI/2);
boxR(10.85,F2+0.8,-40.3,11.35,F2+0.88,-39.5,mat.white);boxR(10.85,F2+1.1,-40.3,10.87,F2+1.8,-39.5,mat.mirror);
// porch + roofs
[6.7,11.4].forEach(x=>box(0.15,2.5,0.15,mat.timber,x,F2+1.25,-33.15));
boxR(6.4,F2+2.5,-34.5,11.7,F2+2.58,-32.9,mat.fascia,worldRoof);
boxR(6.6,F2+2.8,-41.4,14.9,F2+2.84,-34.6,mat.plaster,worldRoof);
{const L=4.1/Math.cos(25*Math.PI/180);const rm=roofMat(9.7);
 [-1,1].forEach(s=>{const r=box(9.7,0.06,L,rm,10.75,F2+2.8+(3.5-2.05)*T+0.15,-38+s*2.05,worldRoof);r.rotation.x=s*25*Math.PI/180;
   box(9.7,0.22,0.05,mat.fascia,10.75,F2+2.8-0.6*T+0.08,-38+s*4.1,worldRoof);});
 box(9.7,0.12,0.4,rm,10.75,F2+2.8+HR+0.22,-38,worldRoof);}

// ---------- hedge and gate on the right (east) side ----------
[[-30,-44.4,30,-43.6],[-30,29.6,30,30.4],[-30.4,-44,-29.6,30],[29.6,-44,30.4,8.6],[29.6,15.4,30.4,30]].forEach(([x0,z0,x1,z1])=>boxR(x0,0,z0,x1,1.3,z1,mat.hedge));
[8.7,15.3].forEach(z=>{box(0.7,2.4,0.7,mat.colstone,30,1.2,z);box(0.85,0.12,0.85,mat.fascia,30,2.46,z);});
function gateLeaf(hz,rot,w){const g=new THREE.Group();g.position.set(30,0,hz);g.rotation.y=rot;scene.add(g);
  box(w,0.06,0.06,mat.frame,w/2,1.9,0,g);box(w,0.06,0.06,mat.frame,w/2,0.15,0,g);box(w,0.05,0.05,mat.frame,w/2,1.05,0,g);
  for(let i=0;i<=14;i++)box(0.03,1.75,0.03,mat.frame,i*w/14,1.025,0,g);}
gateLeaf(9.05,-Math.PI/2-1.15,2.9);gateLeaf(14.95,Math.PI/2+1.15,2.9);
box(0.12,1.3,4.4,M(0x22405f),30.85,1.9,4.6);[2.8,6.4].forEach(z=>box(0.12,1.3,0.12,mat.dark,30.85,0.65,z));

// resting garden
{const cx=-22,cz=17,H=2.8;[[-3,-3],[3,-3],[-3,3],[3,3]].forEach(([a,b])=>box(0.2,H,0.2,mat.timber,cx+a,H/2,cz+b));
 [-3,3].forEach(b=>box(7.0,0.24,0.14,mat.timber,cx,H+0.05,cz+b));
 for(let i=0;i<=11;i++)box(0.08,0.16,7.0,mat.timber,cx-3.3+i*0.6,H+0.25,cz);
 const boug=M(0xc8327a,{flatShading:true}),leaf=M(0x4a7a36,{flatShading:true});
 [[-3,-3],[3,3],[-3,3],[3,-3]].forEach(([a,b])=>{for(let k=0;k<4;k++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(R(0.5,0.85),0),k%2?boug:leaf);m.position.set(cx+a+R(-0.8,0.8),H+0.4+R(0,0.3),cz+b+R(-0.8,0.8));m.castShadow=true;scene.add(m);}});
 const pt=new THREE.Mesh(new THREE.CylinderGeometry(0.95,1.0,0.45,28),mat.colstone);pt.position.set(cx,0.225,cz);pt.castShadow=true;scene.add(pt);}
function parkBench(x,z,rot){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);
  for(let i=0;i<3;i++)box(1.8,0.04,0.12,mat.timber,0,0.45,-0.16+i*0.15,g);for(let i=0;i<2;i++)box(1.8,0.1,0.03,mat.timber,0,0.62+i*0.16,-0.24,g);
  [-0.85,0.85].forEach(a=>{box(0.05,0.45,0.45,mat.frame,a,0.225,0,g);box(0.05,0.45,0.04,mat.frame,a,0.68,-0.24,g);box(0.07,0.04,0.42,mat.frame,a,0.68,-0.02,g);});}
parkBench(-22,19.3,Math.PI);parkBench(-22,14.7,0);parkBench(-19.7,17,-Math.PI/2);parkBench(-24.3,17,Math.PI/2);
parkBench(-1,21.5,Math.PI);parkBench(-11.5,21.5,Math.PI);parkBench(-17.6,5,-Math.PI/2);parkBench(-12.5,-32.4,Math.PI);

function lamp(x,z){box(0.1,3.4,0.1,mat.frame,x,1.7,z);const h=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.26,0.36,12),mat.lamp);h.position.set(x,3.55,z);scene.add(h);box(0.5,0.05,0.5,mat.frame,x,3.76,z);}
[[4.4,8.6],[16,3.4],[24,3.4],[16,20.6],[24,20.6],[29,7.8],[29,16.2],[-15.5,16.3],[-16,22],[-28,17],[-19.4,-4],[-19.4,-14],[-19.4,-24],[-19.4,-31],[11,-22],[11,-30]].forEach(p=>lamp(p[0],p[1]));

function car(x,z,rot,col){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);const m=M(col,{roughness:.35,metalness:.4});
  box(1.8,0.65,4.3,m,0,0.6,0,g);box(1.6,0.55,2.2,mat.glassDark,0,1.18,-0.2,g);
  [[-0.85,1.35],[0.85,1.35],[-0.85,-1.35],[0.85,-1.35]].forEach(([a,b])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(0.33,0.33,0.22,16),mat.dark);w.rotation.z=Math.PI/2;w.position.set(a,0.33,b);g.add(w);});}
car(13.8,17.5,Math.PI,0x2f4a6b);car(15.75,6.5,0,0xe9e7e2);car(7.2,11.3,Math.PI/2,0xa33b2c); // the red one is at the drop-off

// ---------- planting ----------
const flowerPts=[];
function bed(x0,z0,x1,z1,dens=8){flatRect(scene,x0,z0,x1,z1,0.055,mat.soil,1);const n=Math.round((x1-x0)*(z1-z0)*dens);for(let i=0;i<n;i++)flowerPts.push([R(x0+0.1,x1-0.1),R(z0+0.1,z1-0.1)]);}
bed(-16.3,-22,-15.2,-15.2);bed(-16.3,-10.8,-15.2,8.4);
bed(3.4,-14.8,4.2,-7.6);bed(3.6,-3.2,4.2,8.4);
bed(-16,17,4.6,18);bed(4.8,15.3,11.6,16.1);bed(4.8,7.9,11.6,8.7);
bed(-28.5,28.2,28.5,29.4);bed(11.7,-33.4,14.8,-32.7);bed(-26,-33.0,-23.6,-32.3);bed(-12.8,-33.0,-10.6,-32.3);
{const N=flowerPts.length;const geo=new THREE.IcosahedronGeometry(0.12,0);const fm=M(0xffffff,{flatShading:true,roughness:.7});
 const inst=new THREE.InstancedMesh(geo,fm,N+320);const pal=[0xd7263d,0xf4a259,0xf6d55c,0xe05a9b,0x8e5ec4,0xffffff,0xf07c2a];const leaf=new THREE.Color(0x4a7a36);
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),c=new THREE.Color();let i=0;
 flowerPts.forEach(([x,z])=>{const isLeaf=rand()<0.38;const sc=isLeaf?R(1.4,2.0):R(0.7,1.2);p.set(x,isLeaf?0.12:R(0.2,0.38),z);s.set(sc,sc,sc);m4.compose(p,q,s);inst.setMatrixAt(i,m4);c.set(isLeaf?leaf:pal[Math.floor(rand()*pal.length)]);inst.setColorAt(i,c);i++;});
 [[-22,17,0.8,0.5],[1,13.5,1.0,0.55]].forEach(([cx,cz,rr,y0])=>{for(let k=0;k<160;k++){const a=rand()*Math.PI*2,r=rand()*rr;p.set(cx+Math.cos(a)*r,y0+R(0,0.15),cz+Math.sin(a)*r);const sc=R(0.8,1.3);s.set(sc,sc,sc);m4.compose(p,q,s);inst.setMatrixAt(i,m4);c.set(rand()<.35?leaf:pal[Math.floor(rand()*pal.length)]);inst.setColorAt(i,c);i++;}});
 inst.count=i;scene.add(inst);}

const trunkGeo=new THREE.CylinderGeometry(0.6,1,1,7),blobGeo=new THREE.IcosahedronGeometry(1,1);
const trunkMat=M(0x5a3d2b),barkMat=M(0x6e4a33);
const greens=[0x3e5c3a,0x4a6b3f,0x36523a,0x55753f].map(c=>M(c,{flatShading:true}));
function tallTree(x,z,h,y0=0){const g=new THREE.Group();g.position.set(x,y0,z);scene.add(g);
  const t=new THREE.Mesh(trunkGeo,trunkMat);t.scale.set(0.2,h*0.62,0.2);t.position.y=h*0.31;t.castShadow=true;g.add(t);
  const m=greens[Math.floor(rand()*greens.length)];
  [[0.5,0.2,0.3],[0.68,0.17,0.25],[0.85,0.12,0.18]].forEach(([yy,rr,hh])=>{const b=new THREE.Mesh(blobGeo,m);b.scale.set(h*rr,h*hh,h*rr);b.position.set(R(-.3,.3),h*yy,R(-.3,.3));b.castShadow=true;g.add(b);});}
function shadeTree(x,z,h,col,y0=0){const g=new THREE.Group();g.position.set(x,y0,z);scene.add(g);
  const t=new THREE.Mesh(trunkGeo,barkMat);t.scale.set(0.22,h*0.55,0.22);t.position.y=h*0.275;t.castShadow=true;g.add(t);
  const m=M(col,{flatShading:true});for(let k=0;k<5;k++){const b=new THREE.Mesh(blobGeo,m);const r=h*R(0.2,0.28);b.scale.set(r,r*0.75,r);const a=k/5*Math.PI*2;b.position.set(Math.cos(a)*h*0.2,h*R(0.62,0.8),Math.sin(a)*h*0.2);b.castShadow=true;g.add(b);}
  const b=new THREE.Mesh(blobGeo,m);b.scale.set(h*0.26,h*0.2,h*0.26);b.position.y=h*0.88;b.castShadow=true;g.add(b);}
for(let i=0;i<16;i++)tallTree(R(-29.5,-26.5),R(-29,8),R(13,19));
for(let i=0;i<20;){const x=R(-12,28);if(x>5.5&&x<14)continue;tallTree(x,R(-29,-25.5),R(12,18));i++;}
[[-27.5,11],[-16.5,24.5],[-27.5,23.5]].forEach(p=>shadeTree(p[0],p[1],7.5,0x8c6cc9));
[[-11.5,23.5],[-1,23.5],[14,26]].forEach(p=>shadeTree(p[0],p[1],7,0xe0552b));
[[27,-3],[25.5,-16],[15,-13],[19,-6],[-20,28],[23,26],[-28,-40],[-1,-41],[24,-38],[27.5,-30],[-4,-34]].forEach(p=>shadeTree(p[0],p[1],8,0x4f7a3c));
[[13.5,-24],[6,28.6],[-6,28.6],[17,-41.5]].forEach(p=>shadeTree(p[0],p[1],4.2,0x7f8f3a));
for(let i=0;i<70;i++){const a=rand()*Math.PI*2,d=R(40,150);const x=Math.cos(a)*d,z=Math.sin(a)*d-7;if(x>29&&x<41)continue;rand()<.7?tallTree(x,z,R(10,20),groundY(x,z)):shadeTree(x,z,R(5,9),0x4f7a3c,groundY(x,z));}

// ---------- signs, labels & dimensions (after fonts load) ----------
function textPlane(w,h,draw,opts={}){const c=document.createElement('canvas');c.width=Math.round(w*240);c.height=Math.round(h*240);draw(c.getContext('2d'),c.width,c.height);const t=new THREE.CanvasTexture(c);t.anisotropy=8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial(Object.assign({map:t,roughness:.6},opts)));}
const DENIM='#2F557F'; // official SDA "denim" from the logo files
function buildSigns(logo){
  const spaced=(g,px)=>{if('letterSpacing' in g)g.letterSpacing=`${px}px`;};
  // front gable: denim panel with the official centered logo (white) and the church name
  boxR(-1.0,FL+5.36,14.0,1.0,FL+8.74,14.05,M(0x2a4c72),church);
  const fp=textPlane(1.9,3.3,(g,w,h)=>{g.fillStyle=DENIM;g.fillRect(0,0,w,h);
    const lw=w*0.9,lh=lw*logo.height/logo.width;g.drawImage(logo,(w-lw)/2,h*0.07,lw,lh);
    g.fillStyle='rgba(255,255,255,.75)';g.fillRect(w*0.3,h*0.66,w*0.4,3);
    g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';g.font=`600 ${Math.round(h*0.095)}px "Noto Sans", Figtree, sans-serif`;spaced(g,Math.round(h*0.012));g.fillText('KAHARO',w/2+Math.round(h*0.006),h*0.79);},
    {emissive:0x2F557F,emissiveIntensity:0.25});
  fp.position.set(0,FL+7.05,14.06);church.add(fp);
  // brass SDA logo inlaid on the pulpit front
  {const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*logo.height/logo.width);const g=c.getContext('2d');g.drawImage(logo,0,0,c.width,c.height);
   g.globalCompositeOperation='source-in';const gr=g.createLinearGradient(0,0,c.width,c.height);gr.addColorStop(0,'#e8c770');gr.addColorStop(.5,'#c19a45');gr.addColorStop(1,'#e2bf66');g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);
   const t=new THREE.CanvasTexture(c);t.anisotropy=8;const lw=0.5,lh=lw*c.height/c.width;
   const pl=new THREE.Mesh(new THREE.PlaneGeometry(lw,lh),new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:0.2,metalness:.15,roughness:.35,emissive:0xd9ad4a,emissiveIntensity:.35}));
   pl.position.set(0,0.55,0.315);pulpitG.add(pl);}
  // gate sign
  const gs=textPlane(4.2,1.1,(g,w,h)=>{g.fillStyle=DENIM;g.fillRect(0,0,w,h);
    const lh=h*0.82,lw=lh*logo.width/logo.height;g.drawImage(logo,h*0.12,(h-lh)/2,lw,lh);
    g.fillStyle='rgba(255,255,255,.5)';g.fillRect(h*0.24+lw,h*0.18,2,h*0.64);
    const cx=h*0.24+lw+(w-(h*0.24+lw))/2;g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';
    g.font=`600 ${Math.round(h*0.3)}px "Noto Sans", Figtree, sans-serif`;spaced(g,Math.round(h*0.03));g.fillText('KAHARO',cx,h*0.42);
    spaced(g,0);g.font=`400 ${Math.round(h*0.13)}px "Noto Sans", Figtree, sans-serif`;g.fillStyle='rgba(255,255,255,.8)';g.fillText('Karibu · Welcome',cx,h*0.72);});
  gs.rotation.y=Math.PI/2;gs.position.set(30.92,1.9,4.6);scene.add(gs);
  // toilet door signs, facing the path
  [['LADIES',-22.7],['ACCESSIBLE',-20.4],['GENTS',-17.9]].forEach(([t,z])=>{const s=textPlane(t.length>6?1.1:0.8,0.24,(g,w,h)=>{g.fillStyle=t==='ACCESSIBLE'?'#2f6db5':'#f2efe9';g.fillRect(0,0,w,h);g.fillStyle=t==='ACCESSIBLE'?'#ffffff':'#2b2f33';g.textAlign='center';g.textBaseline='middle';g.font=`700 ${Math.round(h*0.55)}px Figtree, sans-serif`;g.fillText(t,w/2,h/2+2);});
    s.position.set(z,2.42,-33.97);scene.add(s);});
}
const labelsG=new THREE.Group();scene.add(labelsG);
const dimsG=new THREE.Group();scene.add(dimsG);
function makeLabel(text,sub,k){const c=document.createElement('canvas');let g=c.getContext('2d');
  g.font='600 44px Figtree, sans-serif';const w1=g.measureText(text).width;let w2=0;if(sub){g.font='500 30px "IBM Plex Mono", monospace';w2=g.measureText(sub).width;}
  const W2=Math.ceil(Math.max(w1,w2)+56),H2=sub?120:76;c.width=W2;c.height=H2;g=c.getContext('2d');
  const r=18;g.fillStyle='rgba(252,251,248,0.95)';g.beginPath();g.moveTo(r,0);g.arcTo(W2,0,W2,H2,r);g.arcTo(W2,H2,0,H2,r);g.arcTo(0,H2,0,0,r);g.arcTo(0,0,W2,0,r);g.fill();
  g.fillStyle='#2f5d50';g.fillRect(0,0,8,H2);
  g.fillStyle='#22201c';g.font='600 44px Figtree, sans-serif';g.textBaseline='top';g.fillText(text,30,16);
  if(sub){g.fillStyle='#6b645a';g.font='500 30px "IBM Plex Mono", monospace';g.fillText(sub,30,70);}
  const t=new THREE.CanvasTexture(c);t.minFilter=THREE.LinearFilter;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));s.scale.set(W2*k,H2*k,1);s.renderOrder=999;return s;}
function buildLabels(){
  const L=(t,s,x,y,z,k)=>{const sp=makeLabel(t,s,k);sp.position.set(x,y,z);labelsG.add(sp);};
  const lc=(t,s,x,y,z)=>L(t,s,x+BX,y,z+BZ,0.011);
  lc('Nave','300 seats',0,FL+2.2,2.5);lc('Stage','10.0 × 5.3 m',0,FL+2.6,-11);
  lc("Mothers' room",'4.7 × 3.7 m',-5.4,FL+2.0,12);lc('Media & store','4.7 × 3.7 m',5.4,FL+2.0,12);
  lc("Clerk's desk",null,0.8,FL+1.3,12.9);lc('Vestry','4.8 × 5.6 m',10.5,FL+2.2,-11);
  lc("Children's corner",'18 seats',-6.4,FL+1.7,-11.2);lc('Piano',null,6.4,FL+1.7,-12.2);
  lc('Wheelchair space',null,-6.5,FL+1.2,-6.4);lc('Wheelchair space',null,6.5,FL+1.2,-6.4);
  lc('Porch & ramp',null,1.5,FL+1.6,16);
  const ls=(t,s,x,z,y=3)=>L(t,s,x,y,z,0.02);
  ls('Forecourt','drop-off point',-6,13);ls('Resting garden','pergola & benches',-22,17,4);ls('Toilets','10.0 × 7.0 m',-21,-37.5,4.5);ls("Caretaker's house",'1 bedroom · 8.5 × 7.0 m',10.75,-38,5.2);
  ls('Parking','7 cars',21,6.5);ls('Parking','6 cars · 2 accessible',21,17.5);ls('Main gate','from the road',27,12,3.6);ls('Rainwater tank','10,000 L',-11.8,-42,4.2);
  ls('Existing trees kept',null,-27.5,-12,6);ls('Existing trees kept',null,20,-27.5,6);
  const lm=new THREE.LineBasicMaterial({color:0x2b2620,depthTest:false});
  const dim=(a,b,tick,text,lx,lz)=>{const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]),lm);l.renderOrder=998;dimsG.add(l);
    [a,b].forEach(p=>{const tl=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p[0]-tick[0],p[1],p[2]-tick[1]),new THREE.Vector3(p[0]+tick[0],p[1],p[2]+tick[1])]),lm);tl.renderOrder=998;dimsG.add(tl);});
    const sp=makeLabel(text,null,0.016);sp.position.set(lx,0.6,lz);dimsG.add(sp);};
  dim([BX-8,0.5,BZ-16],[BX+8,0.5,BZ-16],[0,0.7],'16.0 m',BX,BZ-16);
  dim([-14.6,0.5,BZ-14],[-14.6,0.5,BZ+14],[0.7,0],'28.0 m',-14.6,BZ+4);
  dim([-26,0.5,-42.6],[-16,0.5,-42.6],[0,0.5],'10.0 m',-21,-42.6);
  dim([6.5,0.5,-42.8],[15,0.5,-42.8],[0,0.5],'8.5 m',10.75,-42.8);
  dim([-30,0.5,33.5],[30,0.5,33.5],[0,1],'≈ 60 m',-14,33.5);
  dim([-32.5,0.5,-44],[-32.5,0.5,30],[1,0],'≈ 74 m',-32.5,-7);
  dim([-12,0.5,-22.2],[-12,0.5,-34],[0.5,0],'12 m to toilets',-12,-28);
}

// ---------- views & settings ----------
const views={
  exterior:{p:[BX+34,19,BZ+46],t:[BX+1,3.5,BZ+2],roof:true,labels:false},
  cutaway:{p:[BX+20,30,BZ+30],t:[BX+1,0,BZ-1],roof:false,labels:true},
  plan:{p:[0,90,-6.99],t:[0,0,-7],roof:false,labels:true,plan:true},
  inside:{p:[BX,FL+1.7,BZ+9.4],t:[BX,FL+2.0,BZ+5.6],roof:true,inside:true,fov:62},
  stage:{p:[BX+0.5,FL+2.3,BZ-10.6],t:[BX,FL+1.5,BZ-6.8],roof:true,inside:true,fov:62},
  mothers:{p:[BX-7.4,FL+1.65,BZ+13.45],t:[BX-4.6,FL+1.2,BZ+10.7],roof:true,inside:true,fov:70},
  media:{p:[BX+6.9,FL+1.65,BZ+13.55],t:[BX+4.8,FL+1.15,BZ+10.6],roof:true,inside:true,fov:70},
  vestry:{p:[BX+8.5,FL+1.65,BZ-8.6],t:[BX+11.2,FL+1.0,BZ-12.0],roof:true,inside:true,fov:70},
  toilets:{p:[-11,9.5,-26],t:[-21,0.3,-37.6],roof:false,labels:false},
  house:{p:[18.5,9,-28],t:[10.75,0.5,-38],roof:false,labels:false}
};
let current='exterior',labelsOn=false,tween=null;
function setRoof(v){roofG.visible=v;worldRoof.visible=v;}
function setLabels(v){labelsOn=v;labelsG.visible=v;dimsG.visible=v&&current==='plan';document.getElementById('labels-btn').setAttribute('aria-pressed',String(v));}
function goTo(name,instant){const v=views[name];current=name;
  document.querySelectorAll('#views [data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
  setRoof(v.roof);setLabels(!!v.labels);
  camera.fov=v.fov||45;camera.updateProjectionMatrix();
  controls.minDistance=v.inside?0.3:1;controls.maxDistance=v.inside?30:420;controls.screenSpacePanning=!!v.inside;controls.maxPolarAngle=v.inside?Math.PI*0.92:Math.PI/2-0.04;
  const p=new THREE.Vector3(...v.p);if(v.plan)p.y=100*Math.max(1,0.8/camera.aspect);const t=new THREE.Vector3(...v.t);
  if(instant||reduceMotion){camera.position.copy(p);controls.target.copy(t);controls.update();tween=null;return;}
  tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:t,s:performance.now(),dur:1300};}
document.querySelectorAll('#views [data-view]').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.view)));
document.getElementById('labels-btn').addEventListener('click',()=>setLabels(!labelsOn));
// free movement: double-click / double-tap to fly to a spot, Move mode, WASD keys
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
const shown=o=>{for(;o;o=o.parent)if(!o.visible)return false;return true;};
function flyToPoint(cx,cy){const r=renderer.domElement.getBoundingClientRect();ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
  const hit=ray.intersectObjects(scene.children,true).find(h=>!h.object.isSprite&&!h.object.isLine&&shown(h.object));if(!hit)return;
  const pt=hit.point.clone(),off=camera.position.clone().sub(controls.target);const inside=views[current].inside;
  off.setLength(inside?Math.max(1.5,Math.min(off.length(),3)):Math.max(6,Math.min(off.length()*0.6,28)));
  tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:pt.clone().add(off),t1:pt,s:performance.now(),dur:reduceMotion?1:900};}
renderer.domElement.addEventListener('dblclick',e=>flyToPoint(e.clientX,e.clientY));
{let lastTap=0,lp=null;renderer.domElement.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;const now=performance.now();
  if(now-lastTap<320&&lp&&Math.hypot(e.clientX-lp[0],e.clientY-lp[1])<30){flyToPoint(e.clientX,e.clientY);lastTap=0;}else{lastTap=now;lp=[e.clientX,e.clientY];}});}
const mvBtn=document.getElementById('move-btn');
function setMove(on){controls.mouseButtons.LEFT=on?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;controls.mouseButtons.RIGHT=on?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;
  controls.touches.ONE=on?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE;mvBtn.setAttribute('aria-pressed',String(on));}
mvBtn.addEventListener('click',()=>setMove(mvBtn.getAttribute('aria-pressed')!=='true'));
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(!'wasd'.includes(k)||k.length!==1||e.target.closest&&e.target.closest('input,textarea'))return;
  const f=new THREE.Vector3();camera.getWorldDirection(f);f.y=0;f.normalize();const rt=new THREE.Vector3(-f.z,0,f.x);
  const step=(views[current].inside?0.6:2.5)*(e.shiftKey?3:1);const mv=new THREE.Vector3();
  if(k==='w')mv.add(f);if(k==='s')mv.sub(f);if(k==='d')mv.add(rt);if(k==='a')mv.sub(rt);mv.multiplyScalar(step);
  tween=null;camera.position.add(mv);controls.target.add(mv);});
document.querySelectorAll('[data-seat]').forEach(b=>b.addEventListener('click',()=>{const c=b.dataset.seat==='chairs';chairsG.visible=c;benchesG.visible=!c;
  document.querySelectorAll('[data-seat]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
const floorMaps={tiles:[marbleTex,.5],terrazzo:[terrazzoTex,.4]};
document.querySelectorAll('[data-floor]').forEach(b=>b.addEventListener('click',()=>{const [t,r]=floorMaps[b.dataset.floor];mat.marble.map=t;mat.marble.roughness=r;mat.marble.needsUpdate=true;
  document.querySelectorAll('[data-floor]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
function setLights(on){mat.lamp.emissiveIntensity=on?0.9:0;mat.lamp.color.set(on?0xfff2d0:0xd8d4cc);hallLights.forEach(l=>l.intensity=on?0.45:0);
  document.querySelectorAll('[data-light]').forEach(x=>x.setAttribute('aria-pressed',String((x.dataset.light==='on')===on)));}
document.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>setLights(b.dataset.light==='on')));
setLights(false);
const sbtn=document.getElementById('settings-btn'),spop=document.getElementById('settings-pop');
function setPop(o){spop.hidden=!o;sbtn.setAttribute('aria-expanded',String(o));sbtn.textContent=o?'Settings ▾':'Settings ▴';}
sbtn.addEventListener('click',()=>setPop(spop.hidden));
document.addEventListener('keydown',e=>{if(e.key==='Escape')setPop(false);});
document.querySelectorAll('[data-win]').forEach(b=>b.addEventListener('click',()=>{Object.keys(winGroups).forEach(k=>winGroups[k].visible=k===b.dataset.win);
  document.querySelectorAll('[data-win]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));

const body=document.body,dbtn=document.getElementById('details-btn'),panel=document.getElementById('panel');
const mq=window.matchMedia('(max-width:760px)');
function panelOpen(o){if(mq.matches){panel.hidden=!o;}else{body.classList.toggle('panel-closed',!o);panel.hidden=false;}dbtn.setAttribute('aria-expanded',String(o));}
dbtn.addEventListener('click',()=>panelOpen(dbtn.getAttribute('aria-expanded')!=='true'));
document.getElementById('panel-close').addEventListener('click',()=>panelOpen(false));
function syncPanel(){panelOpen(!mq.matches);}
mq.addEventListener?mq.addEventListener('change',syncPanel):mq.addListener(syncPanel);syncPanel();

function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
goTo('exterior',true);
function loop(now){requestAnimationFrame(loop);
  if(tween){const k=Math.min(1,(now-tween.s)/tween.dur);const e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
    camera.position.lerpVectors(tween.p0,tween.p1,e);controls.target.lerpVectors(tween.t0,tween.t1,e);if(k>=1)tween=null;}
  controls.update();renderer.render(scene,camera);}
requestAnimationFrame(loop);
const fontsReady=document.fonts?Promise.race([Promise.all([document.fonts.load('600 44px "Noto Sans"'),document.fonts.load('400 44px "Noto Sans"'),document.fonts.load('600 44px Figtree'),document.fonts.load('700 44px Figtree'),document.fonts.load('500 30px "IBM Plex Mono"')]),new Promise(r=>setTimeout(r,2500))]):Promise.resolve();
const LOGO_SRC=window.SDA_LOGO_PNG;
const logoReady=new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=LOGO_SRC;});
Promise.all([fontsReady,logoReady]).then(([,logo])=>{if(logo)buildSigns(logo);buildLabels();setLabels(labelsOn);});
})();
