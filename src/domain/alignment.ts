import type { GearLayer, GearLink, Movement, Part, Vec3 } from './types';

const TAU = Math.PI * 2;
const radians = (degrees: number) => degrees * Math.PI / 180;
const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function gearModule(layer: GearLayer) {
  return 2 * layer.pitchRadius / layer.teeth;
}

export function layerFor(part: Part, id = 'wheel'): GearLayer {
  const layer = part.gear?.layers.find(candidate => candidate.id === id);
  if (!layer) throw new Error(`Missing ${id} gear on ${part.id}`);
  return layer;
}

/** Pitch circles, rather than decorative outside radii, define shaft spacing. */
export function meshDistance(driver: GearLayer, driven: GearLayer) {
  return driver.pitchRadius + driven.pitchRadius;
}

/** Align a tooth on one gear with a space on the other at the line of centers. */
export function meshPhase(driver: GearLayer, driven: GearLayer, bearing: number) {
  return bearing + Math.PI - Math.PI / driven.teeth
    - driver.teeth / driven.teeth * (driver.phase - bearing);
}

function offset(origin: Vec3, length: number, degrees: number): Vec3 {
  return [origin[0] + Math.cos(radians(degrees)) * length,
    origin[1] + Math.sin(radians(degrees)) * length, origin[2]];
}

/** Solve a shaft constrained by two meshing neighbors; prefer the upper solution. */
function intersection(a: Vec3, ar: number, b: Vec3, br: number): Vec3 {
  const d = distance(a, b);
  if (d > ar + br || d < Math.abs(ar - br) || d === 0) throw new Error('Impossible gear layout');
  const along = (ar * ar - br * br + d * d) / (2 * d);
  const normal = Math.sqrt(Math.max(0, ar * ar - along * along));
  const dx = (b[0] - a[0]) / d, dy = (b[1] - a[1]) / d;
  const x = a[0] + along * dx, y = a[1] + along * dy;
  const candidates: Vec3[] = [[x - normal * dy, y + normal * dx, 0], [x + normal * dy, y - normal * dx, 0]];
  return candidates.sort((p, q) => q[1] - p[1])[0];
}

export function alignMovement(source: Movement): Movement {
  const movement: Movement = { ...source, energyPath: [...source.energyPath], parts: source.parts.map(part => ({ ...part, position: [...part.position] as Vec3, connects: [...part.connects] })), gears: source.gears.map(link => ({ ...link })) };
  const part = (id: string) => {
    const found = movement.parts.find(candidate => candidate.id === id);
    if (!found) throw new Error(`Missing part: ${id}`);
    return found;
  };
  const place = (id: string, point: Vec3, z = part(id).position[2]) => {
    part(id).position = [point[0], point[1], z];
  };
  const gear = (id: string, layers: [string, number, number, number][], bottom: number, top: number) => {
    const component = part(id);
    component.gear = { shaftBottom: (bottom === .035 ? -.25 : bottom) - component.position[2], shaftTop: top - component.position[2], layers: layers.map(([name, teeth, pitchRadius, height]) => ({ id: name, teeth, pitchRadius, z: height - component.position[2], phase: 0, thickness: .085 })) };
    component.radius = Math.max(...component.gear.layers.map(layer => layer.pitchRadius + gearModule(layer)));
  };
  const link = (driver: string, driven: string, driverLayer = 'wheel', drivenLayer = 'pinion'): GearLink => {
    const a = part(driver), b = part(driven), ga = layerFor(a, driverLayer), gb = layerFor(b, drivenLayer);
    const bearing = Math.atan2(b.position[1] - a.position[1], b.position[0] - a.position[0]);
    gb.phase = meshPhase(ga, gb, bearing);
    return { driver, driven, driverTeeth: ga.teeth, drivenTeeth: gb.teeth, driverLayer, drivenLayer };
  };
  const bridge = (id: string, supported: string[], height: number, screws = false) => {
    const component = part(id);
    component.position = [0, 0, height];
    component.thickness = .12;
    component.supportPoints = supported.map(name => [part(name).position[0], part(name).position[1], 0]);
    component.connects = supported;
    if (screws) {
      const first = component.supportPoints[0], last = component.supportPoints.at(-1)!;
      const firstSeat: Vec3 = [first[0] - .27, first[1] + .22, 0];
      const lastSeat: Vec3 = [last[0] + .28, last[1] - .25, 0];
      component.supportPoints = [firstSeat, ...component.supportPoints, lastSeat];
      place('screw-a', firstSeat, height + .13);
      place('screw-b', lastSeat, height + .13);
    }
  };

  if (movement.id !== 'quartz') {
    const center = part('center').position;
    place('barrel', offset(center, .8 + .1, 165));
    place('third', offset(center, .6 + .08, -25));
    place('fourth', offset(part('third').position, .512 + .064, -110));
    place('escape', offset(part('fourth').position, .504 + .042, -160));
    gear('barrel', [['wheel', 80, .8, .14]], .035, .65);
    gear('center', [['pinion', 10, .1, .14], ['wheel', 60, .6, .38]], .035, 1.44);
    gear('third', [['pinion', 8, .08, .38], ['wheel', 64, .512, .62]], .035, 1.44);
    gear('fourth', [['pinion', 8, .064, .62], ['wheel', 72, .504, .86]], .035, 1.44);
    gear('escape', [['pinion', 6, .042, .86], ['wheel', 15, .30, 1.10]], .035, 1.44);
    movement.gears = [link('barrel', 'center'), link('center', 'third'), link('third', 'fourth'), link('fourth', 'escape')];

    place('spring', part('barrel').position, .27);
    place('ratchet', part('barrel').position, .52);
    gear('ratchet', [['wheel', 50, .5, .52]], .035, .67);
    place('balance', [-1.20, -1.16, 0], 1.30);
    part('balance').radius = .56;
    part('balance').arborBottom = -.25 - part('balance').position[2];
    place('hairspring', part('balance').position, 1.48);
    place('fork', [-.53, -.89, 0], 1.10);
    part('fork').arborBottom = -.25 - part('fork').position[2];
    part('fork').palletTargets = {
      escape: [part('escape').position[0] - part('fork').position[0], part('escape').position[1] - part('fork').position[1], 0],
      balance: part('balance').position.map((v, i) => v - part('fork').position[i]) as Vec3,
      escapeRadius: .30 + .04,
    };
    bridge('bridge', ['center', 'third', 'fourth', 'escape'], 1.38, true);
    place('jewel', center, 1.47);
    part('center').gear!.shaftBottom = -.84 - part('center').position[2];
    for (const id of ['motion', 'hour', 'minute', 'seconds']) place(id, center);
    place('keyless', [2.245, 0, 0], .52);
    place('stem', [2.72, 0, 0], .52);
    part('fourth').role = 'Turns once per minute. Its 72 teeth drive the small 6-leaf pinion beneath the escape wheel. Both meshing faces sit at the same height.';
    part('escape').role = 'Its lower pinion receives rotation from the fourth wheel. The larger upper wheel meets the pallet stones and releases energy in controlled increments.';
    part('fourth').engineering = 'The 72-tooth fourth wheel meshes with the 6-leaf escape pinion on the same level. Its shaft also carries the 8-leaf pinion driven by the third wheel. ωescape = −12 ωfourth.';
    part('escape').engineering = 'The lower 6-leaf pinion meshes with the fourth wheel; the upper 15-tooth escape wheel meets the pallet stones. Six ideal half-tooth releases per second give 12 rpm. Contact dynamics remain simplified.';

    if (movement.id === 'automatic') {
      place('rotor', [0, 0, 0], 2.55);
      place('bearing', [0, 0, 0], 2.76);
      place('reverser', [0, .8, 0], 1.72);
      place('reduction', intersection(part('reverser').position, .6, part('barrel').position, .7), 1.96);
      place('ratchet', part('barrel').position, 2.20);
      place('bridle', part('barrel').position, .28);
      gear('rotor', [['drive', 50, .5, 1.72]], 1.70, 2.76);
      // Preserve the oscillating mass radius; its underside gear uses its own pitch radius.
      part('rotor').radius = 2.35;
      gear('reverser', [['pinion', 30, .3, 1.72], ['wheel', 20, .2, 1.96]], 1.70, 2.43);
      layerFor(part('reverser'), 'pinion').independentMotion = 'rotor-input';
      gear('reduction', [['pinion', 40, .4, 1.96], ['wheel', 20, .2, 2.20]], 1.70, 2.43);
      gear('ratchet', [['wheel', 50, .5, 2.20]], .035, 2.43);
      movement.windingGears = [link('rotor', 'reverser', 'drive'), link('reverser', 'reduction'), link('reduction', 'ratchet', 'wheel', 'wheel')];
      bridge('auto-bridge', ['rotor', 'reverser', 'reduction', 'ratchet'], 2.37);
    }
  } else {
    const template = part('fourth');
    movement.parts.push(
      { ...template, id: 'quartz-intermediate', name: 'First reduction wheel', position: offset(part('motor').position, .48, 135), explode: [-.7, -.5, 1.4], connects: ['motor', 'quartz-transfer'], role: 'The first compound wheel reduces motor speed by five.', engineering: 'A 40-tooth wheel receives the 8-tooth motor pinion; its shaft carries the next 8-tooth pinion.' },
      { ...template, id: 'quartz-transfer', name: 'Second reduction wheel', position: [0, 0, 0], explode: [.5, -.5, 1.8], connects: ['quartz-intermediate', 'fourth'], role: 'A second reduction makes the combined speed ratio thirty to one.', engineering: 'The 48-tooth wheel is driven by an 8-tooth pinion. Its coaxial 20-tooth wheel drives the 20-tooth seconds wheel.' },
    );
    place('fourth', [0, 0, 0], .13);
    place('quartz-transfer', intersection(part('quartz-intermediate').position, .56, part('fourth').position, .4), .13);
    gear('motor', [['wheel', 8, .08, .16]], .035, .85);
    gear('quartz-intermediate', [['pinion', 8, .08, .38], ['wheel', 40, .4, .16]], .035, .85);
    gear('quartz-transfer', [['pinion', 48, .48, .38], ['wheel', 20, .2, .60]], .035, .85);
    gear('fourth', [['wheel', 20, .2, .60]], .035, .85);
    part('fourth').gear!.shaftBottom = -.84 - part('fourth').position[2];
    movement.gears = [link('motor', 'quartz-intermediate', 'wheel', 'wheel'), link('quartz-intermediate', 'quartz-transfer', 'pinion', 'pinion'), link('quartz-transfer', 'fourth', 'wheel', 'wheel')];
    part('motor').connects = ['coil', 'quartz-intermediate'];
    part('fourth').name = 'Seconds output wheel';
    part('fourth').role = 'Turns once per minute after three reduction meshes convert each half-turn of the motor into a six-degree seconds step.';
    part('fourth').engineering = 'Three visible external meshes give (−8/40) × (−8/48) × (−20/20) = −1/30. A 180° motor step produces a −6° seconds step.';
    movement.energyPath.splice(movement.energyPath.indexOf('fourth'), 0, 'quartz-intermediate', 'quartz-transfer');
    bridge('bridge', ['motor', 'quartz-intermediate', 'quartz-transfer', 'fourth'], .79, true);
    place('motion', [0, 0, 0]);
    place('coil', [part('motor').position[0] + .58, part('motor').position[1], 0], .23);
    place('contact', part('battery').position, part('battery').position[2] + part('battery').thickness / 2 + part('contact').thickness / 2);
    place('stem', [2.72, 0, 0], .15);
  }

  part('plate').bearingPoints = movement.parts.filter(p => (p.gear || p.arborBottom !== undefined) && p.id !== 'rotor' && p.id !== 'reverser' && p.id !== 'reduction').map(p => [p.position[0], p.position[1], 0] as Vec3).filter((point, index, all) => all.findIndex(other => other[0] === point[0] && other[1] === point[1]) === index);
  return movement;
}

/** A dimensionless tooth/gap alignment invariant, including assembly phase. */
export function meshPhaseError(a: Part, ga: GearLayer, angleA: number, b: Part, gb: GearLayer, angleB: number) {
  const bearing = Math.atan2(b.position[1] - a.position[1], b.position[0] - a.position[0]);
  const phase = ga.teeth * (bearing - ga.phase - angleA) + gb.teeth * (bearing + Math.PI - gb.phase - angleB);
  return Math.abs(Math.cos(phase) + 1) + Math.abs(Math.sin(phase));
}

export function periodicAngle(angle: number) { return ((angle % TAU) + TAU) % TAU; }
