import type { Part, Vec3, MovementId } from './types';
export const TAU = Math.PI * 2;
export const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
export function explodedPosition(part: Part, fraction: number): Vec3 {
  const t = clamp(fraction); const smooth = t * t * (3 - 2 * t);
  return part.position.map((v, i) => v + part.explode[i] * smooth) as Vec3;
}
export function drivenVelocity(input: number, driverTeeth: number, drivenTeeth: number) {
  if (!Number.isFinite(input) || !Number.isInteger(driverTeeth) || !Number.isInteger(drivenTeeth) || driverTeeth <= 0 || drivenTeeth <= 0) throw new Error('Tooth counts must be positive integers and speed must be finite.');
  return -input * driverTeeth / drivenTeeth;
}
export function divider(frequency: number, stages: number) {
  if (!Number.isFinite(frequency) || frequency <= 0 || !Number.isInteger(stages) || stages < 0 || stages > 30) throw new Error('Invalid divider parameters.');
  return frequency / 2 ** stages;
}
export const drift = (secondsPerDay: number, days: number) => secondsPerDay * days;
export interface Simulation { time: number; energy: number; rotor: number; winding: number }
export const initialSimulation = (): Simulation => ({ time: 0, energy: .72, rotor: 0, winding: 0 });
export function advance(s: Simulation, dt: number, playing: boolean, speed: number, movement: MovementId): Simulation {
  if (!playing || dt <= 0 || !Number.isFinite(dt) || !Number.isFinite(speed) || speed <= 0) return s;
  const elapsed = dt * speed;
  const active = movement === 'quartz' ? elapsed : Math.min(elapsed, s.energy * 48 * 3600);
  return { ...s, time: s.time + active, energy: movement === 'quartz' ? s.energy : clamp(s.energy - active / (48 * 3600)) };
}
export function wind(s: Simulation, turns: number): Simulation { return { ...s, energy: clamp(s.energy + Math.abs(turns) * .012), winding: s.winding + Math.abs(turns) * TAU }; }
export function rotateRotor(s: Simulation, radians: number): Simulation { return { ...wind(s, radians / TAU * .15), rotor: s.rotor + radians }; }
// Idealized 3 Hz lever: two releases per oscillation, 15-tooth escape wheel, half tooth per release.
export function mechanism(time: number, movement: MovementId) {
  const beats = Math.floor((time + 1e-9) * 6);
  const escape = -beats * TAU / 30;
  const fourth = -escape / 12;
  const third = -fourth / 8;
  const center = -third / 7.5;
  const barrel = -center / 8;
  const pulses = Math.floor(time + 1e-9);
  return { balance: Math.sin(time * TAU * 3) * 4.3, fork: (beats % 2 ? 1 : -1) * .23,
    escape, fourth, third, center, barrel, seconds: movement === 'quartz' ? -pulses * TAU / 60 : -fourth,
    minute: movement === 'quartz' ? -pulses * TAU / 3600 : -center, hour: movement === 'quartz' ? -pulses * TAU / 43200 : -center / 12, motor: pulses * Math.PI, pulses, beats,
    phase: (time * 3 % 1), event: beats % 2 ? 'Exit pallet locked' : 'Entry pallet locked' };
}

