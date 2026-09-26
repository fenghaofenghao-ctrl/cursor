import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const EYE_HEIGHT = 2.2;
const MOVE_SPEED = 14;
const DAMPING = 8;

/**
 * First-person player with PointerLock + soft pillar collision.
 * @param {{ THREE: any, scene: any, camera: any, canvas: HTMLElement, blockers: {x:number,z:number,r:number}[], islandRadius: number }} opts
 */
export function createPlayer({ THREE, scene, camera, canvas, blockers = [], islandRadius = 26 }) {
  const controls = new PointerLockControls(camera, document.body);
  const object = controls.getObject();
  scene.add(object);

  object.position.set(0, EYE_HEIGHT, 18);

  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();

  function getPosition() {
    return object.position;
  }

  /** Yaw around Y used by PointerLock (object.rotation.y). */
  function getYaw() {
    return object.rotation.y;
  }

  function getPose() {
    return { x: object.position.x, z: object.position.z, yaw: object.rotation.y };
  }

  function lock() {
    controls.lock();
  }

  function unlock() {
    controls.unlock();
  }

  /**
   * @param {{ x?: number, y?: number, z?: number, yaw?: number } | null} [pos]
   */
  function reset(pos) {
    if (pos) {
      object.position.set(pos.x ?? 0, pos.y ?? EYE_HEIGHT, pos.z ?? 18);
      if (typeof pos.yaw === 'number') {
        object.rotation.set(0, pos.yaw, 0);
      } else {
        object.rotation.set(0, 0, 0);
      }
    } else {
      object.position.set(0, EYE_HEIGHT, 18);
      object.rotation.set(0, 0, 0);
    }
    // Keep camera pitch/roll clear; yaw lives on the controls object.
    camera.rotation.x = 0;
    camera.rotation.z = 0;
    velocity.set(0, 0, 0);
  }

  function applyBlockers() {
    for (const b of blockers) {
      const dx = object.position.x - b.x;
      const dz = object.position.z - b.z;
      const d = Math.hypot(dx, dz);
      if (d < b.r && d > 0.001) {
        const push = (b.r - d) / d;
        object.position.x += dx * push;
        object.position.z += dz * push;
      }
    }
  }

  function clampIsland() {
    const xz = Math.hypot(object.position.x, object.position.z);
    if (xz > islandRadius) {
      object.position.x *= islandRadius / xz;
      object.position.z *= islandRadius / xz;
    }
  }

  /**
   * @param {number} dt
   * @param {{ w?: boolean, a?: boolean, s?: boolean, d?: boolean }} keys
   */
  function update(dt, keys) {
    if (!controls.isLocked) return;

    // Journal open: freeze WASD (pointer lock / look may stay). Class gone → resume next frame.
    if (typeof document !== 'undefined' && document.body?.classList.contains('journal-open')) {
      velocity.set(0, 0, 0);
      object.position.y = EYE_HEIGHT;
      return;
    }

    velocity.x -= velocity.x * DAMPING * dt;
    velocity.z -= velocity.z * DAMPING * dt;

    direction.z = Number(!!keys.w) - Number(!!keys.s);
    direction.x = Number(!!keys.d) - Number(!!keys.a);
    if (direction.x !== 0 || direction.z !== 0) direction.normalize();

    if (keys.w || keys.s) velocity.z -= direction.z * MOVE_SPEED * dt;
    if (keys.a || keys.d) velocity.x -= direction.x * MOVE_SPEED * dt;

    controls.moveRight(-velocity.x * dt);
    controls.moveForward(-velocity.z * dt);

    object.position.y = EYE_HEIGHT;
    clampIsland();
    applyBlockers();
  }

  return { controls, update, getPosition, getYaw, getPose, lock, unlock, reset };
}
