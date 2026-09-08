import * as THREE from 'three';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
export const S=1.65;
export const coord=(x,y,h=0)=>new THREE.Vector3((x-450)*S,h,(y-405)*S);
export const places=[
 {id:'main',name:'主楼',en:'MAIN BUILDING',map:[292,495],height:37,view:[-170,130,260],walk:[248,557],description:'南门内的标志性建筑。对称的长立面、中央入口与两侧庭院，是清水河校园最鲜明的建筑轮廓之一。',source:'https://news.uestc.edu.cn/info/1002/1192.htm'},
 {id:'library',name:'图书馆 · 时间广场',en:'LIBRARY & TIME SQUARE',map:[337,374],height:31,view:[150,120,180],walk:[378,416],description:'八角形主体、低矮穹顶与前方的环形广场相互呼应。清水河校区图书馆于 2009 年 6 月建成使用，面积 5.2 万余平方米。',source:'https://xxgkw.uestc.edu.cn/info/1269/6224.htm'},
 {id:'lake',name:'湖畔绿地',en:'LAKESIDE GARDEN',map:[431,474],height:3,view:[170,155,195],walk:[395,514],description:'地图中的中央湖区位于立人楼南侧。沿弯曲的湖岸、步道与成片树木漫游，或切换日落光照欣赏水面。湖岸与植被为简化重建。',source:'https://www.mba.uestc.edu.cn/info/1012/1803.htm'},
 {id:'teaching',name:'品学楼 · 立人楼',en:'TEACHING QUARTER',map:[464,364],height:30,view:[190,145,180],walk:[480,394],description:'教学区位于校园中部，品学楼建筑群与立人楼分布在湖区周边。模型依据公开地图表现主要建筑体量，不含教室与室内空间。',source:'https://www.mba.uestc.edu.cn/info/1012/1803.htm'},
 {id:'sports',name:'体育场 · 体育馆',en:'SPORTS GROUND',map:[420,584],height:15,view:[160,145,170],walk:[383,611],description:'南侧体育区由田径场、体育馆和相邻活动场地组成。跑道、足球场与看台均可近距离探索。',source:'https://www.mba.uestc.edu.cn/info/1012/1803.htm'},
 {id:'living',name:'学知苑 · 生活区',en:'STUDENT NEIGHBORHOOD',map:[503,227],height:27,view:[170,170,190],walk:[496,286],description:'生活区集中在校园地图上部，学知苑宿舍与食堂由密集的道路连接。宿舍采用重复体量建模，楼栋细节和间距为近似。',source:'https://www.mba.uestc.edu.cn/info/1012/1803.htm'}
];
export function buildCampus(scene){
 const campus=new THREE.Group();scene.add(campus);
 const mats={},colliders=[],footprints=[],treePoints=[],waterMeshes=[],batches=new Map();
 const mat=(name,color,opts={})=>mats[name]??(mats[name]=new THREE.MeshStandardMaterial({color,roughness:.83,...opts}));
 const stone=mat('stone',0xd9d4bd), trim=mat('trim',0xf1e8d0), roof=mat('roof',0xaaa99c), dark=mat('dark',0x506f72),grass=mat('grass',0x769572),pavement=mat('pavement',0xd1c9b0),roadMat=mat('road',0x657673),lineMat=mat('line',0xe4e0cb),waterMat=mat('water',0x4d9294,{metalness:.38,roughness:.21}),trackMat=mat('track',0xb47d65),pitchMat=mat('pitch',0x5f916a);
 const winCanvas=document.createElement('canvas');winCanvas.width=128;winCanvas.height=128;const wc=winCanvas.getContext('2d');wc.fillStyle='#d4cfb9';wc.fillRect(0,0,128,128);wc.fillStyle='#6b8586';wc.fillRect(28,19,72,80);wc.fillStyle='#4f727a';wc.fillRect(33,24,61,68);wc.fillStyle='#adc0b1';wc.fillRect(35,26,6,64);wc.fillStyle='#dcd8c5';wc.fillRect(62,23,5,74);wc.fillRect(30,60,69,4);wc.fillStyle='#eee6cc';wc.fillRect(23,99,82,6);wc.fillStyle='#b9b5a6';wc.fillRect(0,123,128,5);const tex=new THREE.CanvasTexture(winCanvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;
 const facadeMaterials=new Map();
 function facade(w,h){let key=`${Math.round(w/3.2)},${Math.round(h/4.1)}`;if(facadeMaterials.has(key))return facadeMaterials.get(key);const t=tex.clone();t.needsUpdate=true;t.repeat.set(Math.max(1,Math.round(w/3.2)),Math.max(1,Math.round(h/4.1)));let m=new THREE.MeshStandardMaterial({map:t,color:0xffffff,roughness:.8});facadeMaterials.set(key,m);return m;}
 function mesh(geometry,material,parent=campus){const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(x,y,z,w,h,d,material=stone,parent=campus){const m=mesh(new THREE.BoxGeometry(w,h,d),material,parent);m.position.set(x,y,z);return m;}
 function disc(x,z,r,material,y=.18){const m=mesh(new THREE.CylinderGeometry(r,r,.18,64),material);m.position.set(x,y,z);return m;}
 function poly(points,material,y=.05){const shape=new THREE.Shape();points.forEach(([x,z],i)=>{if(i===0)shape.moveTo(x,-z);else shape.lineTo(x,-z)});shape.closePath();const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const m=mesh(g,material);m.position.y=y;return m;}
 const mp=(points)=>points.map(p=>{const v=coord(...p);return[v.x,v.z]});
 const boundary=[[52,452],[419,63],[731,270],[689,453],[620,716],[247,591]];
 poly(mp(boundary),grass,.03);
 // Continuous ground beyond the campus avoids a floating model when walking.
 box(0,-5,0,6500,9.7,6500,mat('surround',0x94ab8e));
 const outline=[...boundary,boundary[0]];
 function path(points,width=6,material=pavement,y=.13,smooth=false){let verts=points.map(([x,z])=>new THREE.Vector3(x,y,z));if(smooth)verts=new THREE.CatmullRomCurve3(verts,false,'catmullrom',.35).getPoints(Math.max(40,points.length*9));const positions=[],indices=[];verts.forEach((v,i)=>{const a=verts[Math.max(0,i-1)],b=verts[Math.min(verts.length-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;positions.push(v.x-dz/len*width/2,y,v.z+dx/len*width/2,v.x+dz/len*width/2,y,v.z-dx/len*width/2);if(i<verts.length-1){let k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}});let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,material);}
 const mapPath=(p,w=8,m=roadMat,y=.15,s=false)=>path(mp(p),w,m,y,s);
 mapPath(outline,22,roadMat);mapPath(outline,1,lineMat,.17);
 const roads=[[[245,590],[281,533],[322,467],[369,426],[414,366],[455,295],[492,163]],[[79,441],[159,445],[242,482],[337,542],[430,620],[603,686]],[[240,491],[251,423],[272,353],[315,300],[355,216],[409,97]],[[315,300],[377,309],[451,295],[560,313],[635,368]],[[377,309],[380,370],[412,408],[503,442],[550,515],[619,559]],[[455,295],[541,304],[607,279]],[[324,534],[397,550],[498,528],[550,515]],[[429,620],[473,579],[548,576],[619,559]],[[546,161],[559,230],[580,294]],[[588,318],[583,375],[546,422],[553,480]],[[337,220],[402,262],[454,285],[544,277]],[[376,169],[440,204],[497,216],[568,200]],[[299,331],[325,356],[343,376],[373,405],[414,429]]];
 roads.forEach(r=>{mapPath(r,13,pavement,.14,true);mapPath(r,7.2,roadMat,.18,true)});
 const lakes=[[[278,343],[291,340],[297,350],[315,354],[319,368],[310,380],[323,393],[309,414],[289,426],[263,419],[259,401],[272,384],[266,362]],[[416,442],[432,448],[449,446],[468,461],[459,479],[450,491],[447,505],[427,509],[416,521],[399,514],[389,499],[397,477],[393,465],[410,458]],[[668,439],[683,421],[687,438],[679,462],[664,474],[658,499],[642,517],[642,534],[624,549],[620,529],[632,508],[638,482],[655,468]]];
 lakes.forEach(p=>{const pts=mp(p);const center=pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length],[0,0]);poly(pts.map(p=>[center[0]+(p[0]-center[0])*1.035,center[1]+(p[1]-center[1])*1.035]),pavement,.21);waterMeshes.push(poly(pts,waterMat,.25));mapPath([...p,p[0]],3,pavement,.3,true)});
 mapPath([[401,73],[355,205],[310,300],[271,345],[254,414],[224,520],[202,557]],10,waterMat,.23,true);
 // Road bridges spanning the western stream.
 for(const [x,y] of [[261,382],[247,456],[221,518]]){const p=coord(x,y);box(p.x,.6,p.z,25,.9,8,pavement);box(p.x,1.7,p.z-4,25,.25,.35,trim);box(p.x,1.7,p.z+4,25,.25,.35,trim)}
 function building(parent,x,z,w,d,h,{color=stone,windows=true,collide=true}={}){
  const sides=windows?[facade(d,h),facade(d,h),roof,color,facade(w,h),facade(w,h)]:color;
  const body=box(x,h/2,z,w,h,d,sides,parent);box(x,h+.5,z,w+1.8,1,d+1.8,trim,parent);box(x,.55,z,w+2,1.1,d+2,trim,parent);
  if(h>15)box(x,h-2.5,z,w+.3,.35,d+.3,trim,parent);
  if(collide)colliders.push(body);return body;
 }
 function block(px,py,w,d,h,yaw=-.56){const g=new THREE.Group();g.position.copy(coord(px,py));g.rotation.y=yaw;campus.add(g);building(g,0,0,w,d,h);footprints.push({x:px,y:py,w:w/S,d:d/S,a:-yaw});return g;}
 // Main building: symmetric central entrance, long wings and two enclosed courtyards.
 const main=new THREE.Group();main.position.copy(coord(292,495));main.rotation.y=-.56;campus.add(main);
 building(main,0,0,62,29,34);building(main,-91,0,120,23,27);building(main,91,0,120,23,27);
 for(const sign of[-1,1]){building(main,sign*159,-17,30,64,31);building(main,sign*113,-49,78,19,25);building(main,sign*63,-32,18,45,25);box(sign*111,.08,-28,64,.12,27,pavement,main)}
 box(0,6,17,39,12,5,dark,main);box(0,13.7,21,51,1.4,14,trim,main);
 for(let x=-22;x<=22;x+=7.3)box(x,6.4,25,1.6,12.8,1.8,trim,main);
 for(let i=0;i<8;i++)box(0,.2+i*.23,36-i*1.1,65-i,.4,2.2,trim,main);
 box(0,.14,74,110,.22,85,pavement,main);box(0,.3,85,24,.45,24,mat('flowerbed',0x923f48),main);box(0,.6,85,9,.6,9,trim,main);box(0,13,85,.3,25,.3,trim,main);const flag=box(2,23,85,4,2.6,.05,mat('flag',0xba4544),main);
 footprints.push({x:292,y:495,w:330/S,d:74/S,a:.56});
 // Octagonal library, low pyramidal glass dome, radial facade piers and lower wings.
 const library=new THREE.Group();library.position.copy(coord(337,374));library.rotation.y=.85;campus.add(library);
 let core=mesh(new THREE.CylinderGeometry(46,46,26,8),stone,library);core.position.y=13;core.rotation.y=Math.PI/8;colliders.push(core);
 let cap=mesh(new THREE.CylinderGeometry(47,47,1,8),trim,library);cap.position.y=26.5;cap.rotation.y=Math.PI/8;
 let dome=mesh(new THREE.ConeGeometry(29,10,8),mat('dome',0x879491,{metalness:.35,roughness:.35}),library);dome.position.y=32;dome.rotation.y=Math.PI/8;
 let domeRim=mesh(new THREE.CylinderGeometry(30,30,1.2,8),trim,library);domeRim.position.y=27;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const wall=new THREE.Group();wall.position.set(Math.sin(a)*42.6,0,Math.cos(a)*42.6);wall.rotation.y=a;library.add(wall);box(0,14,0,30,19,.3,dark,wall);for(let j=-3;j<=3;j++)box(j*4.7,14,.5,1.2,21,1,trim,wall);box(0,24,1,32,1.6,2,trim,wall)}
 building(library,-57,-10,31,47,19);building(library,54,-9,27,41,18);building(library,-20,-44,44,27,18);building(library,26,-45,38,28,17);
 for(let i=0;i<9;i++)box(0,.18+i*.25,64-i*2,35+i*2,.4,4,trim,library);
 footprints.push({x:337,y:374,w:132/S,d:104/S,a:-.85});
 let plaza=coord(373,405);disc(plaza.x,plaza.z,29,pavement,.27);
 for(const r of[10,17,25]){const g=new THREE.TorusGeometry(r,.28,4,96);g.rotateX(Math.PI/2);const m=mesh(g,roof);m.position.set(plaza.x,.41,plaza.z)}
 // Classroom courtyard blocks.
 for(const [x,y,w,d,h] of [[393,338,63,25,24],[391,308,55,23,24],[397,287,40,19,20],[450,329,34,37,26],[484,344,62,27,27],[456,365,40,22,25],[489,374,40,21,25],[425,300,25,29,23],[236,340,47,25,21],[216,369,50,19,21],[199,391,44,18,22],[184,410,41,20,23]])block(x,y,w,d,h);
 // Liren building south of teaching quarter: open courtyard and stepped roof.
 const liren=block(455,416,60,24,22);building(liren,-30,-21,15,45,22);building(liren,30,-21,15,45,22);building(liren,0,-39,49,14,22);box(0,.15,-20,45,.2,27,pavement,liren);
 // Residence clusters, placed within upper campus boundary.
 for(let row=0;row<5;row++)for(let col=0;col<4;col++){let px=423+col*39+row*9,py=159+row*24+col*4;if(px>596)continue;block(px,py,42,14,21+((row+col)%3)*2,-.23);}
 for(const p of [[378,151,31,55,20],[396,128,28,43,22],[377,202,26,44,21],[351,237,25,40,19],[352,268,27,47,22],[485,297,72,39,14],[538,334,47,32,17],[601,622,72,26,17],[546,582,46,22,18],[270,471,27,23,14],[574,310,42,32,16]])block(...p);
 // Athletic oval with painted running lanes and football markings.
 function stadium(px,py,scale=1){const group=new THREE.Group();group.position.copy(coord(px,py));group.rotation.y=.13;group.scale.setScalar(scale);campus.add(group);
  function oval(r,straight,material,height){const shape=new THREE.Shape();shape.moveTo(-r,-straight/2);shape.lineTo(-r,straight/2);shape.absarc(0,straight/2,r,Math.PI,0,true);shape.lineTo(r,-straight/2);shape.absarc(0,-straight/2,r,0,-Math.PI,true);const geo=new THREE.ShapeGeometry(shape,40);geo.rotateX(-Math.PI/2);const m=mesh(geo,material,group);m.position.y=height;return m;}
  oval(41,64,trackMat,.29);oval(31,64,pitchMat,.32);
  for(let i=0;i<5;i++){let r=33+i*1.6,pts=[];for(let j=0;j<=48;j++){let a=Math.PI*j/48;pts.push(new THREE.Vector3(Math.cos(a)*r,.37,Math.sin(a)*r+32))}for(let j=0;j<=48;j++){let a=Math.PI+Math.PI*j/48;pts.push(new THREE.Vector3(Math.cos(a)*r,.37,Math.sin(a)*r-32))}pts.push(pts[0]);let g=new THREE.BufferGeometry().setFromPoints(pts);group.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0xf0d6bc})));}
  for(let z=-45;z<45;z+=10)box(0,.38,z,48,.03,5,mat('pitchStripe',0x679e74),group);
  for(let z of[-48,0,48])box(0,.41,z,49,.06,.35,lineMat,group);for(let x of[-24.5,24.5])box(x,.41,0,.35,.06,96,lineMat,group);
  const ring=mesh(new THREE.TorusGeometry(9,.2,3,48),lineMat,group);ring.rotation.x=Math.PI/2;ring.position.y=.46;
  for(const z of[-48,48]){for(let x of[-11,11])box(x,.45,z-Math.sign(z)*8,.25,.08,16,lineMat,group);box(0,.46,z-Math.sign(z)*16,22,.08,.25,lineMat,group);for(let x of[-3.7,3.7])box(x,1.3,z,.15,2.6,.15,trim,group);box(0,2.55,z,7.5,.15,.15,trim,group)}
  for(let i=0;i<7;i++)box(-48-i*1.4,1+i*.75,0,1.8,1.5,84,pavement,group);box(-54,8,0,18,.8,94,trim,group);for(const z of[-40,0,40])box(-57,4,z,.6,8,.6,dark,group);
  footprints.push({x:px,y:py,w:95*scale/S,d:155*scale/S,a:-.13,sports:true});
 }
 stadium(428,585,.85);stadium(589,429,.72);
 const gym=new THREE.Group();gym.position.copy(coord(326,579));campus.add(gym);let gm=mesh(new THREE.CylinderGeometry(30,33,13,24),stone,gym);gm.position.y=6.5;colliders.push(gm);let gr=mesh(new THREE.SphereGeometry(33,32,12,0,Math.PI*2,0,Math.PI/2),roof,gym);gr.scale.y=.24;gr.position.y=13;for(let i=0;i<20;i++){const a=i/20*Math.PI*2;box(Math.sin(a)*31,7,Math.cos(a)*31,1,10,1,dark,gym)}
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){let p=coord(619+col*11,365+row*17);box(p.x,.29,p.z,14,.13,22,mat('court',0x779482));box(p.x,.4,p.z,12,.03,.15,lineMat);for(const dx of[-6,6])box(p.x+dx,.4,p.z,.15,.03,20,lineMat);for(const dz of[-10,10])box(p.x,.4,p.z+dz,12,.03,.15,lineMat)}
 const pool=coord(370,575);disc(pool.x,pool.z,24,pavement,.3);let pm=disc(pool.x,pool.z,19,waterMat,.4);pm.scale.z=.65;
 // South gate, entry pillars and avenue.
 const gate=new THREE.Group();gate.position.copy(coord(242,581));gate.rotation.y=-.56;campus.add(gate);for(let x of[-31,-25,25,31])box(x,4.5,0,2.6,9,2.6,stone,gate);box(0,9,0,70,1.8,3,trim,gate);building(gate,-43,0,15,10,4,{windows:false});building(gate,43,0,15,10,4,{windows:false});
 // Collect world bounds before tree placement and static batching.
 campus.updateMatrixWorld(true);const bounds=colliders.map(m=>new THREE.Box3().setFromObject(m));
 function inside(p,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes;}
 let seed=2026;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const awayRoad=(px,py)=>roads.every(points=>points.slice(1).every((b,i)=>{const a=points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)>6}));
 const validTree=(px,py)=>{const p=coord(px,py);return inside([px,py],boundary)&&!lakes.some(l=>inside([px,py],l))&&!bounds.some(b=>p.x>b.min.x-5&&p.x<b.max.x+5&&p.z>b.min.z-5&&p.z<b.max.z+5)&&awayRoad(px,py)&&!footprints.filter(f=>f.sports).some(f=>Math.abs(px-f.x)<f.w*.65&&Math.abs(py-f.y)<f.d*.6)&&Math.hypot(px-373,py-405)>23&&Math.hypot(px-370,py-575)>24&&!(px>609&&px<669&&py>350&&py<433)&&!(px>222&&px<301&&py>510&&py<581)};
 for(let i=0;i<6300;i++){let px=75+random()*635,py=83+random()*610;if(validTree(px,py))treePoints.push({px,py,s:5+random()*5,t:random()>.68,r:random()});}
 // Paired avenue trees, the recognisable dense campus canopy.
 for(let k=0;k<roads.length;k++){const pts=roads[k];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<len;t+=10)for(const side of[-1,1]){const px=a[0]+(b[0]-a[0])*t/len-(b[1]-a[1])/len*9*side,py=a[1]+(b[1]-a[1])*t/len+(b[0]-a[0])/len*9*side;if(validTree(px,py))treePoints.push({px,py,s:7.5,t:true,r:random()})}}}
 const trunkM=mat('trunk',0x766956),leavesM=mat('leaves',0x4d7655,{roughness:1}),poplarM=mat('poplar',0x658657,{roughness:1});
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.32,1,5),trunkM,treePoints.length),crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),leavesM,treePoints.length),tips=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),poplarM,treePoints.length);let dummy=new THREE.Object3D();
 treePoints.forEach((t,i)=>{const p=coord(t.px,t.py);dummy.position.set(p.x,t.s*.37,p.z);dummy.scale.set(1,t.s*.74,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.set(p.x,t.s*.78,p.z);dummy.scale.set(t.t?t.s*.22:t.s*.47,t.t?t.s*.76:t.s*.45,t.t?t.s*.23:t.s*.43);dummy.rotation.y=t.r*6;dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);crowns.setColorAt(i,new THREE.Color().setHSL(.27+t.r*.07,.22+t.r*.12,.73+t.r*.16));dummy.position.y+=t.s*.25;dummy.scale.multiplyScalar(.67);dummy.position.x+=t.s*.16;dummy.updateMatrix();tips.setMatrixAt(i,dummy.matrix)});
 for(const m of[trunks,crowns,tips]){m.castShadow=true;m.receiveShadow=true;campus.add(m)}
 // Scatter benches and path lights along central walkways.
 const lampMat=mat('lamp',0xe2e5cd,{emissive:0xffdc99,emissiveIntensity:.08});
 for(let i=0;i<28;i++){const px=283+i*5.7,py=524-i*6.9,p=coord(px,py);if(bounds.some(b=>b.containsPoint(new THREE.Vector3(p.x,2,p.z))))continue;box(p.x,2.4,p.z,.25,4.8,.25,dark);box(p.x,4.9,p.z,1.1,.35,1.1,lampMat);if(i%3===0){box(p.x+4,.75,p.z,3,.25,1,mat('bench',0x917f61));box(p.x+4,1.2,p.z-.45,3,.9,.15,mats.bench)}}
 // Merge compatible static geometry to keep large campus responsive.
 const toRemove=[];campus.updateMatrixWorld(true);campus.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)&&o!==flag){let geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);if(!geo.getAttribute('uv'))geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count*2),2));const list=batches.get(o.material)||[];list.push(geo);batches.set(o.material,list);toRemove.push(o)}});
 toRemove.forEach(m=>m.removeFromParent());for(const [material,list] of batches){const geometry=mergeGeometries(list,false);if(!geometry)throw new Error('Static campus geometry merge failed');if(geometry){const m=new THREE.Mesh(geometry,material);m.castShadow=material!==waterMat&&material!==grass;m.receiveShadow=true;scene.add(m)}list.forEach(g=>g.dispose())}
 const landmarkHits=[];places.forEach(place=>{let m=new THREE.Mesh(new THREE.BoxGeometry(place.id==='main'?280:100,place.height+15,place.id==='main'?75:90),new THREE.MeshBasicMaterial({visible:false}));m.position.copy(coord(...place.map,(place.height+15)/2));if(place.id==='main')m.rotation.y=-.56;m.userData.place=place;scene.add(m);landmarkHits.push(m)});
 return {places,coord,bounds,boundary,lakes,roads,footprints,treePoints,landmarkHits,waterMat,leavesM,poplarM,lampMat,facadeMaterials,inside,setSeason(s){leavesM.color.set(s==='autumn'?0xb5a33e:0x4d7655);poplarM.color.set(s==='autumn'?0xd8b849:0x658657)},stats:{buildings:bounds.length,trees:treePoints.length}};
}
