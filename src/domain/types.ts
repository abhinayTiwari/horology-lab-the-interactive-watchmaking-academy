export type MovementId = 'manual' | 'automatic' | 'quartz';
export type Vec3 = [number, number, number];
export type Shape = 'plate'|'bridge'|'gear'|'balance'|'spring'|'fork'|'screw'|'jewel'|'rotor'|'battery'|'chip'|'coil'|'crystal'|'stem'|'hand';
export type Category = 'Structure'|'Power & winding'|'Gear train'|'Regulation'|'Display'|'Electronics';
export interface Part {
  id: string; name: string; category: Category; shape: Shape; position: Vec3; explode: Vec3;
  radius: number; thickness: number; color: string; teeth?: number; parent?: string;
  role: string; engineering: string; material: string; fault: string; connects: string[];
}
export interface GearLink { driver: string; driven: string; driverTeeth: number; drivenTeeth: number }
export interface Movement {
  id: MovementId; name: string; code: string; subtitle: string; parts: Part[];
  frequency: number; powerReserve: number; energyPath: string[]; gears: GearLink[];
  provenance: { type: 'generic educational'; license: string; referenceUrls: string[]; assetUrl?: string };
}
export interface AssemblyStep { part: string; tool: 'Screwdriver'|'Tweezers'|'Movement holder'; blockers: string[]; instruction: string; caution: string }
export interface Lesson {
  id: string; level: number; title: string; minutes: number; movement: MovementId; part: string;
  objective: string; explanation: string; engineering: string; reasoning: string[]; example: string;
  misconception: string; experiment: string; question: string; options: string[]; answer: number; feedback: string; summary: string;
}
