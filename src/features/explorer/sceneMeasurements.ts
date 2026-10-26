import { Euler, Quaternion, Vector3 } from 'three';
import type { Scene } from 'three';
import type { Movement } from '../../domain/types';

// Development-only measurements of actual rendered objects, used by browser tests.
// These intentionally do not re-use the layout solver's calculated coordinates.
export function measureGearMeshes(scene: Scene, movement: Movement) {
  scene.updateMatrixWorld(true);
  const first = new Vector3(), second = new Vector3();
  const quaternion = new Quaternion(), rotation = new Euler();
  return [...movement.gears, ...(movement.windingGears ?? [])].flatMap(link => {
    const a = scene.getObjectByName(`gear-layer:${link.driver}:${link.driverLayer ?? 'wheel'}`);
    const b = scene.getObjectByName(`gear-layer:${link.driven}:${link.drivenLayer ?? 'pinion'}`);
    if (!a || !b) return [];
    a.getWorldPosition(first); b.getWorldPosition(second);
    const bearing = Math.atan2(second.y - first.y, second.x - first.x);
    a.getWorldQuaternion(quaternion); const angleA = rotation.setFromQuaternion(quaternion).z;
    b.getWorldQuaternion(quaternion); const angleB = rotation.setFromQuaternion(quaternion).z;
    const phase = Number(a.userData.teeth) * (bearing - angleA) + Number(b.userData.teeth) * (bearing + Math.PI - angleB);
    return [{ driver: link.driver, driven: link.driven,
      distance: Math.hypot(second.x - first.x, second.y - first.y),
      pitchDistance: Number(a.userData.pitchRadius) + Number(b.userData.pitchRadius),
      heightDifference: second.z - first.z,
      phaseError: Math.abs(Math.cos(phase) + 1) + Math.abs(Math.sin(phase)),
    }];
  });
}
