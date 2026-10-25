import { describe, expect, it, beforeEach } from 'vitest';
import { advance, divider, drivenVelocity, explodedPosition, initialSimulation, mechanism, rotateRotor, wind, TAU, drift } from '../domain/kinematics';
import { movements } from '../content/movements';
import { assemblySteps, canInstall, canRemove } from '../domain/assembly';
import { evaluateAnswer, lessons } from '../content/lessons';
import { useLab } from '../state/store';
describe('independent movement transforms',()=>{
 for(const movement of Object.values(movements)){
  it(`${movement.id}: has unique valid component references`,()=>{expect(new Set(movement.parts.map(p=>p.id)).size).toBe(movement.parts.length);for(const id of movement.energyPath)expect(movement.parts.some(p=>p.id===id)).toBe(true);});
  it(`${movement.id}: explosion is deterministic and reversible at 0, 50 and 100%`,()=>{for(const p of movement.parts){expect(explodedPosition(p,0)).toEqual(p.position);expect(explodedPosition(p,.5)).toEqual(p.position.map((v,i)=>v+p.explode[i]*.5));expect(explodedPosition(p,1)).toEqual(p.position.map((v,i)=>v+p.explode[i]));expect(explodedPosition(p,0)).toEqual(p.position);}});
 }
 it('bounds explosion input',()=>{const p=movements.manual.parts[0];expect(explodedPosition(p,-1)).toEqual(p.position);expect(explodedPosition(p,2)).toEqual(explodedPosition(p,1));});
});
describe('coherent kinematics',()=>{
 it('external gears conserve tooth passage and reverse direction',()=>{expect(drivenVelocity(2,60,20)).toBe(-6);expect(drivenVelocity(-6,20,60)).toBe(2);});
 it('rejects invalid teeth and divider parameters',()=>{expect(()=>drivenVelocity(1,30,0)).toThrow();expect(()=>drivenVelocity(1,3.2,20)).toThrow();expect(()=>divider(32768,-1)).toThrow();});
 it('divides 32768 into exact pulses',()=>{expect(divider(32768,15)).toBe(1);expect(divider(32768,16)).toBe(.5);expect(mechanism(.999,'quartz').pulses).toBe(0);expect(mechanism(1,'quartz').motor).toBe(Math.PI);expect(mechanism(60,'quartz').seconds).toBeCloseTo(-TAU);});
 it('couples escape events to six balance beats per second',()=>{const k=mechanism(1,'manual');expect(k.beats).toBe(6);expect(k.escape).toBeCloseTo(-TAU/5);expect(mechanism(1/6,'manual').event).not.toBe(mechanism(0,'manual').event);});
 it('has a one-minute fourth wheel and one-hour center wheel',()=>{expect(mechanism(60,'manual').fourth).toBeCloseTo(TAU);expect(mechanism(3600,'manual').center).toBeCloseTo(TAU);});
 it('satisfies every declared mechanical gear ratio',()=>{const k=mechanism(10,'manual');const angles:Record<string,number>={barrel:k.barrel,center:k.center,third:k.third,fourth:k.fourth,escape:k.escape};for(const g of movements.manual.gears)expect(angles[g.driven]).toBeCloseTo(drivenVelocity(angles[g.driver],g.driverTeeth,g.drivenTeeth));});
 it('pauses, advances deterministically, and cannot run on exhausted mechanical energy',()=>{const s=initialSimulation();expect(advance(s,1,false,1,'manual')).toBe(s);expect(advance(s,1,true,2,'manual').time).toBe(2);const a=advance(advance(s,.5,true,1,'manual'),.5,true,1,'manual'),b=advance(s,1,true,1,'manual');expect(a.time).toBe(b.time);expect(a.energy).toBeCloseTo(b.energy);expect(advance({...s,energy:0},100,true,1,'manual').time).toBe(0);});
 it('consumes exactly the remaining reserve before stopping',()=>{const s={...initialSimulation(),energy:1/172800};const out=advance(s,5,true,1,'manual');expect(out.time).toBeCloseTo(1);expect(out.energy).toBe(0);});
 it('both rotor directions wind and reserve is bounded',()=>{const s=initialSimulation();expect(rotateRotor(s,TAU).energy).toBeGreaterThan(s.energy);expect(rotateRotor(s,-TAU).energy).toEqual(rotateRotor(s,TAU).energy);expect(wind(s,100).energy).toBe(1);});
 it('calculates signed accumulated error',()=>expect(drift(-4,15)).toBe(-60));
});
describe('workbench rules',()=>{
 it('requires preparation and correct removal order',()=>{expect(canRemove('screw-a',[],false)).toBe(false);expect(canRemove('bridge',[],true)).toBe(false);expect(canRemove('bridge',['screw-a'],true)).toBe(false);expect(canRemove('bridge',['screw-a','screw-b'],true)).toBe(true);expect(canRemove('unknown',[],true)).toBe(false);});
 it('completes a removal and reverse installation cycle',()=>{let removed:string[]=[];for(const s of assemblySteps){expect(canRemove(s.part,removed,true)).toBe(true);removed.push(s.part);}expect(canInstall('bridge',removed)).toBe(false);for(const s of [...assemblySteps].reverse()){expect(canInstall(s.part,removed)).toBe(true);removed=removed.filter(id=>id!==s.part);}expect(removed).toEqual([]);});
});
describe('selection, learning and persistence',()=>{
 beforeEach(()=>{useLab.setState({completed:[]});useLab.getState().setMovement('manual');});
 it('selection and reset use one source of truth',()=>{useLab.getState().select('third');expect(useLab.getState().selected).toBe('third');useLab.getState().setExplosion(.5);useLab.getState().step();useLab.getState().reset();expect(useLab.getState().sim).toEqual(initialSimulation());expect(useLab.getState().playing).toBe(false);expect(useLab.getState().explosion).toBe(0);});
 it('moves selection to a valid part when switching architectures',()=>{useLab.getState().setMovement('quartz');expect(useLab.getState().selected).toBe('crystal');expect(useLab.getState().hidden).toEqual([]);});
 it('evaluates all quizzes and prevents duplicate completion',()=>{for(const l of lessons){expect(evaluateAnswer(l,l.answer)).toBe(true);expect(evaluateAnswer(l,(l.answer+1)%l.options.length)).toBe(false);}useLab.getState().complete('gears');useLab.getState().complete('gears');expect(useLab.getState().completed).toEqual(['gears']);});
 it('writes and restores progress through localStorage',async()=>{useLab.getState().complete('movement');expect(JSON.parse(localStorage.getItem('horology-lab-v1')!).state.completed).toEqual(['movement']);useLab.setState({completed:[]});localStorage.setItem('horology-lab-v1',JSON.stringify({state:{completed:['movement']},version:1}));await useLab.persist.rehydrate();expect(useLab.getState().completed).toEqual(['movement']);});
});
