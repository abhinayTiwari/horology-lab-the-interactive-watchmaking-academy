import { cloneElement, isValidElement, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLab } from '../../state/store';
import { gearModule } from '../../domain/alignment';
import { componentAngle } from '../../domain/kinematics';
import type { GearLayer, Part, Vec3 } from '../../domain/types';

/** Schematic tooth profile with a real pitch circle and module-sized clearance. */
export function compoundGearShape(layer: GearLayer, holes: boolean) {
  const shape = new THREE.Shape();
  const module = gearModule(layer), pitch = Math.PI * 2 / layer.teeth;
  const root = layer.pitchRadius - module * 1.15;
  const tip = layer.pitchRadius + module * .85;
  // At the pitch circle a tooth occupies slightly less than half a tooth pitch.
  // Small pinions use broad roots; profiles are illustrative, not cuttable CAD.
  const samples = [[-.5, root], [-.36, root], [-.235, layer.pitchRadius], [-.13, tip], [.13, tip], [.235, layer.pitchRadius], [.36, root], [.5, root]];
  for (let tooth = 0; tooth < layer.teeth; tooth++) {
    for (let i = 0; i < samples.length; i++) {
      const [fraction, radius] = samples[i], angle = (tooth + fraction) * pitch;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      if (tooth === 0 && i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
  }
  shape.closePath();
  if (holes && layer.teeth >= 15) {
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      const hole = new THREE.Path();
      hole.absarc(Math.cos(angle) * layer.pitchRadius * .53, Math.sin(angle) * layer.pitchRadius * .53, layer.pitchRadius * .17, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  }
  return shape;
}

function GearDisc({ part, layer, material }: { part: Part; layer: GearLayer; material: ReactNode }) {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(compoundGearShape(layer, layer.teeth >= 15 && part.id !== 'barrel'), {
    depth: layer.thickness, bevelEnabled: false, steps: 1,
  }), [layer, part.id]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (!mesh.current || !layer.independentMotion) return;
    const { sim, movement } = useLab.getState();
    // The reversing clutch's input can turn independently of its rectified output.
    mesh.current.rotation.z = layer.phase - sim.rotor * 50 / 30 - componentAngle(part.id, movement, sim);
  });
  const isPinion = layer.teeth <= 10 || layer.independentMotion;
  const pinionMaterial = isValidElement<{color:string;emissive:string}>(material)
    ? cloneElement(material,{color:material.props.emissive!=='#000'?material.props.color:'#c5ced0'}) : material;
  return <mesh name={`gear-layer:${part.id}:${layer.id}`} ref={mesh} geometry={geometry} position={[0, 0, layer.z]} rotation={[0, 0, layer.phase]} userData={{ pitchRadius: layer.pitchRadius, teeth: layer.teeth }}>
    {isPinion ? pinionMaterial : material}
  </mesh>;
}

export function CompoundGear({ part, material }: { part: Part; material: ReactNode }) {
  const assembly = part.gear!;
  const shaftRadius = Math.min(.035, ...assembly.layers.map(layer => layer.pitchRadius * .3));
  return <>
    {assembly.layers.map(layer => <GearDisc key={layer.id} part={part} layer={layer} material={material} />)}
    <mesh position={[0, 0, (assembly.shaftBottom + assembly.shaftTop) / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[shaftRadius, shaftRadius, assembly.shaftTop - assembly.shaftBottom, 16]} />
      {material}
    </mesh>
    {assembly.layers.map(layer => <mesh key={layer.id} position={[0, 0, layer.z + layer.thickness / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[shaftRadius * 1.65, shaftRadius * 1.65, layer.thickness + .02, 24]} />{material}
    </mesh>)}
  </>;
}

function Beam({ from, to, width, thickness, material }: { from: Vec3; to: Vec3; width: number; thickness: number; material: ReactNode }) {
  return <mesh position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0]} rotation={[0, 0, Math.atan2(to[1] - from[1], to[0] - from[0])]}>
    <boxGeometry args={[Math.hypot(to[0] - from[0], to[1] - from[1]), width, thickness]} />{material}
  </mesh>;
}

export function SupportedBridge({ part, material }: { part: Part; material: ReactNode }) {
  const anchors = part.supportPoints!;
  return <>
    {anchors.slice(1).map((point, i) => <Beam key={i} from={anchors[i]} to={point} width={.13} thickness={part.thickness} material={material} />)}
    {anchors.map((point, i) => <group key={i} position={point}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.14, .14, part.thickness, 32]} />{material}</mesh>
      <mesh position={[0, 0, part.thickness / 2 + .012]}><torusGeometry args={[.055, .018, 8, 24]} /><meshStandardMaterial color="#a53658" metalness={.3} roughness={.25} /></mesh>
    </group>)}
  </>;
}

export function AlignedPallet({ part, material }: { part: Part; material: ReactNode }) {
  const { escape, balance, escapeRadius } = part.palletTargets!;
  const bearing = Math.atan2(-escape[1], -escape[0]);
  const stones: Vec3[] = [-.54, .54].map(delta => [escape[0] + Math.cos(bearing + delta) * escapeRadius, escape[1] + Math.sin(bearing + delta) * escapeRadius, 0]);
  const balanceBearing = Math.atan2(balance[1], balance[0]);
  const roller: Vec3 = [balance[0] - Math.cos(balanceBearing) * .09, balance[1] - Math.sin(balanceBearing) * .09, 0];
  return <>
    <Beam from={[0, 0, 0]} to={roller} width={.05} thickness={.055} material={material} />
    {stones.map((stone, i) => <group key={i}>
      <Beam from={[0, 0, 0]} to={stone} width={.055} thickness={.055} material={material} />
      <mesh position={[stone[0], stone[1], .035]} rotation={[0, 0, bearing + (i === 0 ? -.54 : .54)]}><boxGeometry args={[.07, .09, .07]} /><meshStandardMaterial color="#c64975" roughness={.2} metalness={.25} /></mesh>
    </group>)}
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.045, .045, .18, 16]} />{material}</mesh>
    {part.arborBottom!==undefined&&<mesh position={[0,0,(part.arborBottom+.09)/2]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.025,.025,.09-part.arborBottom,16]}/>{material}</mesh>}
  </>;
}
