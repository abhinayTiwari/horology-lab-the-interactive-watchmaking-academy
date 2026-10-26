import { describe, expect, it } from 'vitest';
import { movements } from '../content/movements';
import { gearModule, layerFor, meshDistance, meshPhaseError } from '../domain/alignment';
import { componentAngle, initialSimulation, rotateRotor, wind } from '../domain/kinematics';
import type { GearLink, Movement } from '../domain/types';

function pair(movement: Movement, link: GearLink) {
  const a = movement.parts.find(part => part.id === link.driver)!;
  const b = movement.parts.find(part => part.id === link.driven)!;
  return { a, b, ga: layerFor(a, link.driverLayer), gb: layerFor(b, link.drivenLayer) };
}

describe('assembled mesh geometry', () => {
  for (const movement of Object.values(movements)) {
    for (const link of [...movement.gears, ...(movement.windingGears ?? [])]) {
      it(`${movement.id}: ${link.driver} engages ${link.driven} at matching pitch, height and tooth phase`, () => {
        const { a, b, ga, gb } = pair(movement, link);
        expect(Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1])).toBeCloseTo(meshDistance(ga, gb), 12);
        expect(a.position[2] + ga.z).toBeCloseTo(b.position[2] + gb.z, 12);
        expect(ga.thickness).toBe(gb.thickness);
        expect(gearModule(ga)).toBeCloseTo(gearModule(gb), 12);
        expect(ga.teeth).toBe(link.driverTeeth);
        expect(gb.teeth).toBe(link.drivenTeeth);
        expect(meshPhaseError(a, ga, 0, b, gb, 0)).toBeLessThan(1e-10);
      });
    }
    it(`${movement.id}: tooth phases remain synchronized throughout running`, () => {
      for (const time of [0, 1 / 6, .5, 1, 2.75, 60, 3600]) {
        const sim = { ...initialSimulation(), time };
        for (const link of movement.gears) {
          const { a, b, ga, gb } = pair(movement, link);
          expect(meshPhaseError(a, ga, componentAngle(a.id, movement.id, sim), b, gb, componentAngle(b.id, movement.id, sim))).toBeLessThan(1e-8);
        }
      }
    });
    it(`${movement.id}: supported arbors and retaining screws meet their bridge seats`, () => {
      const bridge = movement.parts.find(part => part.id === 'bridge')!;
      for (const id of bridge.connects) {
        const supported = movement.parts.find(part => part.id === id)!;
        expect(bridge.supportPoints?.some(point => Math.hypot(point[0] + bridge.position[0] - supported.position[0], point[1] + bridge.position[1] - supported.position[1]) < 1e-10)).toBe(true);
        expect(supported.position[2] + supported.gear!.shaftTop).toBeCloseTo(bridge.position[2] + bridge.thickness / 2, 10);
      }
      for (const id of ['screw-a', 'screw-b']) {
        const screw = movement.parts.find(part => part.id === id)!;
        expect(bridge.supportPoints?.some(point => point[0] === screw.position[0] && point[1] === screw.position[1])).toBe(true);
      }
    });
  }

  it('fourth wheel drives the escape PINION, not the larger escape wheel', () => {
    const movement = movements.manual;
    const link = movement.gears.find(link => link.driver === 'fourth')!;
    const { a, b, ga, gb } = pair(movement, link);
    expect(ga.teeth).toBe(72);
    expect(gb.teeth).toBe(6);
    expect(Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1])).toBeCloseTo(.546, 12);
    expect(b.position[2] + layerFor(b).z).toBeGreaterThan(a.position[2] + ga.z + ga.thickness);
  });

  it('quartz has a real compound −30:1 reduction without an oversized fictitious wheel', () => {
    expect(movements.quartz.gears).toHaveLength(3);
    const ratio = movements.quartz.gears.reduce((product, link) => product * -link.driverTeeth / link.drivenTeeth, 1);
    expect(ratio).toBeCloseTo(-1 / 30, 12);
  });

  it('automatic clutch input and rectified output retain their respective mesh phases', () => {
    const movement = movements.automatic;
    let sim = initialSimulation();
    for (const change of [Math.PI / 3, -Math.PI, 2 * Math.PI, -.5]) {
      sim = rotateRotor(sim, change);
      for (const link of movement.windingGears!) {
        const { a, b, ga, gb } = pair(movement, link);
        const angleB = gb.independentMotion ? -sim.rotor * 50 / 30 : componentAngle(b.id, movement.id, sim);
        expect(meshPhaseError(a, ga, componentAngle(a.id, movement.id, sim), b, gb, angleB)).toBeLessThan(1e-9);
      }
    }
    const manuallyWound = wind(sim, 1);
    expect(manuallyWound.rotor).toBe(sim.rotor);
    for (const link of movement.windingGears!.slice(1)) {
      const { a, b, ga, gb } = pair(movement, link);
      expect(meshPhaseError(a, ga, componentAngle(a.id, movement.id, manuallyWound), b, gb, componentAngle(b.id, movement.id, manuallyWound))).toBeLessThan(1e-9);
    }
  });

  it('springs, winding arbor and balance share their correct centers', () => {
    for (const movement of [movements.manual, movements.automatic]) {
      for (const ids of [['barrel', 'spring', 'ratchet'], ['balance', 'hairspring']]) {
        const parts = ids.map(id => movement.parts.find(part => part.id === id)!);
        for (const part of parts.slice(1)) expect(part.position.slice(0, 2)).toEqual(parts[0].position.slice(0, 2));
      }
    }
  });
});
