import {
  AppState,
  Bounds3D,
  ColliderItem,
  CommercialDoor,
  GondolaCentralLine,
  GondolaParedLine,
  HeavyRackLine,
  HeladeraComercial,
  MinirackLine,
  Obstacle,
  PunteraGondola,
  CheckoutCounter,
  ShelfLine,
} from '../types';

export const MOVE_STEP = 0.1;

export function snap10(v: number): number {
  return Math.round(v * 10) / 10;
}

export function rectsOverlap(a: Bounds3D, b: Bounds3D, eps = 0.02): boolean {
  return a.x0 < b.x1 - eps && a.x1 > b.x0 + eps && a.z0 < b.z1 - eps && a.z1 > b.z0 + eps;
}

export function isWithinWarehouse(bounds: Bounds3D, warehouse: { width: number; depth: number }): boolean {
  const eps = 1e-4;
  return (
    bounds.x0 >= -eps &&
    bounds.z0 >= -eps &&
    bounds.x1 <= warehouse.width + eps &&
    bounds.z1 <= warehouse.depth + eps
  );
}

export function hasCollision(bounds: Bounds3D, colliders: ColliderItem[]): boolean {
  return colliders.some((c) => rectsOverlap(bounds, c.bounds));
}

// ── Bounds for Salón Elements ──
export function getPunteraBounds(p: PunteraGondola): Bounds3D {
  const pW = p.width || 0.9;
  const pD = p.depth || 0.45;
  const isRot = p.rotation === 90 || p.rotation === 270;
  const w = isRot ? pD : pW;
  const d = isRot ? pW : pD;
  return {
    x0: p.x,
    x1: p.x + w,
    z0: p.z,
    z1: p.z + d,
    h: p.height || 1.6,
  };
}

export function getHeladeraBounds(h: HeladeraComercial): Bounds3D {
  const isRot = h.rotation === 90 || h.rotation === 270;
  const w = isRot ? h.depth : h.width;
  const d = isRot ? h.width : h.depth;
  return {
    x0: h.x,
    x1: h.x + w,
    z0: h.z,
    z1: h.z + d,
    h: h.height,
  };
}

export function getCheckoutBounds(c: CheckoutCounter): Bounds3D {
  const isRot = c.rotation === 90 || c.rotation === 270;
  const w = isRot ? c.width : c.length;
  const d = isRot ? c.length : c.width;
  return {
    x0: c.x,
    x1: c.x + w,
    z0: c.z,
    z1: c.z + d,
    h: c.height,
  };
}

export function getDoorBounds(door: CommercialDoor): Bounds3D {
  const isRot = door.rotation === 90 || door.rotation === 270;
  const dThick = 0.25;
  const w = isRot ? dThick : door.width;
  const d = isRot ? door.width : dThick;
  return {
    x0: door.x,
    x1: door.x + w,
    z0: door.z,
    z1: door.z + d,
    h: door.height,
  };
}

// ── Bounds for Heavy Racks (Depósito) ──
export function realHeavyRackLineWidth(line: HeavyRackLine): number {
  return line.modules.reduce((acc, m) => acc + m.bl, 0);
}

export function getHeavyRackLineBounds(line: HeavyRackLine, depth: number): Bounds3D {
  const len = realHeavyRackLineWidth(line);
  const isRot = line.rotation === 90 || line.rotation === 270;
  const w = isRot ? depth : len;
  const d = isRot ? len : depth;
  return {
    x0: line.xOff,
    x1: line.xOff + w,
    z0: line.zOff,
    z1: line.zOff + d,
    h: line.height,
  };
}

/**
 * Validates and adjusts a movement attempt so that:
 * 1. The product NEVER leaves the warehouse boundaries.
 * 2. The product NEVER overlaps with another product or obstacle.
 * If direct target collides, attempts single-axis slide (X or Z).
 * Returns the valid position (or curX, curZ if blocked).
 */
export function tryMoveWithConstraints(
  curX: number,
  curZ: number,
  targetX: number,
  targetZ: number,
  width: number,
  depth: number,
  warehouse: { width: number; depth: number },
  colliders: ColliderItem[]
): { x: number; z: number; collided: boolean } {
  // 1. Strictly clamp to warehouse limits
  const maxAllowedX = Math.max(0, snap10(warehouse.width - width));
  const maxAllowedZ = Math.max(0, snap10(warehouse.depth - depth));

  const candX = Math.max(0, Math.min(maxAllowedX, snap10(targetX)));
  const candZ = Math.max(0, Math.min(maxAllowedZ, snap10(targetZ)));

  const candBounds: Bounds3D = {
    x0: candX,
    x1: candX + width,
    z0: candZ,
    z1: candZ + depth,
  };

  // Test full target position
  if (isWithinWarehouse(candBounds, warehouse) && !hasCollision(candBounds, colliders)) {
    return { x: candX, z: candZ, collided: false };
  }

  // Attempt sliding along X axis only
  const slideXBounds: Bounds3D = {
    x0: candX,
    x1: candX + width,
    z0: curZ,
    z1: curZ + depth,
  };
  if (isWithinWarehouse(slideXBounds, warehouse) && !hasCollision(slideXBounds, colliders)) {
    return { x: candX, z: curZ, collided: true };
  }

  // If candX collided, attempt to clamp to nearest collider boundary along X
  let bestX = curX;
  if (candX > curX) {
    // Moving positive X: find nearest collider on the right
    let minX1 = candX;
    colliders.forEach((c) => {
      const zOverlap = !(curZ + depth <= c.bounds.z0 || curZ >= c.bounds.z1);
      if (zOverlap && c.bounds.x0 >= curX + width - 0.01 && c.bounds.x0 < minX1 + width) {
        minX1 = Math.min(minX1, c.bounds.x0 - width);
      }
    });
    if (minX1 > curX) bestX = Number(minX1.toFixed(2));
  } else if (candX < curX) {
    // Moving negative X: find nearest collider on the left
    let maxX0 = candX;
    colliders.forEach((c) => {
      const zOverlap = !(curZ + depth <= c.bounds.z0 || curZ >= c.bounds.z1);
      if (zOverlap && c.bounds.x1 <= curX + 0.01 && c.bounds.x1 > maxX0) {
        maxX0 = Math.max(maxX0, c.bounds.x1);
      }
    });
    if (maxX0 < curX) bestX = Number(maxX0.toFixed(2));
  }

  if (bestX !== curX) {
    const testBounds: Bounds3D = { x0: bestX, x1: bestX + width, z0: curZ, z1: curZ + depth };
    if (isWithinWarehouse(testBounds, warehouse) && !hasCollision(testBounds, colliders)) {
      return { x: bestX, z: curZ, collided: true };
    }
  }

  // Attempt sliding along Z axis only
  const slideZBounds: Bounds3D = {
    x0: curX,
    x1: curX + width,
    z0: candZ,
    z1: candZ + depth,
  };
  if (isWithinWarehouse(slideZBounds, warehouse) && !hasCollision(slideZBounds, colliders)) {
    return { x: curX, z: candZ, collided: true };
  }

  // If candZ collided, attempt to clamp to nearest collider boundary along Z
  let bestZ = curZ;
  if (candZ > curZ) {
    let minZ1 = candZ;
    colliders.forEach((c) => {
      const xOverlap = !(curX + width <= c.bounds.x0 || curX >= c.bounds.x1);
      if (xOverlap && c.bounds.z0 >= curZ + depth - 0.01 && c.bounds.z0 < minZ1 + depth) {
        minZ1 = Math.min(minZ1, c.bounds.z0 - depth);
      }
    });
    if (minZ1 > curZ) bestZ = Number(minZ1.toFixed(2));
  } else if (candZ < curZ) {
    let maxZ0 = candZ;
    colliders.forEach((c) => {
      const xOverlap = !(curX + width <= c.bounds.x0 || curX >= c.bounds.x1);
      if (xOverlap && c.bounds.z1 <= curZ + 0.01 && c.bounds.z1 > maxZ0) {
        maxZ0 = Math.max(maxZ0, c.bounds.z1);
      }
    });
    if (maxZ0 < curZ) bestZ = Number(maxZ0.toFixed(2));
  }

  if (bestZ !== curZ) {
    const testBounds: Bounds3D = { x0: curX, x1: curX + width, z0: bestZ, z1: bestZ + depth };
    if (isWithinWarehouse(testBounds, warehouse) && !hasCollision(testBounds, colliders)) {
      return { x: curX, z: bestZ, collided: true };
    }
  }

  // Completely blocked by collision or boundary - keep current valid position
  return { x: curX, z: curZ, collided: true };
}

// ── Miniracks calculations ──
export function minirackLineWidth(line: MinirackLine): number {
  return line.modules.reduce((acc, m) => acc + m.bl, 0);
}

export function realMinirackLineWidth(line: MinirackLine): number {
  return minirackLineWidth(line) + (line.modules.length + 1) * 0.065;
}

export function getMinirackLineBounds(line: MinirackLine, depth: number): Bounds3D {
  const W = realMinirackLineWidth(line);
  const D = depth;
  const r = ((line.rotation || 0) % 360 + 360) % 360;
  return (r === 0 || r === 180)
    ? { x0: line.xOff, x1: line.xOff + W, z0: line.zOff, z1: line.zOff + D }
    : { x0: line.xOff, x1: line.xOff + D, z0: line.zOff, z1: line.zOff + W };
}

// ── Estanterías calculations ──
export function shelfLineWidth(line: ShelfLine): number {
  return line.modules.reduce((acc, m) => acc + m.bl, 0);
}

export function realShelfLineWidth(line: ShelfLine): number {
  return shelfLineWidth(line) + 0.04;
}

export function getShelfLineBounds(line: ShelfLine, depth: number): Bounds3D {
  const W = realShelfLineWidth(line);
  const D = depth;
  const r = ((line.rotation || 0) % 360 + 360) % 360;
  return (r === 0 || r === 180)
    ? { x0: line.xOff, x1: line.xOff + W, z0: line.zOff, z1: line.zOff + D }
    : { x0: line.xOff, x1: line.xOff + D, z0: line.zOff, z1: line.zOff + W };
}

// ── Góndolas de Pared calculations ──
export function gondolaParedLineWidth(line: GondolaParedLine): number {
  return line.modules.reduce((acc, m) => acc + m.bl, 0);
}

export function realGondolaParedLineWidth(line: GondolaParedLine): number {
  return gondolaParedLineWidth(line) + 0.04;
}

export function getGondolaParedLineBounds(line: GondolaParedLine, defaultDepth = 0.47): Bounds3D {
  const W = realGondolaParedLineWidth(line);
  const D = line.modules.reduce((maxD, m) => Math.max(maxD, m.depth || defaultDepth), defaultDepth);
  const r = ((line.rotation || 0) % 360 + 360) % 360;
  return (r === 0 || r === 180)
    ? { x0: line.xOff, x1: line.xOff + W, z0: line.zOff, z1: line.zOff + D }
    : { x0: line.xOff, x1: line.xOff + D, z0: line.zOff, z1: line.zOff + W };
}

// ── Góndolas Centrales calculations ──
export function gondolaCentralLineWidth(line: GondolaCentralLine): number {
  return line.modules.reduce((acc, m) => acc + m.bl, 0);
}

export function realGondolaCentralLineWidth(line: GondolaCentralLine): number {
  return gondolaCentralLineWidth(line) + 0.04;
}

export function getGondolaCentralLineBounds(line: GondolaCentralLine, defaultDepth = 0.47): Bounds3D {
  const W = realGondolaCentralLineWidth(line);
  const maxDA = line.modules.reduce((max, m) => Math.max(max, m.depthA || defaultDepth), defaultDepth);
  const maxDB = line.modules.reduce((max, m) => Math.max(max, m.depthB || defaultDepth), defaultDepth);
  const totalD = maxDA + maxDB;
  const r = ((line.rotation || 0) % 360 + 360) % 360;
  return (r === 0 || r === 180)
    ? { x0: line.xOff, x1: line.xOff + W, z0: line.zOff, z1: line.zOff + totalD }
    : { x0: line.xOff, x1: line.xOff + totalD, z0: line.zOff, z1: line.zOff + W };
}

// ── Obstacles calculations ──
export function getObstacleBounds(obs: Obstacle, warehouseHeight = 4.0): Bounds3D {
  const rot = obs.rotation || 0;
  if (obs.type === 'column') {
    return {
      x0: obs.x,
      x1: obs.x + obs.w,
      z0: obs.z,
      z1: obs.z + (obs.d || obs.w),
      h: warehouseHeight,
    };
  }
  const fw = obs.w;
  const fd = 0.18;
  if (rot === 0) {
    return { x0: obs.x, x1: obs.x + fw, z0: obs.z - fd / 2, z1: obs.z + fd / 2, h: obs.fh || 2.5 };
  } else {
    return { x0: obs.x - fd / 2, x1: obs.x + fd / 2, z0: obs.z, z1: obs.z + fw, h: obs.fh || 2.5 };
  }
}

export function clampObstacleToWarehouse(obs: Obstacle, state: AppState): void {
  obs.x = Math.max(0, snap10(obs.x));
  obs.z = Math.max(0, snap10(obs.z));
  if (!state.warehouse.enabled) return;

  const rot = obs.rotation || 0;
  const W = state.warehouse.width;
  const D = state.warehouse.depth;

  if (obs.type === 'column') {
    const dVal = obs.d || obs.w;
    obs.x = Math.max(0, Math.min(snap10(W - obs.w), obs.x));
    obs.z = Math.max(0, Math.min(snap10(D - dVal), obs.z));
  } else {
    const fw = obs.w;
    const fd = 0.18;
    if (rot === 0) {
      obs.x = Math.max(0, Math.min(snap10(W - fw), obs.x));
      obs.z = Math.max(snap10(fd / 2), Math.min(snap10(D - fd / 2), obs.z));
    } else {
      obs.x = Math.max(snap10(fd / 2), Math.min(snap10(W - fd / 2), obs.x));
      obs.z = Math.max(0, Math.min(snap10(D - fw), obs.z));
    }
  }
}

// ── Unified Colliders ──
export function getAllColliders(
  state: AppState,
  ignoreType?: string | null,
  ignoreIdx?: number | null,
  filterSection?: 'salon' | 'deposito'
): ColliderItem[] {
  const boxes: ColliderItem[] = [];
  const section = filterSection || state.activeSection;

  if (section === 'salon') {
    // Salón elements
    (state.gondolaPared?.lines || []).forEach((gpl, k) => {
      if (ignoreType === 'gondolaPared' && ignoreIdx === k) return;
      boxes.push({ type: 'gondolaPared', idx: k, bounds: getGondolaParedLineBounds(gpl, state.gondolaPared.depth) });
    });

    (state.gondolaCentral?.lines || []).forEach((gcl, m) => {
      if (ignoreType === 'gondolaCentral' && ignoreIdx === m) return;
      // If moving a puntera attached to this gondola line, ignore collision
      if (ignoreType === 'puntera' && ignoreIdx !== null && ignoreIdx !== undefined) {
        const p = state.punteras?.[ignoreIdx];
        if (p && p.attachedCentralIdx === m) return;
      }
      boxes.push({ type: 'gondolaCentral', idx: m, bounds: getGondolaCentralLineBounds(gcl, state.gondolaCentral.depth) });
    });

    (state.punteras || []).forEach((p, idx) => {
      if (ignoreType === 'puntera' && ignoreIdx === idx) return;
      // If moving a gondola line that this puntera is attached to, ignore collision
      if (ignoreType === 'gondolaCentral' && ignoreIdx !== null && ignoreIdx !== undefined) {
        if (p.attachedCentralIdx === ignoreIdx) return;
      }
      boxes.push({ type: 'puntera', idx, bounds: getPunteraBounds(p) });
    });

    (state.heladeras || []).forEach((h, idx) => {
      if (ignoreType === 'heladera' && ignoreIdx === idx) return;
      boxes.push({ type: 'heladera', idx, bounds: getHeladeraBounds(h) });
    });

    (state.checkouts || []).forEach((c, idx) => {
      if (ignoreType === 'checkout' && ignoreIdx === idx) return;
      boxes.push({ type: 'checkout', idx, bounds: getCheckoutBounds(c) });
    });
  } else {
    // Depósito elements
    (state.lines || []).forEach((l, i) => {
      if (ignoreType === 'minirack' && ignoreIdx === i) return;
      boxes.push({ type: 'minirack', idx: i, bounds: getMinirackLineBounds(l, state.depth) });
    });

    (state.heavyRacks?.lines || []).forEach((hrl, idx) => {
      if (ignoreType === 'heavyRack' && ignoreIdx === idx) return;
      boxes.push({ type: 'heavyRack', idx, bounds: getHeavyRackLineBounds(hrl, state.heavyRacks.depth) });
    });

    (state.shelfLines || []).forEach((sl, j) => {
      if (ignoreType === 'estanteria' && ignoreIdx === j) return;
      boxes.push({ type: 'estanteria', idx: j, bounds: getShelfLineBounds(sl, state.shelfDepth) });
    });
  }

  // Puertas (filter by section if assigned)
  (state.doors || []).forEach((door, idx) => {
    if (ignoreType === 'door' && ignoreIdx === idx) return;
    if (door.section && door.section !== section) return;
    boxes.push({ type: 'door', idx, bounds: getDoorBounds(door) });
  });

  // Obstáculos
  (state.obstacles || []).forEach((o, n) => {
    if (ignoreType === 'obstacle' && ignoreIdx === n) return;
    boxes.push({ type: 'obstacle', idx: n, bounds: getObstacleBounds(o, state.warehouse.height) });
  });

  return boxes;
}

export function isInsideWarehouse(bounds: Bounds3D, state: AppState): boolean {
  const W = state.warehouse.width;
  const D = state.warehouse.depth;
  const eps = 1e-4;
  return bounds.x0 >= -eps && bounds.z0 >= -eps && bounds.x1 <= W + eps && bounds.z1 <= D + eps;
}

export function findOpenPlacementSpot(state: AppState, w: number, d: number): { x: number; z: number } {
  const colliders = getAllColliders(state, null, -1);
  const maxW = state.warehouse.width;
  const maxD = state.warehouse.depth;
  const maxX = Math.max(0, snap10(maxW - w));
  const maxZ = Math.max(0, snap10(maxD - d));

  let lastZ = 0;
  colliders.forEach((c) => {
    lastZ = Math.max(lastZ, c.bounds.z1);
  });
  const preferredZ = Math.min(maxZ, snap10(lastZ + 0.8));
  const cand0 = { x0: 1.0, x1: 1.0 + w, z0: preferredZ, z1: preferredZ + d };

  if (1.0 + w <= maxW + 1e-4 && preferredZ + d <= maxD + 1e-4 && !colliders.some((c) => rectsOverlap(cand0, c.bounds))) {
    return { x: 1.0, z: preferredZ };
  }

  for (let tz = 0.5; tz <= maxZ; tz = snap10(tz + 0.5)) {
    for (let tx = 0.5; tx <= maxX; tx = snap10(tx + 0.5)) {
      const cand = { x0: tx, x1: tx + w, z0: tz, z1: tz + d };
      const hit = colliders.some((c) => rectsOverlap(cand, c.bounds));
      if (!hit) return { x: tx, z: tz };
    }
  }
  return { x: 0, z: 0 };
}

// ── Overall Bill of Materials & Capacities ──
export interface MaterialsSummary {
  // Minirack (Racks Livianos)
  minirackBastidores: number;
  minirackPaneles: number;
  minirackVigas: Record<number, number>;
  minirackCargaKg: number;

  // Racks Pesados (Selectivos)
  heavyRackBastidores: number;
  heavyRackVigas: Record<number, number>;
  heavyRackPallets: number;
  heavyRackCargaKg: number;

  // Estantería
  estanteriaAngulos: number;
  estanteriaBandejas: number;
  estanteriaModulos: Record<number, number>;
  estanteriaCargaKg: number;

  // Góndola Pared
  gondolaParedColumnas: number;
  gondolaParedBandejas: number;
  gondolaParedMensulas: number;
  gondolaParedCargaKg: number;

  // Góndola Central
  gondolaCentralColumnas: number;
  gondolaCentralBandejas: number;
  gondolaCentralMensulas: number;
  gondolaCentralCargaKg: number;

  // Salón Elements
  punterasCount: number;
  punterasBandejas: number;
  heladerasCount: number;
  checkoutsCount: number;
  puertasCount: number;

  // Totals
  cargaTotalKg: number;
  areaOcupadaM2: number;
  enclosingWidth: number;
  enclosingDepth: number;
}

export function computeBeamMultiplier(bl: number): number {
  if (bl === 1.2) return 4;
  if (bl === 1.5) return 5;
  return 6;
}

export function calculateSummary(state: AppState): MaterialsSummary {
  const isSalon = state.activeSection === 'salon';

  // 1. Miniracks (Racks Livianos) - Only in Depósito
  const minirackVigas: Record<number, number> = {};
  let minirackBastidores = 0;
  let minirackPaneles = 0;
  let minirackCargaKg = 0;

  if (!isSalon) {
    (state.lines || []).forEach((l) => {
      minirackBastidores += l.modules.length + 1;
      l.modules.forEach((m) => {
        const sc = m.sc ?? state.shelfCount;
        minirackVigas[m.bl] = (minirackVigas[m.bl] || 0) + sc * 2;
        minirackPaneles += sc * computeBeamMultiplier(m.bl);
        minirackCargaKg += sc * 400; // 400 kg per shelf tier
      });
    });
  }

  // 1.b Racks Pesados (Selectivos para pallets) - Only in Depósito
  const heavyRackVigas: Record<number, number> = {};
  let heavyRackBastidores = 0;
  let heavyRackPallets = 0;
  let heavyRackCargaKg = 0;

  if (!isSalon) {
    (state.heavyRacks?.lines || []).forEach((l) => {
      heavyRackBastidores += l.modules.length + 1;
      l.modules.forEach((m) => {
        const lev = m.levels || 3;
        heavyRackVigas[m.bl] = (heavyRackVigas[m.bl] || 0) + lev * 2;
        const palletsPerLevel = m.bl >= 3.0 ? 4 : m.bl >= 2.5 ? 3 : 2;
        heavyRackPallets += lev * palletsPerLevel;
        heavyRackCargaKg += lev * (m.capPerLevel || 2000);
      });
    });
  }

  // 2. Estanterías Metálicas - Only in Depósito
  const estanteriaModulos: Record<number, number> = {};
  let estanteriaAngulos = 0;
  let estanteriaBandejas = 0;
  let estanteriaCargaKg = 0;
  const defaultCap = state.shelfCapacity || 100;

  if (!isSalon) {
    (state.shelfLines || []).forEach((sl) => {
      estanteriaAngulos += 4 + (sl.modules.length - 1) * 2;
      sl.modules.forEach((m) => {
        const sc = m.sc ?? state.shelfLevels;
        estanteriaModulos[m.bl] = (estanteriaModulos[m.bl] || 0) + sc;
        estanteriaBandejas += sc;
        estanteriaCargaKg += sc * (m.cap ?? defaultCap);
      });
    });
  }

  // 3. Góndolas Pared - Only in Salón
  let gondolaParedColumnas = 0;
  let gondolaParedBandejas = 0;
  let gondolaParedMensulas = 0;
  let gondolaParedCargaKg = 0;

  if (isSalon) {
    (state.gondolaPared?.lines || []).forEach((l) => {
      gondolaParedColumnas += l.modules.length + 1;
      l.modules.forEach((m) => {
        const sc = m.sc || state.gondolaPared.shelfCount || 5;
        gondolaParedBandejas += sc;
        gondolaParedMensulas += Math.max(0, sc - 1) * 2;
        gondolaParedCargaKg += sc * 80; // 80 kg per shelf
      });
    });
  }

  // 4. Góndolas Centrales - Only in Salón
  let gondolaCentralColumnas = 0;
  let gondolaCentralBandejas = 0;
  let gondolaCentralMensulas = 0;
  let gondolaCentralCargaKg = 0;

  if (isSalon) {
    (state.gondolaCentral?.lines || []).forEach((l) => {
      gondolaCentralColumnas += l.modules.length + 1;
      l.modules.forEach((m) => {
        const scA = m.scA || state.gondolaCentral.shelfCount || 3;
        const scB = m.scB || state.gondolaCentral.shelfCount || 3;
        const totalShelves = scA + scB;
        gondolaCentralBandejas += totalShelves;
        gondolaCentralMensulas += (Math.max(0, scA - 1) + Math.max(0, scB - 1)) * 2;
        gondolaCentralCargaKg += totalShelves * 80;
      });
    });
  }

  // 5. Salón Specific Products (Punteras, Heladeras, Check Outs)
  let punterasCount = 0;
  let punterasBandejas = 0;
  let heladerasCount = 0;
  let checkoutsCount = 0;

  if (isSalon) {
    punterasCount = state.punteras?.length || 0;
    (state.punteras || []).forEach((p) => {
      punterasBandejas += p.shelfCount || 4;
    });
    heladerasCount = state.heladeras?.length || 0;
    checkoutsCount = state.checkouts?.length || 0;
  }

  // Puertas según sección
  const relevantDoors = (state.doors || []).filter((d) =>
    isSalon ? d.section === 'salon' || !d.section : d.section === 'deposito'
  );
  const puertasCount = relevantDoors.length;

  // Enclosing footprint strictly for active workspace elements
  let maxX = 0;
  let maxZ = 0;

  if (!isSalon) {
    (state.lines || []).forEach((l) => {
      const b = getMinirackLineBounds(l, state.depth);
      maxX = Math.max(maxX, b.x1);
      maxZ = Math.max(maxZ, b.z1);
    });
    (state.heavyRacks?.lines || []).forEach((hrl) => {
      const b = getHeavyRackLineBounds(hrl, state.heavyRacks.depth);
      maxX = Math.max(maxX, b.x1);
      maxZ = Math.max(maxZ, b.z1);
    });
    (state.shelfLines || []).forEach((sl) => {
      const b = getShelfLineBounds(sl, state.shelfDepth);
      maxX = Math.max(maxX, b.x1);
      maxZ = Math.max(maxZ, b.z1);
    });
  } else {
    (state.gondolaPared?.lines || []).forEach((gpl) => {
      const b = getGondolaParedLineBounds(gpl, state.gondolaPared.depth);
      maxX = Math.max(maxX, b.x1);
      maxZ = Math.max(maxZ, b.z1);
    });
    (state.gondolaCentral?.lines || []).forEach((gcl) => {
      const b = getGondolaCentralLineBounds(gcl, state.gondolaCentral.depth);
      maxX = Math.max(maxX, b.x1);
      maxZ = Math.max(maxZ, b.z1);
    });
    (state.punteras || []).forEach((p) => {
      const b = getPunteraBounds(p);
      maxX = Math.max(maxX, b.x1);
      maxZ = Math.max(maxZ, b.z1);
    });
    (state.heladeras || []).forEach((h) => {
      const b = getHeladeraBounds(h);
      maxX = Math.max(maxX, b.x1);
      maxZ = Math.max(maxZ, b.z1);
    });
    (state.checkouts || []).forEach((c) => {
      const b = getCheckoutBounds(c);
      maxX = Math.max(maxX, b.x1);
      maxZ = Math.max(maxZ, b.z1);
    });
  }

  relevantDoors.forEach((d) => {
    const b = getDoorBounds(d);
    maxX = Math.max(maxX, b.x1);
    maxZ = Math.max(maxZ, b.z1);
  });
  (state.obstacles || []).forEach((o) => {
    const b = getObstacleBounds(o, state.warehouse.height);
    maxX = Math.max(maxX, b.x1);
    maxZ = Math.max(maxZ, b.z1);
  });

  const cargaTotalKg = isSalon
    ? gondolaParedCargaKg + gondolaCentralCargaKg + (punterasBandejas * 60)
    : minirackCargaKg + heavyRackCargaKg + estanteriaCargaKg;

  const areaOcupadaM2 = maxX * maxZ;

  return {
    minirackBastidores,
    minirackPaneles,
    minirackVigas,
    minirackCargaKg,

    heavyRackBastidores,
    heavyRackVigas,
    heavyRackPallets,
    heavyRackCargaKg,

    estanteriaAngulos,
    estanteriaBandejas,
    estanteriaModulos,
    estanteriaCargaKg,

    gondolaParedColumnas,
    gondolaParedBandejas,
    gondolaParedMensulas,
    gondolaParedCargaKg,

    gondolaCentralColumnas,
    gondolaCentralBandejas,
    gondolaCentralMensulas,
    gondolaCentralCargaKg,

    punterasCount,
    punterasBandejas,
    heladerasCount,
    checkoutsCount,
    puertasCount,

    cargaTotalKg,
    areaOcupadaM2,
    enclosingWidth: maxX,
    enclosingDepth: maxZ,
  };
}

export function getAttachedPunteraPosition(
  gcline: GondolaCentralLine,
  pWidth: number,
  pDepth: number,
  end: 'head' | 'tail' = 'head',
  defaultDepth = 0.47
): { x: number; z: number; rotation: number } {
  const b = getGondolaCentralLineBounds(gcline, defaultDepth);
  const rot = ((gcline.rotation || 0) % 360 + 360) % 360;

  if (rot === 0 || rot === 180) {
    // Gondola runs horizontally along X axis
    const centerZ = (b.z0 + b.z1) / 2;
    if (end === 'head') {
      return {
        x: Number(b.x1.toFixed(2)),
        z: Number((centerZ - pWidth / 2).toFixed(2)),
        rotation: 90,
      };
    } else {
      return {
        x: Math.max(0, Number((b.x0 - pDepth).toFixed(2))),
        z: Number((centerZ - pWidth / 2).toFixed(2)),
        rotation: 270,
      };
    }
  } else {
    // Gondola runs vertically along Z axis
    const centerX = (b.x0 + b.x1) / 2;
    if (end === 'head') {
      return {
        x: Number((centerX - pWidth / 2).toFixed(2)),
        z: Number(b.z1.toFixed(2)),
        rotation: 0,
      };
    } else {
      return {
        x: Number((centerX - pWidth / 2).toFixed(2)),
        z: Math.max(0, Number((b.z0 - pDepth).toFixed(2))),
        rotation: 180,
      };
    }
  }
}

