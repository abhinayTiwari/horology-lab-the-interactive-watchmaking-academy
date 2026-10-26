import type { Part, Movement, MovementId, Shape, Category, Vec3 } from '../domain/types';
import { alignMovement } from '../domain/alignment';
const brass = '#b99a58', steel = '#aab4b7', ruby = '#bd4066';
function p(id: string, name: string, shape: Shape, category: Category, position: Vec3, radius: number, explode: Vec3, role: string, engineering: string, connects: string[] = [], color = brass, thickness = .13, fault = 'Contamination or worn bearing surfaces can increase friction.'): Part {
  return { id, name, shape, category, position, radius, explode, role, engineering, connects, color, thickness, material: shape === 'jewel' ? 'Synthetic ruby' : color === brass ? 'Brass / steel assembly' : 'Steel / plated alloy', parent: category === 'Structure' ? undefined : 'plate', fault };
}
const structure: Part[] = [
  p('plate','Main plate','plate','Structure',[0,0,-.23],2.72,[0,0,-1.1],'The foundation holds the movement’s bearings in their correct positions.','Bearing coordinates set center distances and support the wheel pivots. The rendered plate is schematic.', ['bridge','barrel','center'], '#6d797d', .23),
  p('bridge','Train bridge','bridge','Structure',[.12,.38,.49],1.85,[-.2,.1,2.15],'Supports the upper pivots of the going train.','A bridge supports several arbors between itself and the main plate.', ['center','third','fourth'],steel,.16),
  p('screw-a','Bridge screw A','screw','Structure',[-1.38,.68,.65],.105,[-.9,.3,3.1],'Secures the train bridge to the main plate.','Fasteners must be removed before lifting their bridge.', ['bridge'],steel,.16),
  p('screw-b','Bridge screw B','screw','Structure',[1.54,.68,.65],.105,[.9,.3,3.1],'Secures the other end of the train bridge.','Lift a bridge evenly after all securing screws are removed.', ['bridge'],steel,.16),
  p('jewel','Train jewel bearing','jewel','Structure',[.12,.38,.61],.11,[.35,.4,2.55],'A hard, low-friction surface supports a rotating pivot.','Jewels reduce wear; correct oil quantity and pivot finish still matter.', ['center'],ruby,.06),
];
const display: Part[] = [
  p('motion','Motion works','gear','Display',[0,-.32,-.48],.42,[0,-.5,-1.8],'Reduces the minute-hand rotation to drive the hour hand.','The hour wheel turns once for every twelve minute-hand revolutions.', ['minute','hour']),
  p('hour','Hour hand','hand','Display',[0,0,-.65],.95,[-.4,0,-2.3],'Indicates hours with one revolution every twelve hours.','ωhour = ωminute / 12. Hands are shown below the movement, on the dial side.', ['motion'],steel,.04),
  p('minute','Minute hand','hand','Display',[0,0,-.73],1.45,[0,0,-2.6],'Indicates minutes with one revolution per hour.','A friction coupling permits hand setting without forcing the entire going train.', ['motion'],brass,.04),
  p('seconds','Seconds hand','hand','Display',[0,0,-.81],1.7,[.4,0,-2.9],'Makes the passage of seconds visible.','One revolution per minute. This schematic uses a conceptual central-seconds connection.', ['fourth'], '#d5e1de',.025),
  p('stem','Crown & stem','stem','Power & winding',[2.72,0,.03],.23,[1.7,0,.15],'Transfers your input to winding and hand-setting mechanisms.','A sliding keyless mechanism selects the winding or setting path.', ['keyless','ratchet'],steel,.2),
];
const mechanical: Part[] = [
  ...structure,
  p('barrel','Mainspring barrel','gear','Power & winding',[-1.14,.72,.03],.84,[-.9,.6,.45],'The barrel contains a wound spring that stores the energy to run the watch.','The barrel turns slowly as the mainspring delivers torque. The model assumes a 48-hour linear energy reserve.', ['spring','center','ratchet']),
  p('spring','Mainspring','spring','Power & winding',[-1.14,.72,.18],.68,[-1.2,.8,1.2],'Stores energy as elastic deformation when you wind the crown.','Actual mainspring torque varies with wind. The displayed spiral and linear energy meter are illustrative.', ['barrel'],steel,.04,'A broken or tired mainspring can reduce reserve. Never open a powered barrel.'),
  p('ratchet','Ratchet wheel','gear','Power & winding',[-1.14,.72,.37],.51,[-1.6,1.1,1.8],'Turns the barrel arbor during winding; a click prevents reverse unwinding.','This simplified assembly groups the arbor and click with the ratchet wheel.', ['stem','spring']),
  p('keyless','Keyless works','gear','Power & winding',[1.98,0,.04],.3,[1.4,-.2,.7],'Routes crown movement to winding or hand setting.','Sliding pinion, setting lever and yoke are represented as one conceptual assembly.', ['stem','ratchet','motion'],steel),
  p('center','Center wheel','gear','Gear train',[.12,.38,.06],.66,[.05,.3,.85],'Carries energy onward and turns once per hour in this model.','60-tooth wheel on the center arbor drives an 8-leaf third-wheel pinion: ωthird = −7.5 ωcenter.', ['barrel','third']),
  p('third','Third wheel','gear','Gear train',[.92,-.25,.1],.45,[.7,-.35,1.3],'Bridges the center wheel and the seconds wheel.','64-tooth third wheel drives an 8-leaf fourth-wheel pinion: ωfourth = −8 ωthird.', ['center','fourth']),
  p('fourth','Fourth wheel','gear','Gear train',[.28,-1.04,.13],.51,[.2,-.85,1.65],'Turns once a minute and can drive a seconds indication.','72-tooth fourth wheel drives a 6-leaf escape pinion: ωescape = −12 ωfourth.', ['third','escape']),
  p('escape','Escape wheel','gear','Regulation',[-.56,-1.55,.16],.33,[-.65,-1.1,2.0],'Releases energy in tiny controlled increments.','15 teeth; ideal half-tooth advances at six beats per second give 12 rpm. Locking is discrete; contact dynamics are not solved.', ['fourth','fork'],steel),
  p('fork','Pallet fork & stones','fork','Regulation',[-1.04,-1.04,.22],.34,[-1.3,-.9,2.55],'Alternately locks the escape wheel and gives the balance an impulse.','Entry and exit pallets alternate at each half-oscillation. Pallet stones are grouped with the fork.', ['escape','balance'],steel,.08,'Damaged pallet stones or incorrect oil can disturb locking and impulse.'),
  p('balance','Balance wheel','balance','Regulation',[-1.65,-.52,.3],.6,[-1.65,-.4,3.0],'Swings back and forth to set the rhythm of the movement.','3 Hz = 6 beats/s = 21,600 beats/hour. An ideal sinusoid represents the balance; amplitude is 246°.', ['fork','hairspring'],brass,.08,'A damaged staff or magnetized hairspring can cause unstable timekeeping.'),
  p('hairspring','Balance hairspring','spring','Regulation',[-1.65,-.52,.39],.43,[-1.9,-.4,3.7],'Provides the restoring torque that brings the balance back.','For an ideal torsional oscillator, f = (1 / 2π) √(κ / I). Geometry here is a visual schematic.', ['balance'], '#839da4',.025,'Touching or bending a hairspring changes its geometry and timing.'),
  ...display,
];
const autoParts: Part[] = [
  p('auto-bridge','Automatic bridge','bridge','Structure',[0,.25,.83],1.5,[.1,1.1,3.1],'Supports the automatic winding transmission.','This generic bidirectional system sits above the hand-wound architecture.', ['reverser','reduction'],steel,.14),
  p('reverser','Reversing wheels','gear','Power & winding',[.84,.95,.65],.33,[1.2,1.4,2.4],'Routes either rotor direction into the same winding direction.','An ideal bidirectional clutch is modeled with the absolute rotor displacement.', ['rotor','reduction'], '#b7684c'),
  p('reduction','Winding reduction','gear','Power & winding',[-.15,1.35,.67],.4,[-.3,1.6,2.8],'Reduces speed and increases available winding torque.','Energy gain per rotor turn is illustrative, not an efficiency or reserve prediction.', ['reverser','ratchet']),
  p('bridle','Slipping bridle','spring','Power & winding',[-1.14,.72,.22],.76,[-2.1,1,1.35],'Allows the spring’s outer end to slip when fully wound.','This automatic architecture uses a friction bridle. The simulation clamps stored energy at full reserve.', ['spring','barrel'],steel,.04),
  p('rotor','Oscillating rotor','rotor','Power & winding',[0,0,1.04],2.35,[0,0,4.3],'Wrist motion turns this weighted rotor and winds the mainspring.','Drag the rotor control to rotate the actual 3D object. Both directions engage this model’s ideal reversing transmission.', ['reverser','bearing'],brass,.19),
  p('bearing','Rotor bearing','jewel','Structure',[0,0,1.18],.24,[0,0,5],'Supports the rotor around a central axis.','The bearing allows low-friction rotation of the oscillating mass.', ['rotor'],steel,.15),
];
const quartzParts: Part[] = [
  ...structure.filter(x=>x.id!=='jewel'),
  p('battery','Button-cell battery','battery','Power & winding',[-1.17,.65,.14],.86,[-1.25,.7,1.3],'Provides electrical energy to the timing circuit and motor.','The battery supplies energy; the crystal is the frequency reference, not an energy source.', ['contact'],steel,.25,'A depleted cell, corrosion or poor contact can interrupt power.'),
  p('contact','Battery contact','bridge','Electronics',[-1.18,.65,.33],.7,[-1.5,.8,2.1],'Completes the electrical connection to the battery.','Contact resistance and contamination can prevent adequate motor pulses.', ['battery','oscillator'],brass,.05),
  p('crystal','Quartz resonator','crystal','Electronics',[.32,1.43,.15],.19,[.3,1.4,1.5],'A piezoelectric resonator provides a stable timing reference.','32,768 Hz = 2¹⁵ Hz. Its vibration is not animated at a misleading visible amplitude.', ['oscillator'],steel,.16),
  p('oscillator','Oscillator circuit','chip','Electronics',[.76,.68,.12],.36,[.8,.7,.85],'Sustains the quartz resonator’s tiny vibration electrically.','The amplifier and resonator form a feedback oscillator.', ['crystal','divider'], '#344e43'),
  p('divider','Frequency divider','chip','Electronics',[1.48,.33,.12],.27,[1.5,.45,1.25],'Counts high-frequency cycles down to a one-second reference.','Fifteen divide-by-two stages: 32768 / 2¹⁵ = 1 Hz.', ['oscillator','driver'], '#344e43'),
  p('driver','Motor driver','chip','Electronics',[1.58,-.45,.12],.25,[1.7,-.35,1.7],'Converts timing signals into alternating motor-coil pulses.','A logical pulse event occurs once each simulated second.', ['divider','coil'], '#344e43'),
  p('coil','Stepper coil & stator','coil','Electronics',[.62,-1.12,.13],.53,[.7,-1.3,2.1],'Turns electrical pulses into a changing magnetic field.','Coil and stator are grouped. Their field drives a permanent-magnet rotor.', ['driver','motor'], '#ba7148'),
  p('motor','Stepper rotor','gear','Gear train',[-.13,-1.13,.15],.24,[-.2,-1.6,2.55],'Rotates in discrete steps as the coil polarity changes.','This generic model uses a 180° rotor step per second.', ['coil','fourth'],steel),
  p('fourth','Reduction & seconds wheel','gear','Gear train',[-.88,-.91,.13],.49,[-1.1,-1.2,1.0],'Reduces motor steps into six-degree seconds-hand increments.','A conceptual 30:1 compound reduction maps a 180° motor step to a 6° seconds step.', ['motor','motion','seconds']),
  ...display,
];
const referenceUrls = ['https://www.hautehorlogerie.org/en/watches-and-culture/library/how-does-a-mechanical-watch-work','https://www.seiko.co.jp/csr/toki-iku/tokiq-nazotoki/'];
export const movements: Record<MovementId, Movement> = {
  manual: {id:'manual',name:'Hand-wound mechanical',code:'HL–01',subtitle:'The essentials, in motion.',parts:mechanical,frequency:3,powerReserve:48,energyPath:['stem','ratchet','spring','barrel','center','third','fourth','escape','fork','balance'],gears:[{driver:'barrel',driven:'center',driverTeeth:80,drivenTeeth:10},{driver:'center',driven:'third',driverTeeth:60,drivenTeeth:8},{driver:'third',driven:'fourth',driverTeeth:64,drivenTeeth:8},{driver:'fourth',driven:'escape',driverTeeth:72,drivenTeeth:6}],provenance:{type:'generic educational',license:'MIT — original procedural geometry',referenceUrls}},
  automatic: {id:'automatic',name:'Automatic mechanical',code:'HL–02',subtitle:'Powered by your movement.',parts:[...mechanical,...autoParts],frequency:3,powerReserve:48,energyPath:['rotor','reverser','reduction','ratchet','spring','barrel','center','third','fourth','escape','fork','balance'],gears:[],provenance:{type:'generic educational',license:'MIT — original procedural geometry',referenceUrls}},
  quartz: {id:'quartz',name:'Analog quartz',code:'HL–03',subtitle:'A crystal-clear sense of time.',parts:quartzParts,frequency:32768,powerReserve:0,energyPath:['battery','contact','oscillator','divider','driver','coil','motor','fourth','motion','seconds'],gears:[{driver:'motor',driven:'fourth',driverTeeth:8,drivenTeeth:240}],provenance:{type:'generic educational',license:'MIT — original procedural geometry',referenceUrls}},
};
movements.automatic.gears = movements.manual.gears;
for (const id of Object.keys(movements) as MovementId[]) movements[id] = alignMovement(movements[id]);
