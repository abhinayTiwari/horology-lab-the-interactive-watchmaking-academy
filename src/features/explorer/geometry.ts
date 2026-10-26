import * as THREE from 'three';
export function gearShape(radius: number, teeth: number) {
 const shape = new THREE.Shape();
 for(let i=0;i<teeth*4;i++) { const a=i/(teeth*4)*Math.PI*2; const r=radius*(i%4===0||i%4===3?.92:1); const x=Math.cos(a)*r,y=Math.sin(a)*r; if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y); }
 shape.closePath();
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2; const hole=new THREE.Path();hole.absarc(Math.cos(a)*radius*.53,Math.sin(a)*radius*.53,radius*.19,0,Math.PI*2,true);shape.holes.push(hole);}
 return shape;
}
export function rotorShape(radius: number) {
 const s=new THREE.Shape();s.absarc(0,0,radius,0,Math.PI,false);s.lineTo(-radius*.6,0);s.absarc(0,0,radius*.6,Math.PI,0,true);s.closePath();return s;
}
export function plateShape(radius: number, cutaway: boolean, bearings: [number,number,number][] = []) {
 const s=new THREE.Shape();s.absarc(0,0,radius,cutaway?Math.PI*.32:0,Math.PI*2,false);if(cutaway)s.lineTo(0,0);s.closePath();
 if(!cutaway) for(const [x,y] of bearings){const h=new THREE.Path();h.absarc(x,y,.045,0,Math.PI*2,true);s.holes.push(h);}
 return s;
}
export function spiralPoints(radius: number) { return Array.from({length:180},(_,i)=>{const t=i/179;const a=t*Math.PI*12;const r=radius*(.13+.83*t);return [Math.cos(a)*r,Math.sin(a)*r,.02] as [number,number,number];}); }
