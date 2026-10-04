import * as THREE from 'three';
import { AppState, Bounds3D } from '../types';
import { getAllColliders, snap10 } from './calculations';

export interface CartPhysicsState {
  x: number;
  z: number;
  heading: number; // in radians, 0 is facing +Z, Math.PI/2 is facing +X
  speed: number;
  turnSpeed: number;
  isMoving: boolean;
}

export interface NpcSimulationState {
  active: boolean;
  x: number;
  z: number;
  heading: number;
  speed: number;
  startX: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  passedPlayer: boolean;
  collidedWithPlayer: boolean;
  result: 'testing' | 'approved' | 'failed' | null;
  message: string | null;
  distanceTraveled: number;
}

export interface AisleMeasurement {
  freeWidth: number;
  leftDist: number;
  rightDist: number;
  leftObstacle?: string;
  rightObstacle?: string;
  status: 'optimal' | 'tight' | 'pmr_only' | 'blocked';
  recommendedWidth: number;
  canTwoCartsPass: boolean;
}

export interface BottleneckPoint {
  x: number;
  z: number;
  width: number;
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

// Exactly 47 cm (0.47m) width as requested by user
export const CART_WIDTH = 0.47;
export const CART_LENGTH = 0.70;
export const CART_HEIGHT = 0.95;
export const REQUIRED_TWO_CARTS_PASS_WIDTH = 1.20; // Commercial standard: 2 shopping carts of 47cm pass comfortably with side clearance
export const MIN_PMR_ACCESSIBILITY_WIDTH = 0.90; // Argentine / International accessibility minimum

// Web Audio API Sound Generator for Walkthrough Game Mode
class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playApproved() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.setValueAtTime(659.25, t + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, t + 0.24); // G5
      osc.frequency.setValueAtTime(1046.50, t + 0.36); // C6
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc.start(t);
      osc.stop(t + 0.65);
    } catch {}
  }

  playFailed() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.linearRampToValueAtTime(160, t + 0.35);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    } catch {}
  }

  playBlocked() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(190, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }
}

export const walkthroughAudio = new SoundEffects();

/**
 * Creates an ultra-detailed 3D Shopping Cart (47 cm wide) and Human Avatar
 */
export function createCartAndAvatarMesh(isNpc = false): {
  group: THREE.Group;
  updateAnimation: (deltaDist: number, isMoving: boolean) => void;
  setWarningColor: (warn: boolean) => void;
} {
  const group = new THREE.Group();

  // Materials
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xdde3ea,
    metalness: 0.92,
    roughness: 0.18,
  });

  const basketWireMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.25,
    wireframe: true,
  });

  const plasticHandleMat = new THREE.MeshStandardMaterial({
    color: isNpc ? 0x2563eb : 0xdc2626, // Red for player, blue for NPC
    roughness: 0.35,
    metalness: 0.1,
  });

  const wheelRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.8,
  });

  const clothesMat = new THREE.MeshStandardMaterial({
    color: isNpc ? 0x1e3a8a : 0xb91c1c, // Blue shirt for NPC, red/burgundy for player
    roughness: 0.7,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: isNpc ? 0x334155 : 0x1e293b, // Dark jeans
    roughness: 0.8,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.5,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: isNpc ? 0x451a03 : 0x171717,
    roughness: 0.9,
  });

  const warningMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    wireframe: true,
    roughness: 0.5,
    metalness: 0.2,
  });

  // ── 1. Carrito de Compras (47 cm de ancho exacto) ──
  const cartGroup = new THREE.Group();
  // Cart center is placed at z = +0.45 relative to avatar group center
  cartGroup.position.set(0, 0, 0.45);

  const halfW = CART_WIDTH / 2; // 0.235m

  // Chassis base frame (alambre grueso de soporte inferior)
  const chassisGeom = new THREE.BoxGeometry(CART_WIDTH, 0.02, CART_LENGTH);
  const chassis = new THREE.Mesh(chassisGeom, chromeMat);
  chassis.position.set(0, 0.12, 0);
  chassis.castShadow = true;
  cartGroup.add(chassis);

  // Bottom rack / shelf
  const bottomTrayGeom = new THREE.BoxGeometry(CART_WIDTH - 0.05, 0.01, CART_LENGTH - 0.1);
  const bottomTray = new THREE.Mesh(bottomTrayGeom, basketWireMat);
  bottomTray.position.set(0, 0.14, -0.02);
  cartGroup.add(bottomTray);

  // 4 Wheels with casters
  const wheelGeom = new THREE.CylinderGeometry(0.038, 0.038, 0.022, 16);
  wheelGeom.rotateZ(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];

  const wheelPositions = [
    [-halfW + 0.04, 0.04, -CART_LENGTH / 2 + 0.07],
    [halfW - 0.04, 0.04, -CART_LENGTH / 2 + 0.07],
    [-halfW + 0.05, 0.04, CART_LENGTH / 2 - 0.08],
    [halfW - 0.05, 0.04, CART_LENGTH / 2 - 0.08],
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    // Wheel leg / fork
    const forkGeom = new THREE.BoxGeometry(0.015, 0.06, 0.015);
    const fork = new THREE.Mesh(forkGeom, chromeMat);
    fork.position.set(wx, wy + 0.04, wz);
    cartGroup.add(fork);

    // Wheel
    const wheel = new THREE.Mesh(wheelGeom, wheelRubberMat);
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    cartGroup.add(wheel);
    wheels.push(wheel);
  });

  // Upright rear supports (angulados hacia el manillar)
  const supportL = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.85, 8), chromeMat);
  supportL.position.set(-halfW + 0.02, 0.52, -CART_LENGTH / 2 + 0.06);
  supportL.rotation.x = 0.12;
  cartGroup.add(supportL);

  const supportR = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.85, 8), chromeMat);
  supportR.position.set(halfW - 0.02, 0.52, -CART_LENGTH / 2 + 0.06);
  supportR.rotation.x = 0.12;
  cartGroup.add(supportR);

  // Wire Basket (Canasto)
  // Basket bottom
  const bBottom = new THREE.Mesh(new THREE.BoxGeometry(CART_WIDTH - 0.06, 0.015, CART_LENGTH - 0.12), basketWireMat);
  bBottom.position.set(0, 0.44, 0.02);
  cartGroup.add(bBottom);

  // Basket sides (4 panels wireframe)
  const bHeight = 0.42;
  const bFront = new THREE.Mesh(new THREE.BoxGeometry(CART_WIDTH - 0.04, bHeight, 0.015), basketWireMat);
  bFront.position.set(0, 0.44 + bHeight / 2, CART_LENGTH / 2 - 0.04);
  cartGroup.add(bFront);

  const bBack = new THREE.Mesh(new THREE.BoxGeometry(CART_WIDTH - 0.04, bHeight + 0.08, 0.015), basketWireMat);
  bBack.position.set(0, 0.44 + (bHeight + 0.08) / 2, -CART_LENGTH / 2 + 0.06);
  cartGroup.add(bBack);

  const bSideL = new THREE.Mesh(new THREE.BoxGeometry(0.015, bHeight, CART_LENGTH - 0.1), basketWireMat);
  bSideL.position.set(-halfW + 0.02, 0.44 + bHeight / 2, 0.01);
  cartGroup.add(bSideL);

  const bSideR = new THREE.Mesh(new THREE.BoxGeometry(0.015, bHeight, CART_LENGTH - 0.1), basketWireMat);
  bSideR.position.set(halfW - 0.02, 0.44 + bHeight / 2, 0.01);
  cartGroup.add(bSideR);

  // Top perimeter chrome rim
  const rimFront = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, CART_WIDTH, 8), chromeMat);
  rimFront.rotateZ(Math.PI / 2);
  rimFront.position.set(0, 0.44 + bHeight, CART_LENGTH / 2 - 0.04);
  cartGroup.add(rimFront);

  // Plastic ergonomic handle bar (47 cm total wide handle)
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, CART_WIDTH, 12), plasticHandleMat);
  handleBar.rotateZ(Math.PI / 2);
  handleBar.position.set(0, CART_HEIGHT, -CART_LENGTH / 2 + 0.03);
  handleBar.castShadow = true;
  cartGroup.add(handleBar);

  // Handle logo badge
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.02), chromeMat);
  badge.position.set(0, CART_HEIGHT + 0.01, -CART_LENGTH / 2 + 0.03);
  cartGroup.add(badge);

  group.add(cartGroup);

  // ── 2. Avatar Humano (Caminante empujando el carrito) ──
  const avatarGroup = new THREE.Group();
  avatarGroup.position.set(0, 0, -0.05);

  // Left Leg
  const legGeom = new THREE.BoxGeometry(0.12, 0.72, 0.14);
  const leftLeg = new THREE.Mesh(legGeom, pantsMat);
  leftLeg.position.set(-0.12, 0.36, 0);
  leftLeg.castShadow = true;
  avatarGroup.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Mesh(legGeom, pantsMat);
  rightLeg.position.set(0.12, 0.36, 0);
  rightLeg.castShadow = true;
  avatarGroup.add(rightLeg);

  // Shoes
  const shoeGeom = new THREE.BoxGeometry(0.13, 0.08, 0.22);
  const leftShoe = new THREE.Mesh(shoeGeom, wheelRubberMat);
  leftShoe.position.set(-0.12, 0.04, 0.04);
  avatarGroup.add(leftShoe);

  const rightShoe = new THREE.Mesh(shoeGeom, wheelRubberMat);
  rightShoe.position.set(0.12, 0.04, 0.04);
  avatarGroup.add(rightShoe);

  // Torso / Chest
  const torsoGeom = new THREE.BoxGeometry(0.40, 0.58, 0.24);
  const torso = new THREE.Mesh(torsoGeom, clothesMat);
  torso.position.set(0, 1.02, 0);
  torso.castShadow = true;
  avatarGroup.add(torso);

  // Arms extended holding the handle at y = 0.95m
  const armGeom = new THREE.CylinderGeometry(0.045, 0.04, 0.44, 8);
  armGeom.rotateX(Math.PI / 3);

  const leftArm = new THREE.Mesh(armGeom, clothesMat);
  leftArm.position.set(-0.19, 1.05, 0.16);
  avatarGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, clothesMat);
  rightArm.position.set(0.19, 1.05, 0.16);
  avatarGroup.add(rightArm);

  // Hands
  const handGeom = new THREE.SphereGeometry(0.042, 8, 8);
  const leftHand = new THREE.Mesh(handGeom, skinMat);
  leftHand.position.set(-halfW + 0.08, CART_HEIGHT, 0.48);
  avatarGroup.add(leftHand);

  const rightHand = new THREE.Mesh(handGeom, skinMat);
  rightHand.position.set(halfW - 0.08, CART_HEIGHT, 0.48);
  avatarGroup.add(rightHand);

  // Head
  const headGeom = new THREE.SphereGeometry(0.115, 16, 16);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.set(0, 1.45, 0.02);
  head.castShadow = true;
  avatarGroup.add(head);

  // Hair / Cap
  const hairGeom = new THREE.SphereGeometry(0.122, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const hair = new THREE.Mesh(hairGeom, hairMat);
  hair.position.set(0, 1.48, 0.01);
  avatarGroup.add(hair);

  group.add(avatarGroup);

  // Bounding indicator ring on floor
  const ringGeom = new THREE.RingGeometry(0.35, 0.38, 24);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: isNpc ? 0x38bdf8 : 0x22c55e,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });
  const ringWarningMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.set(0, 0.015, 0.35);
  group.add(ring);

  let walkPhase = 0;

  const updateAnimation = (deltaDist: number, isMoving: boolean) => {
    if (isMoving && deltaDist > 0.0001) {
      walkPhase += deltaDist * 9.0;
      // Leg swing
      const legAngle = Math.sin(walkPhase) * 0.45;
      leftLeg.rotation.x = legAngle;
      rightLeg.rotation.x = -legAngle;
      leftShoe.rotation.x = legAngle;
      rightShoe.rotation.x = -legAngle;

      // Wheel rotation
      const wheelRot = deltaDist / 0.038;
      wheels.forEach((w) => {
        w.rotation.x += wheelRot;
      });

      // Subtle torso bounce
      torso.position.y = 1.02 + Math.abs(Math.sin(walkPhase * 2)) * 0.02;
      head.position.y = 1.45 + Math.abs(Math.sin(walkPhase * 2)) * 0.02;
    } else {
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftShoe.rotation.x = 0;
      rightShoe.rotation.x = 0;
      torso.position.y = 1.02;
      head.position.y = 1.45;
    }
  };

  const setWarningColor = (warn: boolean) => {
    if (warn) {
      chassis.material = warningMat;
      ring.material = ringWarningMat;
    } else {
      chassis.material = chromeMat;
      ring.material = ringMat;
    }
  };

  return {
    group,
    updateAnimation,
    setWarningColor,
  };
}

/**
 * Checks if the shopping cart (0.47m width) collides at (x, z) with heading rot.
 */
export function checkCartCollision(
  state: AppState,
  x: number,
  z: number,
  heading: number
): {
  collided: boolean;
  reason?: string;
  minGap?: number;
  obstacleName?: string;
} {
  const W = state.warehouse.width;
  const D = state.warehouse.depth;

  // Cart dimensions & safety margins
  const halfW = CART_WIDTH / 2 + 0.02; // 0.255m
  const frontDist = 0.82; // Front tip of cart
  const rearDist = -0.32; // Rear heels of human avatar

  // Compute 4 corner points of cart bounding envelope
  const sinH = Math.sin(heading);
  const cosH = Math.cos(heading);

  // Front-left, Front-right, Rear-left, Rear-right
  const corners = [
    { x: x + sinH * frontDist - cosH * halfW, z: z + cosH * frontDist + sinH * halfW },
    { x: x + sinH * frontDist + cosH * halfW, z: z + cosH * frontDist - sinH * halfW },
    { x: x + sinH * rearDist - cosH * halfW, z: z + cosH * rearDist + sinH * halfW },
    { x: x + sinH * rearDist + cosH * halfW, z: z + cosH * rearDist - sinH * halfW },
    // Center of cart
    { x: x + sinH * 0.45, z: z + cosH * 0.45 },
  ];

  // 1. Check perimeter warehouse walls
  for (const pt of corners) {
    if (pt.x < 0.05 || pt.x > W - 0.05 || pt.z < 0.05 || pt.z > D - 0.05) {
      return {
        collided: true,
        reason: '⛔ Espacio que no puedo atravesar: Límite de pared perimetral del salón alcanzado',
        minGap: 0,
        obstacleName: 'Pared perimetral',
      };
    }
  }

  // 2. Check salon colliders
  const colliders = getAllColliders(state, null, -1, 'salon');

  // Oriented cart bounding AABB
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const pt of corners) {
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minZ = Math.min(minZ, pt.z);
    maxZ = Math.max(maxZ, pt.z);
  }

  for (const c of colliders) {
    const b = c.bounds;
    // Fast AABB rejection
    if (maxX > b.x0 && minX < b.x1 && maxZ > b.z0 && minZ < b.z1) {
      let obsName = 'Góndola u obstáculo';
      if (c.type === 'gondolaPared') obsName = `Góndola de Pared ${(c.idx ?? 0) + 1}`;
      else if (c.type === 'gondolaCentral') obsName = `Góndola Central ${(c.idx ?? 0) + 1}`;
      else if (c.type === 'puntera') obsName = `Puntera ${(c.idx ?? 0) + 1}`;
      else if (c.type === 'heladera') obsName = `Heladera ${(c.idx ?? 0) + 1}`;
      else if (c.type === 'checkout') obsName = `Caja Check Out ${(c.idx ?? 0) + 1}`;
      else if (c.type === 'obstacle') obsName = `Columna / Abertura ${(c.idx ?? 0) + 1}`;

      return {
        collided: true,
        reason: `⛔ Espacio que no puedo atravesar: Bloqueado por ${obsName} (Ancho insuficiente para carro de compras de 47 cm)`,
        obstacleName: obsName,
      };
    }
  }

  return { collided: false };
}

/**
 * Finds a safe spawn position in an open customer aisle within the salon.
 */
export function findSafeWalkthroughSpawnPoint(state: AppState): { x: number; z: number; heading: number } {
  const W = state.warehouse.width;
  const D = state.warehouse.depth;

  // Try typical customer circulation zones first
  const candidates = [
    { x: 2.2, z: 2.0, heading: 0 },
    { x: 3.5, z: 2.5, heading: 0 },
    { x: W / 2, z: 2.2, heading: 0 },
    { x: W / 2, z: D / 2, heading: 0 },
    { x: 2.5, z: D / 2, heading: 0 },
    { x: W - 2.5, z: 2.5, heading: 0 },
    { x: 1.8, z: 1.8, heading: 0 },
  ];

  for (const cand of candidates) {
    if (cand.x > 0.8 && cand.x < W - 0.8 && cand.z > 0.8 && cand.z < D - 0.8) {
      const col = checkCartCollision(state, cand.x, cand.z, cand.heading);
      if (!col.collided) {
        return cand;
      }
    }
  }

  // Fallback: grid scan across store salon
  for (let z = 1.6; z < D - 1.6; z += 0.8) {
    for (let x = 1.6; x < W - 1.6; x += 0.8) {
      const col = checkCartCollision(state, x, z, 0);
      if (!col.collided) {
        return { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, heading: 0 };
      }
    }
  }

  return { x: 2.0, z: 2.0, heading: 0 };
}

/**
 * Measures free lateral aisle width in real-time around the player position.
 * Casts horizontal sweeps to left and right to find flanking shelving lines.
 */
export function measureAisleClearance(
  state: AppState,
  x: number,
  z: number,
  heading: number
): AisleMeasurement {
  const colliders = getAllColliders(state, null, -1, 'salon');
  const W = state.warehouse.width;
  const D = state.warehouse.depth;

  // Cart center
  const cartCenterX = x + Math.sin(heading) * 0.45;
  const cartCenterZ = z + Math.cos(heading) * 0.45;

  // Determine dominant aisle axis: is heading closer to Z axis (North/South) or X axis (East/West)?
  const isAlongZ = Math.abs(Math.cos(heading)) >= Math.abs(Math.sin(heading));

  let leftDist = Infinity;
  let rightDist = Infinity;
  let leftName = 'Pared Izquierda';
  let rightName = 'Pared Derecha';

  if (isAlongZ) {
    // Aisle runs along Z: left is -X, right is +X
    leftDist = cartCenterX - 0; // Distance to left wall
    rightDist = W - cartCenterX; // Distance to right wall

    for (const c of colliders) {
      const b = c.bounds;
      // Does this obstacle intersect the player's Z position interval?
      if (cartCenterZ >= b.z0 - 0.25 && cartCenterZ <= b.z1 + 0.25) {
        // Obstacle to the left
        if (b.x1 <= cartCenterX) {
          const dist = cartCenterX - b.x1;
          if (dist < leftDist) {
            leftDist = dist;
            leftName = c.type === 'gondolaPared' ? 'G. Pared' : c.type === 'gondolaCentral' ? 'G. Central' : c.type;
          }
        }
        // Obstacle to the right
        if (b.x0 >= cartCenterX) {
          const dist = b.x0 - cartCenterX;
          if (dist < rightDist) {
            rightDist = dist;
            rightName = c.type === 'gondolaPared' ? 'G. Pared' : c.type === 'gondolaCentral' ? 'G. Central' : c.type;
          }
        }
      }
    }
  } else {
    // Aisle runs along X: left is -Z, right is +Z
    leftDist = cartCenterZ - 0;
    rightDist = D - cartCenterZ;

    for (const c of colliders) {
      const b = c.bounds;
      if (cartCenterX >= b.x0 - 0.25 && cartCenterX <= b.x1 + 0.25) {
        if (b.z1 <= cartCenterZ) {
          const dist = cartCenterZ - b.z1;
          if (dist < leftDist) {
            leftDist = dist;
            leftName = c.type === 'gondolaPared' ? 'G. Pared' : c.type === 'gondolaCentral' ? 'G. Central' : c.type;
          }
        }
        if (b.z0 >= cartCenterZ) {
          const dist = b.z0 - cartCenterZ;
          if (dist < rightDist) {
            rightDist = dist;
            rightName = c.type === 'gondolaPared' ? 'G. Pared' : c.type === 'gondolaCentral' ? 'G. Central' : c.type;
          }
        }
      }
    }
  }

  // Ensure positive values
  leftDist = Math.max(0, leftDist);
  rightDist = Math.max(0, rightDist);

  // Total free corridor width between the two shelving faces
  const freeWidth = Math.round((leftDist + rightDist) * 100) / 100;

  // Standard commercial thresholds:
  // - >= 1.30m: Optimal for 2 carts passing (Pasillo Aprobado)
  // - 1.10m to 1.29m: Tight for 2 carts, single cart passes comfortably
  // - 0.90m to 1.09m: Minimum wheelchair / PMR single transit, no 2-cart pass
  // - < 0.90m: Blocked / Non-compliant bottleneck
  let status: AisleMeasurement['status'] = 'optimal';
  if (freeWidth < MIN_PMR_ACCESSIBILITY_WIDTH) {
    status = 'blocked';
  } else if (freeWidth < 1.10) {
    status = 'pmr_only';
  } else if (freeWidth < REQUIRED_TWO_CARTS_PASS_WIDTH) {
    status = 'tight';
  } else {
    status = 'optimal';
  }

  return {
    freeWidth,
    leftDist: Math.round(leftDist * 100) / 100,
    rightDist: Math.round(rightDist * 100) / 100,
    leftObstacle: leftName,
    rightObstacle: rightName,
    status,
    recommendedWidth: 1.40,
    canTwoCartsPass: freeWidth >= REQUIRED_TWO_CARTS_PASS_WIDTH,
  };
}

/**
 * Initializes the NPC 2 crossing test in the current aisle.
 */
export function initializeNpcCrossingTest(
  state: AppState,
  player: CartPhysicsState
): NpcSimulationState {
  const isAlongZ = Math.abs(Math.cos(player.heading)) >= Math.abs(Math.sin(player.heading));
  const aisle = measureAisleClearance(state, player.x, player.z, player.heading);

  let startX = player.x;
  let startZ = player.z;
  let targetX = player.x;
  let targetZ = player.z;
  let heading = 0;

  // Compute lane lateral offset if aisle has sufficient space
  // If canTwoCartsPass, the aisle allows two 47cm carts side by side.
  // The player is on their right side; the NPC is on the NPC's right side (player's left).
  const lateralShift = aisle.canTwoCartsPass ? Math.min(0.35, Math.max(0.25, (aisle.freeWidth / 2) - 0.28)) : 0;

  if (isAlongZ) {
    // Determine player heading sign: facing +Z or -Z
    const facingNorth = Math.cos(player.heading) >= 0;
    const distanceAhead = 5.2;

    if (facingNorth) {
      // Player faces +Z, their right is +X, their left is -X.
      // NPC faces -Z, walks towards -Z. NPC's right is -X!
      startZ = Math.min(state.warehouse.depth - 0.6, player.z + distanceAhead);
      startX = player.x - lateralShift;
      targetZ = Math.max(0.6, player.z - 3.0);
      targetX = startX;
      heading = Math.PI; // Facing -Z
    } else {
      // Player faces -Z, their right is -X, their left is +X.
      // NPC faces +Z, walks towards +Z. NPC's right is +X!
      startZ = Math.max(0.6, player.z - distanceAhead);
      startX = player.x + lateralShift;
      targetZ = Math.min(state.warehouse.depth - 0.6, player.z + 3.0);
      targetX = startX;
      heading = 0; // Facing +Z
    }
  } else {
    // Aisle along X
    const facingEast = Math.sin(player.heading) >= 0;
    const distanceAhead = 5.2;

    if (facingEast) {
      // Player faces +X, right is -Z, left is +Z.
      // NPC faces -X, right is +Z.
      startX = Math.min(state.warehouse.width - 0.6, player.x + distanceAhead);
      startZ = player.z + lateralShift;
      targetX = Math.max(0.6, player.x - 3.0);
      targetZ = startZ;
      heading = -Math.PI / 2; // Facing -X
    } else {
      // Player faces -X, right is +Z, left is -Z.
      // NPC faces +X, right is -Z.
      startX = Math.max(0.6, player.x - distanceAhead);
      startZ = player.z - lateralShift;
      targetX = Math.min(state.warehouse.width - 0.6, player.x + 3.0);
      targetZ = startZ;
      heading = Math.PI / 2; // Facing +X
    }
  }

  return {
    active: true,
    x: startX,
    z: startZ,
    heading,
    speed: 1.15, // Walking speed ~1.15 m/s
    startX,
    startZ,
    targetX,
    targetZ,
    passedPlayer: false,
    collidedWithPlayer: false,
    result: 'testing',
    message: `Iniciando cruce bidireccional en pasillo (${aisle.freeWidth.toFixed(2)} m)...`,
    distanceTraveled: 0,
  };
}

/**
 * Updates NPC position during the crossing simulation.
 */
export function updateNpcCrossingStep(
  npc: NpcSimulationState,
  player: CartPhysicsState,
  aisle: AisleMeasurement,
  deltaTime: number
): NpcSimulationState {
  if (!npc.active || npc.result === 'approved' || npc.result === 'failed') {
    return npc;
  }

  const dt = Math.min(0.08, deltaTime);
  const stepDist = npc.speed * dt;

  // Move along NPC heading
  const nextX = npc.x + Math.sin(npc.heading) * stepDist;
  const nextZ = npc.z + Math.cos(npc.heading) * stepDist;

  // Calculate distance between player and NPC centers
  const dx = player.x - nextX;
  const dz = player.z - nextZ;
  const distToPlayer = Math.sqrt(dx * dx + dz * dz);

  // Check if aisle allows 2 carts to pass
  if (!aisle.canTwoCartsPass) {
    // Passage is too narrow! Free width < 1.20m
    // As NPC approaches within collision range (< 1.30m front-to-front):
    if (distToPlayer < 1.30) {
      walkthroughAudio.playFailed();
      return {
        ...npc,
        x: nextX,
        z: nextZ,
        active: false, // Second person disappears once check is concluded
        collidedWithPlayer: true,
        result: 'failed',
        message: `❌ Corregir Pasillo: Espacio insuficiente (${aisle.freeWidth.toFixed(2)} m). Los 2 carritos no logran cruzarse simultáneamente. Se requiere mínimo ${REQUIRED_TWO_CARTS_PASS_WIDTH.toFixed(2)} m de ancho libre.`,
      };
    }
  }

  // Check if NPC has walked past the player
  const traveledFromStart = Math.sqrt((nextX - npc.startX) ** 2 + (nextZ - npc.startZ) ** 2);
  const totalTargetDist = Math.sqrt((npc.targetX - npc.startX) ** 2 + (npc.targetZ - npc.startZ) ** 2);

  // Vector from player to NPC projected along player's heading
  const dotForward = (nextX - player.x) * Math.sin(player.heading) + (nextZ - player.z) * Math.cos(player.heading);

  // When NPC has crossed behind player or reached target distance
  if (dotForward < -1.1 || traveledFromStart >= totalTargetDist) {
    walkthroughAudio.playApproved();
    return {
      ...npc,
      x: nextX,
      z: nextZ,
      active: false, // Second person disappears once check is concluded
      passedPlayer: true,
      result: 'approved',
      message: `✅ Pasillo Aprobado: Ancho óptimo de ${aisle.freeWidth.toFixed(2)} m. Ambos clientes cruzaron sin colisión ni demoras.`,
    };
  }

  return {
    ...npc,
    x: nextX,
    z: nextZ,
    distanceTraveled: traveledFromStart,
    message: `Evaluando cruce en movimiento... Distancia entre carritos: ${distToPlayer.toFixed(1)} m`,
  };
}

/**
 * Scans the entire salon to find all narrow points (cuellos de botella)
 * Suggested additional feature for store layout validation.
 */
export function scanAllSalonBottlenecks(state: AppState): BottleneckPoint[] {
  const colliders = getAllColliders(state, null, -1, 'salon');
  const bottlenecks: BottleneckPoint[] = [];

  // Pairwise distance between adjacent parallel fixtures
  for (let i = 0; i < colliders.length; i++) {
    for (let j = i + 1; j < colliders.length; j++) {
      const b1 = colliders[i].bounds;
      const b2 = colliders[j].bounds;

      // Check horizontal (X) clearance when overlapping in Z
      const zOverlap = Math.min(b1.z1, b2.z1) - Math.max(b1.z0, b2.z0);
      if (zOverlap > 0.4) {
        const gapX = Math.max(0, Math.max(b1.x0, b2.x0) - Math.min(b1.x1, b2.x1));
        if (gapX > 0.1 && gapX < 1.40) {
          const midX = (Math.min(b1.x1, b2.x1) + Math.max(b1.x0, b2.x0)) / 2;
          const midZ = (Math.max(b1.z0, b2.z0) + Math.min(b1.z1, b2.z1)) / 2;

          bottlenecks.push({
            x: Math.round(midX * 100) / 100,
            z: Math.round(midZ * 100) / 100,
            width: Math.round(gapX * 100) / 100,
            severity: gapX < 0.90 ? 'critical' : gapX < 1.30 ? 'warning' : 'info',
            description:
              gapX < 0.90
                ? `Paso bloqueado (${gapX.toFixed(2)} m): Menor a accesibilidad 90 cm.`
                : `Paso angosto (${gapX.toFixed(2)} m): Permite 1 solo carro, no permite cruce de 2.`,
          });
        }
      }

      // Check vertical (Z) clearance when overlapping in X
      const xOverlap = Math.min(b1.x1, b2.x1) - Math.max(b1.x0, b2.x0);
      if (xOverlap > 0.4) {
        const gapZ = Math.max(0, Math.max(b1.z0, b2.z0) - Math.min(b1.z1, b2.z1));
        if (gapZ > 0.1 && gapZ < 1.40) {
          const midX = (Math.max(b1.x0, b2.x0) + Math.min(b1.x1, b2.x1)) / 2;
          const midZ = (Math.min(b1.z1, b2.z1) + Math.max(b1.z0, b2.z0)) / 2;

          bottlenecks.push({
            x: Math.round(midX * 100) / 100,
            z: Math.round(midZ * 100) / 100,
            width: Math.round(gapZ * 100) / 100,
            severity: gapZ < 0.90 ? 'critical' : gapZ < 1.30 ? 'warning' : 'info',
            description:
              gapZ < 0.90
                ? `Paso bloqueado (${gapZ.toFixed(2)} m): Menor a accesibilidad 90 cm.`
                : `Paso angosto (${gapZ.toFixed(2)} m): Cruce estrecho de 2 carritos.`,
          });
        }
      }
    }
  }

  return bottlenecks;
}
