import type { AssemblyStep } from './types';
export const assemblySteps: AssemblyStep[] = [
  {part:'screw-a',tool:'Screwdriver',blockers:[],instruction:'Remove bridge screw A with a correctly fitted screwdriver.',caution:'Keep downward pressure controlled; a slipping blade can damage nearby parts.'},
  {part:'screw-b',tool:'Screwdriver',blockers:[],instruction:'Remove bridge screw B and place it in the tray.',caution:'Keep similar screws separated; their lengths may differ in real movements.'},
  {part:'bridge',tool:'Tweezers',blockers:['screw-a','screw-b'],instruction:'Lift the train bridge evenly from its locating points.',caution:'Never force a bridge. Pivots are delicate and can remain caught in their bearings.'},
  {part:'center',tool:'Tweezers',blockers:['bridge'],instruction:'Lift the center wheel vertically by its hub.',caution:'Avoid holding teeth or touching polished pivots.'},
  {part:'third',tool:'Tweezers',blockers:['bridge','center'],instruction:'Lift out the third wheel and preserve its orientation.',caution:'Keep the part free of fingerprints and dust.'},
  {part:'fourth',tool:'Tweezers',blockers:['bridge','third'],instruction:'Lift out the fourth wheel and inspect its fine pivots.',caution:'A seconds arbor is easily bent. This sequence is for the simplified model only.'},
];
export function canRemove(part: string, removed: string[], safe: boolean) {
  const step = assemblySteps.find(s=>s.part===part);
  return !!step && safe && !removed.includes(part) && step.blockers.every(id=>removed.includes(id));
}
export function canInstall(part: string, removed: string[]) {
  return removed.includes(part) && assemblySteps.filter(s=>s.blockers.includes(part)).every(s=>!removed.includes(s.part));
}
