import { Component, Suspense, useMemo, useRef, useState, useEffect } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useShallow } from 'zustand/react/shallow';
import { OrbitControls, Line, Environment, Lightformer } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useLab } from '../../state/store';
import { movements } from '../../content/movements';
import { explodedPosition, componentAngle, TAU } from '../../domain/kinematics';
import type { Part } from '../../domain/types';
import { measureGearMeshes } from './sceneMeasurements';
import { CompoundGear, SupportedBridge, AlignedPallet } from './CompoundParts';
import { gearShape, plateShape, rotorShape, spiralPoints } from './geometry';

function PartGeometry({part,selected,muted,hovered}:{part:Part;selected:boolean;muted:boolean;hovered:boolean}) {
 const cutaway=useLab(s=>s.cutaway);
 const geometry=useMemo(()=> {
   if(part.shape==='gear'&&!part.gear)return new THREE.ExtrudeGeometry(gearShape(part.radius,part.id==='escape'?15:Math.max(20,Math.round(part.radius*65))),{depth:part.thickness,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.012,bevelThickness:.009});
   if(part.shape==='plate'||part.shape==='rotor')return new THREE.ExtrudeGeometry(part.shape==='rotor'?rotorShape(part.radius):plateShape(part.radius,cutaway,part.bearingPoints),{depth:part.thickness,curveSegments:96,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:2});
   return undefined;
 },[part,cutaway]);
 useEffect(()=>()=>geometry?.dispose(),[geometry]);
 const material=<meshStandardMaterial color={selected?'#e2bf77':hovered?'#e1d3b4':part.color} metalness={.78} roughness={selected?.25:.34} transparent={muted} opacity={muted?.16:1} depthWrite={!muted} emissive={selected?'#b58a38':'#000'} emissiveIntensity={.16}/>;
 const cyl=(r:number,h:number,z=0)=><mesh rotation={[Math.PI/2,0,0]} position={[0,0,z]}><cylinderGeometry args={[r,r,h,48]}/>{material}</mesh>;
 if(part.gear&&part.shape!=='rotor')return <CompoundGear part={part} material={material}/>;
 if(part.supportPoints)return <SupportedBridge part={part} material={material}/>;
 if(part.palletTargets)return <AlignedPallet part={part} material={material}/>;
 if(geometry)return <><mesh geometry={geometry}>{material}</mesh>{part.shape==='gear'&&<>{cyl(part.radius*.16,.26,.05)}<mesh position={[0,0,part.thickness+.01]}><torusGeometry args={[part.radius*.79,.012,6,64]}/>{material}</mesh></>}{part.shape==='rotor'&&<>{part.gear&&<CompoundGear part={part} material={material}/>}<mesh position={[0,0,.04]}><boxGeometry args={[part.radius*1.5,.2,.12]}/>{material}</mesh>{cyl(.25,.3,.07)}</>}</>;
 if(part.shape==='spring')return <Line points={spiralPoints(part.radius)} color={selected?'#ffdc92':part.color} lineWidth={part.id==='spring'?2.5:1.4} transparent={muted} opacity={muted?.16:1}/>;
 if(part.shape==='balance')return <><mesh><torusGeometry args={[part.radius,.052,12,80]}/>{material}</mesh>{[0,Math.PI/2].map(a=><mesh key={a} rotation={[0,0,a]}><boxGeometry args={[part.radius*2,.055,.06]}/>{material}</mesh>)}{cyl(.065,.44,-.08)}{part.arborBottom!==undefined&&cyl(.025,.22-part.arborBottom,(.22+part.arborBottom)/2)}{Array.from({length:12},(_,i)=><mesh key={i} position={[Math.cos(i*TAU/12)*part.radius,Math.sin(i*TAU/12)*part.radius,.045]}><sphereGeometry args={[.04,8,8]}/>{material}</mesh>)}</>;
 if(part.shape==='bridge')return <><mesh><boxGeometry args={[part.radius*1.7,.32,part.thickness]}/>{material}</mesh>{[-1,1].map(i=><group key={i} position={[i*part.radius*.8,0,0]}>{cyl(.22,part.thickness)}</group>)}<mesh position={[0,0,part.thickness/2+.01]}><boxGeometry args={[part.radius*1.3,.012,.008]}/><meshStandardMaterial color="#c2c9c6"/></mesh></>;
 if(part.shape==='screw')return <>{cyl(part.radius,part.thickness)}<mesh position={[0,0,part.thickness/2+.002]} rotation={[0,0,.6]}><boxGeometry args={[part.radius*1.6,.025,.012]}/><meshStandardMaterial color="#182729"/></mesh></>;
 if(part.shape==='jewel')return <>{cyl(part.radius,part.thickness)}<mesh position={[0,0,part.thickness]}><torusGeometry args={[part.radius*.6,.024,8,32]}/><meshStandardMaterial color="#e993b1" metalness={.3} roughness={.15}/></mesh></>;
 if(part.shape==='battery')return <>{cyl(part.radius,part.thickness)}<mesh position={[0,0,part.thickness/2+.01]}><torusGeometry args={[part.radius*.89,.02,8,64]}/>{material}</mesh><mesh position={[0,0,.15]}><boxGeometry args={[.28,.035,.01]}/><meshStandardMaterial color="#485257"/></mesh><mesh position={[0,0,.15]}><boxGeometry args={[.035,.28,.01]}/><meshStandardMaterial color="#485257"/></mesh></>;
 if(part.shape==='stem')return <><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.065,.065,.95,16]}/>{material}</mesh><mesh position={[.48,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.23,.23,.25,24]}/>{material}</mesh></>;
 if(part.shape==='hand')return <><mesh position={[0,part.radius/2,0]}><boxGeometry args={[part.id==='seconds'?.025:.075,part.radius,part.thickness]}/>{material}</mesh>{cyl(.1,.06)}</>;
 if(part.shape==='fork')return <><mesh rotation={[0,0,.35]}><boxGeometry args={[.65,.07,.07]}/>{material}</mesh>{[-1,1].map(i=><mesh key={i} position={[.25,i*.15,0]}><boxGeometry args={[.1,.22,.07]}/><meshStandardMaterial color="#ae315a"/></mesh>)}{cyl(.07,.17)}</>;
 if(part.shape==='coil')return <><mesh><boxGeometry args={[1,.2,.17]}/><meshStandardMaterial color="#869499" metalness={.8} roughness={.3}/></mesh>{Array.from({length:25},(_,i)=><mesh key={i} position={[-.3+i*.025,0,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.2,.018,6,24]}/>{material}</mesh>)}</>;
 if(part.shape==='crystal')return <mesh><capsuleGeometry args={[.13,.44,8,20]}/>{material}</mesh>;
 return <><mesh><boxGeometry args={[part.radius*1.7,part.radius*1.3,.14]}/>{material}</mesh>{Array.from({length:6},(_,i)=><mesh key={i} position={[(i%3-1)*.15,i<3?part.radius*.8:-part.radius*.8,0]}><boxGeometry args={[.055,.22,.035]}/><meshStandardMaterial color="#c3ae73" metalness={.7} roughness={.4}/></mesh>)}</>;
}
type LabelNodes = RefObject<Record<string,HTMLSpanElement|null>>;
function MovementPart({part,probe,labelNodes}:{part:Part;probe:RefObject<HTMLDivElement|null>;labelNodes:LabelNodes}) {
 const group=useRef<THREE.Group>(null);const moving=useRef<THREE.Group>(null);const [hovered,setHovered]=useState(false);
 const {selected,explosion,hidden,isolated,transparent,select,overlays}=useLab(useShallow(s=>({selected:s.selected,explosion:s.explosion,hidden:s.hidden,isolated:s.isolated,transparent:s.transparent,select:s.select,overlays:s.overlays})));
 const visible=!hidden.includes(part.id)&&(!isolated||isolated===part.id);
 const position=explodedPosition(part,explosion);
 const projected=useMemo(()=>new THREE.Vector3(),[]);
 useFrame(({camera,size})=>{
  if(!moving.current||!group.current)return;
  const {sim,movement}=useLab.getState();moving.current.rotation.z=componentAngle(part.id,movement,sim);
  const label=labelNodes.current[part.id];
  if(label){group.current.updateWorldMatrix(true,false);projected.set(part.radius*.5,part.radius*.65,part.gear&&part.shape!=='rotor'?Math.max(...part.gear.layers.map(layer=>layer.z+layer.thickness))+.1:.2);group.current.localToWorld(projected);projected.project(camera);label.style.transform=`translate(${(projected.x*.5+.5)*size.width}px,${(-projected.y*.5+.5)*size.height}px) translate(-50%,-50%)`;label.style.visibility=projected.z>-1&&projected.z<1?'visible':'hidden';}
  if(part.id===selected&&probe.current){probe.current.dataset.worldPosition=group.current.position.toArray().join(',');probe.current.dataset.rotation=String(moving.current.rotation.z);}
 });
 if(!visible)return null;
 const active=selected===part.id;
 return <group ref={group} position={position} onClick={e=>{e.stopPropagation();select(part.id);}} onPointerOver={e=>{e.stopPropagation();setHovered(true);document.body.style.cursor='pointer';}} onPointerOut={()=>{setHovered(false);document.body.style.cursor='auto';}}>
  <group ref={moving}><PartGeometry part={part} selected={active} muted={transparent&&!active} hovered={hovered}/></group>
  {active&&overlays.includes('directions')&&<Line points={Array.from({length:40},(_,i)=>[Math.cos(i/39*5)*part.radius*1.3,Math.sin(i/39*5)*part.radius*1.3,.1])} color="#87c9ba" lineWidth={2}/>}
 </group>;
}
function Rig() {
 const controls=useRef<OrbitControlsImpl>(null);const {camera}=useThree();const view=useLab(s=>s.camera);const revision=useLab(s=>s.cameraRevision);const isolated=useLab(s=>s.isolated);
 useEffect(()=>{camera.up.set(0,0,1);camera.position.set(...(view==='top'?[0,-.01,12]:view==='side'?[0,-12,1.6]:[5,-7.5,9]) as [number,number,number]);controls.current?.target.set(0,0,.65);if(isolated){const state=useLab.getState();const part=movements[state.movement].parts.find(p=>p.id===isolated);if(part){const point=explodedPosition(part,state.explosion);controls.current?.target.set(...point);camera.position.set(point[0]+3,point[1]-5,point[2]+5);}}controls.current?.update();},[camera,view,revision,isolated]);
 return <OrbitControls ref={controls} makeDefault enableDamping minDistance={4} maxDistance={23} target={[0,0,.65]}/>;
}
function Scene({probe,labelNodes}:{probe:RefObject<HTMLDivElement|null>;labelNodes:LabelNodes}) {
 const {movement,explosion,overlays,performance}=useLab(useShallow(s=>({movement:s.movement,explosion:s.explosion,overlays:s.overlays,performance:s.performance})));const definition=movements[movement];
 const invalidate=useThree(state=>state.invalidate);
 useEffect(()=>useLab.subscribe((state,previous)=>{if(state.sim!==previous.sim)invalidate();}),[invalidate]);
 const lastMeasurement=useRef(0);
 useFrame((frame,delta)=>{
   useLab.getState().tick(Math.min(delta,.1));
   if(import.meta.env.DEV&&probe.current&&(!useLab.getState().playing||frame.clock.elapsedTime-lastMeasurement.current>.15)){
     lastMeasurement.current=frame.clock.elapsedTime;
     probe.current.dataset.gearMeshes=JSON.stringify(measureGearMeshes(frame.scene,definition));
   }
 });
 const pathIds=overlays.includes('energy')?definition.energyPath:movement==='quartz'?[]:definition.energyPath.slice(0,definition.energyPath.indexOf('spring')+1);
 const path=pathIds.map(id=>definition.parts.find(p=>p.id===id)).filter((p):p is Part=>!!p).map(p=>{const v=explodedPosition(p,explosion);return [v[0],v[1],v[2]+(p.gear&&p.shape!=='rotor'?Math.max(...p.gear.layers.map(layer=>layer.z+layer.thickness)):.15)+.1] as [number,number,number];});
 return <><ambientLight intensity={.65}/><directionalLight position={[2,-4,9]} intensity={3}/><directionalLight position={[-5,3,4]} color="#b5ced7" intensity={2}/><pointLight position={[0,4,6]} intensity={25} color="#f4d6a0"/>
 <Environment resolution={performance?64:128}><Lightformer intensity={3} position={[0,0,6]} scale={[8,3,1]}/><Lightformer intensity={2} position={[-4,2,2]} rotation={[0,Math.PI/2,0]} scale={[5,5,1]}/></Environment>
 {definition.parts.map(part=><MovementPart key={movement+part.id} part={part} probe={probe} labelNodes={labelNodes}/>)}
 {path.length>1&&(overlays.includes('energy')||overlays.includes('winding'))&&<Line points={path} color="#7ac5b3" lineWidth={2} dashed dashSize={.13} gapSize={.08}/>}
 <Rig/></>;
}
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="canvas-error"><h3>3D rendering is unavailable</h3><p>Your browser could not initialize the movement. Try enabling hardware acceleration. The component list, lessons and experiments remain available.</p><button onClick={()=>this.setState({failed:false})}>Retry 3D view</button></div>:this.props.children;}
}
export function MovementScene() {
 const probe=useRef<HTMLDivElement>(null);const labelNodes=useRef<Record<string,HTMLSpanElement|null>>({});const {performance,movement,labels,selected,hidden,isolated,playing,reducedMotion}=useLab(useShallow(s=>({performance:s.performance,movement:s.movement,labels:s.labels,selected:s.selected,hidden:s.hidden,isolated:s.isolated,playing:s.playing,reducedMotion:s.reducedMotion})));
 return <div className="scene" ref={probe} data-testid="movement-scene" role="img" aria-label="Interactive 3D movement. Drag to orbit, scroll to zoom. Select any part using the component list."><SceneBoundary><Suspense fallback={<div className="canvas-error">Preparing your movement...</div>}><Canvas frameloop={playing&&!reducedMotion?'always':'demand'} camera={{position:[5,-7.5,9],fov:39,near:.1,far:100,up:[0,0,1]}} dpr={performance?1:[1,1.75]} gl={{antialias:!performance,alpha:true}} fallback={<div className="canvas-error">WebGL is unavailable. Use the component list and lessons to explore this movement.</div>}><Scene probe={probe} labelNodes={labelNodes}/></Canvas></Suspense></SceneBoundary><div className="scene-label-layer" aria-hidden="true">{movements[movement].parts.filter(p=>(labels||selected===p.id)&&!hidden.includes(p.id)&&(!isolated||isolated===p.id)).map(p=><span key={p.id} ref={node=>{labelNodes.current[p.id]=node;}} className={`part-label ${selected===p.id?'selected':''}`}><i/>{p.name}</span>)}</div></div>;
}
