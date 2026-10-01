import * as THREE from 'three';

// Procedural texture generators for ultra-high realism
export function createPostTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#4a5568';
  ctx.fillRect(0, 0, 128, 512);

  // Subtle metallic brush gradient
  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.25)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.08)');
  grad.addColorStop(0.7, 'rgba(0,0,0,0.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 512);

  // Punch slots for rack teardrop perforations
  ctx.fillStyle = '#1a202c';
  for (let y = 20; y < 500; y += 32) {
    // Left slot pair
    ctx.beginPath();
    ctx.roundRect(24, y, 14, 20, 4);
    ctx.fill();

    // Right slot pair
    ctx.beginPath();
    ctx.roundRect(90, y, 14, 20, 4);
    ctx.fill();

    // Secondary circular hole
    ctx.beginPath();
    ctx.arc(31, y + 24, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(97, y + 24, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Edge highlight bevels
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(0, 0, 4, 512);
  ctx.fillRect(124, 0, 4, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.anisotropy = 4;
  return tex;
}

export function createAnglePostTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 0, 64, 512);

  // Vertical steel brush lines
  ctx.fillStyle = '#0f172a';
  for (let y = 14; y < 500; y += 22) {
    ctx.beginPath();
    ctx.roundRect(14, y, 12, 14, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(38, y, 12, 14, 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.anisotropy = 4;
  return tex;
}

export function createShelfTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle galvanized sheet metal flakes / spangle pattern
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = 2 + Math.random() * 8;
    const h = 2 + Math.random() * 8;
    ctx.fillRect(x, y, w, h);
  }

  // Steel longitudinal stiffener ribs
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 3;
  for (let y = 64; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 4;
  return tex;
}

export function createGondolaBackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 512);

  // Horizontal panelling slats with subtle grooves
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Subtle pegboard / perforation pattern
  ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
  for (let y = 16; y < 512; y += 32) {
    for (let x = 16; x < 256; x += 32) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.anisotropy = 4;
  return tex;
}

export function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Industrial epoxy / polished concrete finish
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle slab joints
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 512, 512);

  // Subtle speckles
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = 4;
  return tex;
}

export function createHazardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  for (let i = -128; i < 256; i += 32) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 16, 0);
    ctx.lineTo(i + 16 + 128, 128);
    ctx.lineTo(i + 128, 128);
    ctx.closePath();
  }
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

export interface AppMaterials {
  // Minirack
  post: THREE.MeshStandardMaterial;
  brace: THREE.MeshStandardMaterial;
  beam: THREE.MeshStandardMaterial;
  shelf: THREE.MeshStandardMaterial;

  // Estantería
  estPost: THREE.MeshStandardMaterial;
  estShelf: THREE.MeshStandardMaterial;
  estCorner: THREE.MeshStandardMaterial;

  // Góndola Pared
  gParedPost: THREE.MeshStandardMaterial;
  gParedBack: THREE.MeshStandardMaterial;
  gParedShelf: THREE.MeshStandardMaterial;
  gParedBracket: THREE.MeshStandardMaterial;
  gParedPriceTag: THREE.MeshStandardMaterial;
  gParedZocalo: THREE.MeshStandardMaterial;
  gParedFoot: THREE.MeshStandardMaterial;

  // Góndola Central
  gCentPost: THREE.MeshStandardMaterial;
  gCentBack: THREE.MeshStandardMaterial;
  gCentShelf: THREE.MeshStandardMaterial;
  gCentBracket: THREE.MeshStandardMaterial;
  gCentPriceTagA: THREE.MeshStandardMaterial;
  gCentPriceTagB: THREE.MeshStandardMaterial;
  gCentZocalo: THREE.MeshStandardMaterial;
  gCentFoot: THREE.MeshStandardMaterial;

  // Obstacles & Building
  column: THREE.MeshStandardMaterial;
  colBase: THREE.MeshStandardMaterial;
  opening: THREE.MeshStandardMaterial;
  openFloor: THREE.MeshStandardMaterial;
  aisleFloor: THREE.MeshStandardMaterial;
  floorMat: THREE.MeshStandardMaterial;
  depWallMat: THREE.MeshStandardMaterial;

  // ── Salón Materials ──
  glass: THREE.MeshStandardMaterial;
  refrigBodyWhite: THREE.MeshStandardMaterial;
  refrigBodyBlack: THREE.MeshStandardMaterial;
  refrigBodyInox: THREE.MeshStandardMaterial;
  refrigLed: THREE.MeshStandardMaterial;
  checkoutBody: THREE.MeshStandardMaterial;
  checkoutTop: THREE.MeshStandardMaterial;
  checkoutBelt: THREE.MeshStandardMaterial;
  checkoutScreen: THREE.MeshStandardMaterial;
  doorFrame: THREE.MeshStandardMaterial;
  doorIndustrial: THREE.MeshStandardMaterial;

  // ── Depósito Materials ──
  heavyPost: THREE.MeshStandardMaterial;
  heavyBeam: THREE.MeshStandardMaterial;
  palletWood: THREE.MeshStandardMaterial;
  palletBox: THREE.MeshStandardMaterial;
}

export function initMaterials(): AppMaterials {
  const postTex = createPostTexture();
  const angleTex = createAnglePostTexture();
  const shelfTex = createShelfTexture();
  const gondolaBackTex = createGondolaBackTexture();
  const floorTex = createFloorTexture();
  const hazardTex = createHazardTexture();

  return {
    // Minirack
    post: new THREE.MeshStandardMaterial({
      color: 0x52525b,
      metalness: 0.75,
      roughness: 0.3,
      map: postTex,
      bumpMap: postTex,
      bumpScale: 0.008,
    }),
    brace: new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      metalness: 0.65,
      roughness: 0.35,
    }),
    beam: new THREE.MeshStandardMaterial({
      color: 0xf97316, // Safety orange epoxy
      metalness: 0.35,
      roughness: 0.3,
    }),
    shelf: new THREE.MeshStandardMaterial({
      color: 0x71717a,
      metalness: 0.45,
      roughness: 0.5,
      map: shelfTex,
    }),

    // Estantería
    estPost: new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Industrial Blue slotted angle
      metalness: 0.55,
      roughness: 0.35,
      map: angleTex,
      bumpMap: angleTex,
      bumpScale: 0.006,
    }),
    estShelf: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.45,
      roughness: 0.45,
      map: shelfTex,
    }),
    estCorner: new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      metalness: 0.7,
      roughness: 0.25,
    }),

    // Góndola Pared
    gParedPost: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.25,
      roughness: 0.25,
    }),
    gParedBack: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.15,
      roughness: 0.35,
      map: gondolaBackTex,
    }),
    gParedShelf: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.25,
      roughness: 0.25,
    }),
    gParedBracket: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.45,
      roughness: 0.3,
    }),
    gParedPriceTag: new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Vivid Red Price Tag Extrusion
      metalness: 0.1,
      roughness: 0.25,
    }),
    gParedZocalo: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.3,
      roughness: 0.35,
    }),
    gParedFoot: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.3,
      roughness: 0.3,
    }),

    // Góndola Central
    gCentPost: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.25,
      roughness: 0.25,
    }),
    gCentBack: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.15,
      roughness: 0.35,
      map: gondolaBackTex,
    }),
    gCentShelf: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.25,
      roughness: 0.25,
    }),
    gCentBracket: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.45,
      roughness: 0.3,
    }),
    gCentPriceTagA: new THREE.MeshStandardMaterial({
      color: 0xe11d48, // Rose/Red side A
      metalness: 0.1,
      roughness: 0.25,
    }),
    gCentPriceTagB: new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky blue side B
      metalness: 0.1,
      roughness: 0.25,
    }),
    gCentZocalo: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.3,
      roughness: 0.35,
    }),
    gCentFoot: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.3,
      roughness: 0.3,
    }),

    // Obstacles & Building
    column: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.1,
      roughness: 0.85,
    }),
    colBase: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.4,
      map: hazardTex,
    }),
    opening: new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.75,
    }),
    openFloor: new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.4,
    }),
    aisleFloor: new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    }),
    floorMat: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.2,
      map: floorTex,
    }),
    depWallMat: new THREE.MeshStandardMaterial({
      color: 0x1e40af,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
      roughness: 0.35,
      metalness: 0.25,
    }),

    // ── Salón Materials ──
    glass: new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.38,
      roughness: 0.1,
      metalness: 0.9,
    }),
    refrigBodyWhite: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.2,
    }),
    refrigBodyBlack: new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.3,
    }),
    refrigBodyInox: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.8,
    }),
    refrigLed: new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    }),
    checkoutBody: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.3,
    }),
    checkoutTop: new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.2,
      metalness: 0.85,
    }),
    checkoutBelt: new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.85,
      metalness: 0.05,
    }),
    checkoutScreen: new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.5,
      roughness: 0.2,
    }),
    doorFrame: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.25,
      metalness: 0.75,
    }),
    doorIndustrial: new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber/Yellow industrial roller shutter
      roughness: 0.45,
      metalness: 0.4,
    }),

    // ── Depósito Materials ──
    heavyPost: new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Deep industrial blue heavy upright
      roughness: 0.35,
      metalness: 0.6,
    }),
    heavyBeam: new THREE.MeshStandardMaterial({
      color: 0xea580c, // Vivid Safety Orange heavy load beam
      roughness: 0.3,
      metalness: 0.45,
    }),
    palletWood: new THREE.MeshStandardMaterial({
      color: 0xb48a58, // Warm wood pine color
      roughness: 0.8,
      metalness: 0.05,
    }),
    palletBox: new THREE.MeshStandardMaterial({
      color: 0xc89d66, // Corrugated kraft paper box
      roughness: 0.75,
      metalness: 0.05,
    }),
  };
}
