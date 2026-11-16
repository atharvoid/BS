import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ROLL } from './categoryGeometry.ts'

const RADIAL=64, BEVEL=.012, HALF=ROLL.length/2-BEVEL
const U=[0,.016/(HALF*2),.024/(HALF*2),.125,.25,.375,.5,.625,.75,.875,1]
const CONTACT=16, FREE=12, THICKNESS=.008
const START=-108*Math.PI/180, RELEASE=55*Math.PI/180, CONTACT_R=ROLL.radius+.0065
const departure=new THREE.Vector2(CONTACT_R*Math.sin(RELEASE),CONTACT_R*Math.cos(RELEASE))
const fall=new THREE.CubicBezierCurve(departure,
  departure.clone().add(new THREE.Vector2(.15,-.15*Math.tan(RELEASE))),
  new THREE.Vector2(.75,-ROLL.radius+THICKNESS/2),new THREE.Vector2(1,-ROLL.radius+THICKNESS/2))

/** The same constrained contact arc, followed by a tangent, floor-level drape. */
function tailPoint(u:number,t:number) {
  const theta=START+(RELEASE-START)*Math.min(t,1)
  const point=t<=1?new THREE.Vector2(CONTACT_R*Math.sin(theta),CONTACT_R*Math.cos(theta)):fall.getPoint(t-1)
  const q=Math.max(0,t-1)
  const edgeLift=.006*(2*u-1)**2*16*q*q*(1-q)*(1-q)
  return new THREE.Vector3((u-.5)*HALF*2,point.y+edgeLift,point.x)
}

export function makeRollTail() {
  const ts=[...Array.from({length:CONTACT+1},(_,i)=>i/CONTACT),...Array.from({length:FREE},(_,i)=>1+(i+1)/FREE)]
  const row=U.length,layer=row*ts.length,positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[]
  for(const side of [1,-1])for(const t of ts)for(const u of U) {
    const e=.00001
    const across=tailPoint(u+e,t).sub(tailPoint(u-e,t))
    const before=t===0?0:t-e,after=t===2?2:t+e
    const along=tailPoint(u,after).sub(tailPoint(u,before))
    const normal=along.cross(across).normalize()
    const p=tailPoint(u,t).addScaledVector(normal,side*THICKNESS/2)
    positions.push(p.x,p.y,p.z);normals.push(normal.x*side,normal.y*side,normal.z*side)
    const v=t<=1?(START+(RELEASE-START)*t)/(Math.PI*2):RELEASE/(Math.PI*2)+fall.getLength()*(t-1)/(Math.PI*2*CONTACT_R)
    uvs.push(u,v)
  }
  for(let j=0;j<ts.length-1;j++)for(let i=0;i<row-1;i++) {
    const a=j*row+i,b=a+1,c=a+row,d=c+1
    indices.push(a,c,b,b,c,d,a+layer,b+layer,c+layer,b+layer,d+layer,c+layer)
  }
  const boundary=[...ts.map((_,j)=>j*row),...U.slice(1).map((_,i)=>(ts.length-1)*row+i+1),
    ...ts.slice(1).map((_,j)=>(ts.length-j-2)*row+row-1),...U.slice(1,-1).map((_,i)=>row-i-2)]
  for(let i=0;i<boundary.length;i++) {
    const a=boundary[i],b=boundary[(i+1)%boundary.length]
    indices.push(a,b+layer,b,a,a+layer,b+layer)
  }
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3))
  g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3))
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

function shoulder(side:number) {
  const p:number[]=[],n:number[]=[],uv:number[]=[],index:number[]=[]
  for(let j=0;j<=3;j++)for(let i=0;i<=RADIAL;i++) {
    const a=j/3*Math.PI/2,theta=i/RADIAL*Math.PI*2,r=ROLL.radius-BEVEL+BEVEL*Math.cos(a)
    const x=side*(HALF+BEVEL*Math.sin(a))
    p.push(x,r*Math.sin(theta),r*Math.cos(theta))
    n.push(side*Math.sin(a),Math.cos(a)*Math.sin(theta),Math.cos(a)*Math.cos(theta))
    uv.push(THREE.MathUtils.clamp((x+HALF)/(HALF*2),0,1),.25-theta/(Math.PI*2))
  }
  for(let j=0;j<3;j++)for(let i=0;i<RADIAL;i++) {
    const a=j*(RADIAL+1)+i,b=a+1,c=a+RADIAL+1,d=c+1
    if(side>0)index.push(a,c,b,b,c,d);else index.push(a,b,c,b,d,c)
  }
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3))
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index)
  return g
}

function cutEnd(side:number) {
  const p:number[]=[],n:number[]=[],uv:number[]=[],index:number[]=[]
  for(const r of [.065,ROLL.radius-BEVEL])for(let i=0;i<=RADIAL;i++) {
    const theta=i/RADIAL*Math.PI*2,y=Math.sin(theta)*r,z=Math.cos(theta)*r
    p.push(side*ROLL.length/2,y,z);n.push(side,0,0);uv.push(.5+y/(ROLL.radius*2),.5+z/(ROLL.radius*2))
  }
  for(let i=0;i<RADIAL;i++) {
    const a=i,b=a+1,c=a+RADIAL+1,d=c+1
    if(side>0)index.push(a,b,c,b,d,c);else index.push(a,c,b,b,c,d)
  }
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3))
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index)
  return g
}

function rollParts() {
  const body=new THREE.CylinderGeometry(ROLL.radius,ROLL.radius,HALF*2,RADIAL,3,true)
  body.rotateZ(Math.PI/2)
  const p=body.getAttribute('position'),uv=body.getAttribute('uv'),stops=[-HALF,-HALF+.016,-HALF+.024,HALF]
  for(let i=0;i<p.count;i++) {
    const x=stops[Math.floor(i/(RADIAL+1))],theta=.25-uv.getX(i)
    p.setX(i,x);uv.setXY(i,(x+HALF)/(HALF*2),theta)
  }
  const interior=new THREE.CylinderGeometry(.065,.065,ROLL.length,RADIAL,1,true)
  interior.rotateZ(Math.PI/2)
  const idx=interior.getIndex()!,normal=interior.getAttribute('normal')
  for(let i=0;i<idx.count;i+=3){const b=idx.getX(i+1);idx.setX(i+1,idx.getX(i+2));idx.setX(i+2,b)}
  for(let i=0;i<normal.count;i++)normal.setXYZ(i,-normal.getX(i),-normal.getY(i),-normal.getZ(i))
  return [{name:'roll-face',geometry:body},{name:'rim-left',geometry:shoulder(-1)},{name:'rim-right',geometry:shoulder(1)},
    {name:'cut-end-left',geometry:cutEnd(-1)},{name:'cut-end-right',geometry:cutEnd(1)},
    {name:'roll-interior',geometry:interior},{name:'draped-tail',geometry:makeRollTail()}]
}

export function makeTextileRoll() {
  const parts=rollParts(),geometry=mergeGeometries(parts.map(p=>p.geometry))!
  let start=0
  geometry.userData.parts=parts.map(part=>{
    const count=part.geometry.getAttribute('position').count,range={name:part.name,start,count}
    start+=count;part.geometry.dispose();return range
  })
  geometry.translate(0,ROLL.radius,0)
  return geometry
}

/** Two model meshes: woven cloth/rim and the planar wound cut ends. */
export function makeTextileSample(materials?:{cloth:THREE.Material;detail:THREE.Material}) {
  const parts=rollParts(),cloth:THREE.BufferGeometry[]=[],details:THREE.BufferGeometry[]=[]
  const face=new THREE.Color('#34495F'),reverse=new THREE.Color('#526476'),edge=new THREE.Color('#D5C8A9')
  for(const part of parts) {
    const g=part.geometry,p=g.getAttribute('position'),colours:number[]=[]
    for(let i=0;i<p.count;i++) {
      const cap=part.name.startsWith('cut-end')
      let colour=cap?new THREE.Color('white'):part.name==='roll-interior'?reverse:face
      if(!cap&&part.name!=='roll-interior'&&p.getX(i)<-HALF+.02)colour=edge
      if(part.name==='draped-tail'&&i>=p.count/2&&colour===face)colour=reverse
      colours.push(colour.r,colour.g,colour.b)
    }
    g.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));g.translate(0,ROLL.radius,0)
    ;(part.name.startsWith('cut-end')?details:cloth).push(g)
  }
  const group=new THREE.Group()
  const fabric=new THREE.Mesh(mergeGeometries(cloth)!,materials?.cloth??new THREE.MeshStandardMaterial({color:'white',vertexColors:true,roughness:.93,metalness:0}))
  fabric.name='indigo-fabric-roll'
  const ends=new THREE.Mesh(mergeGeometries(details)!,materials?.detail??new THREE.MeshStandardMaterial({color:'white',vertexColors:true,roughness:.96,metalness:0}))
  ends.name='wound-cut-ends';group.add(fabric,ends)
  for(const g of [...cloth,...details])g.dispose()
  return group
}
