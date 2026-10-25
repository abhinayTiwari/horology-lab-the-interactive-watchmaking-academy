import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { browserStorage } from './storage';
import { initialSimulation, advance, wind, rotateRotor } from '../domain/kinematics';
import type { Simulation } from '../domain/kinematics';
import type { MovementId } from '../domain/types';
export type Overlay = 'energy'|'ratios'|'phase'|'pulses'|'directions'|'winding';
interface LabState {
 movement: MovementId; selected: string; explosion: number; playing: boolean; speed: number; sim: Simulation;
 hidden: string[]; isolated: string|null; transparent: boolean; labels: boolean; cutaway: boolean; overlays: Overlay[];
 engineering: boolean; theme: 'dark'|'light'; contrast: boolean; reducedMotion: boolean; performance: boolean; completed: string[];
 camera: 'perspective'|'top'|'side'; cameraRevision: number;
 setMovement: (id: MovementId)=>void; select:(id:string)=>void; setExplosion:(n:number)=>void;
 tick:(dt:number)=>void; step:()=>void; wind:()=>void; rotor:(r:number)=>void; reset:()=>void;
 toggleHidden:(id:string)=>void; resetVisibility:()=>void; toggleOverlay:(id:Overlay)=>void; complete:(id:string)=>void;
}
export const useLab = create<LabState>()(persist((set,get)=>({
 movement:'manual',selected:'balance',explosion:0,playing:true,speed:.25,sim:initialSimulation(),
 hidden:[],isolated:null,transparent:false,labels:false,cutaway:false,overlays:[],engineering:false,theme:'dark',contrast:false,
 reducedMotion:typeof matchMedia!=='undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,performance:false,completed:[],camera:'perspective',cameraRevision:0,
 setMovement:(movement)=>set({movement,selected:movement==='quartz'?'crystal':'balance',sim:initialSimulation(),hidden:[],isolated:null,explosion:0}),
 select:selected=>set({selected}),setExplosion:explosion=>set({explosion:Math.max(0,Math.min(1,explosion))}),
 tick:dt=>{const s=get();set({sim:advance(s.sim,dt,s.playing && !s.reducedMotion,s.speed,s.movement)});},
 step:()=>{const s=get();set({playing:false,sim:advance(s.sim,s.movement==='quartz'?1:1/6,true,1,s.movement)});},
 wind:()=>set(s=>({sim:wind(s.sim,1)})),rotor:r=>set(s=>({sim:rotateRotor(s.sim,r)})),
 reset:()=>set({sim:initialSimulation(),playing:false,explosion:0,hidden:[],isolated:null,transparent:false}),
 toggleHidden:id=>set(s=>({hidden:s.hidden.includes(id)?s.hidden.filter(v=>v!==id):[...s.hidden,id]})),
 resetVisibility:()=>set({hidden:[],isolated:null,transparent:false}),
 toggleOverlay:id=>set(s=>({overlays:s.overlays.includes(id)?s.overlays.filter(v=>v!==id):[...s.overlays,id]})),
 complete:id=>set(s=>({completed:[...new Set([...s.completed,id])]})),
}),{name:'horology-lab-v1',version:1,storage:createJSONStorage(()=>browserStorage),partialize:s=>({completed:s.completed,engineering:s.engineering,theme:s.theme,contrast:s.contrast,reducedMotion:s.reducedMotion,performance:s.performance})}));
// A future account adapter can implement this without coupling lessons to authentication.
export interface ProgressSync { load():Promise<string[]>; save(completed:string[]):Promise<void> }

