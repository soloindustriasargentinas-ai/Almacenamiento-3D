import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  AppState,
  CommercialDoor,
  GondolaCentralLine,
  GondolaParedLine,
  HeavyRackLine,
  HeladeraComercial,
  MinirackLine,
  Obstacle,
  PunteraGondola,
  CheckoutCounter,
  SelectionState,
  ShelfLine,
  ViewMode,
} from '../types';
import {
  getDoorBounds,
  getGondolaCentralLineBounds,
  getGondolaParedLineBounds,
  getHeavyRackLineBounds,
  getHeladeraBounds,
  getMinirackLineBounds,
  getObstacleBounds,
  getPunteraBounds,
  getCheckoutBounds,
  getShelfLineBounds,
  realGondolaCentralLineWidth,
  realGondolaParedLineWidth,
  realHeavyRackLineWidth,
  realMinirackLineWidth,
  realShelfLineWidth,
  snap10,
} from '../utils/calculations';
import { AppMaterials, initMaterials } from '../utils/materials';

interface Viewport3DProps {
  state: AppState;
  selection: SelectionState;
  onSelect: (sel: SelectionState) => void;
  onMoveMinirack: (idx: number, x: number, z: number) => void;
  onMoveShelf: (idx: number, x: number, z: number) => void;
  onMoveGondolaPared: (idx: number, x: number, z: number) => void;
  onMoveGondolaCentral: (idx: number, x: number, z: number) => void;
  onMoveObstacle: (idx: number, x: number, z: number) => void;
  onMovePuntera?: (idx: number, x: number, z: number) => void;
  onMoveHeladera?: (idx: number, x: number, z: number) => void;
  onMoveCheckout?: (idx: number, x: number, z: number) => void;
  onMoveDoor?: (idx: number, x: number, z: number) => void;
  onMoveHeavyRack?: (idx: number, x: number, z: number) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onToggleShadows?: () => void;
  onToggleDims?: () => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  state,
  selection,
  onSelect,
  onMoveMinirack,
  onMoveShelf,
  onMoveGondolaPared,
  onMoveGondolaCentral,
  onMoveObstacle,
  onMovePuntera,
  onMoveHeladera,
  onMoveCheckout,
  onMoveDoor,
  onMoveHeavyRack,
  onSetViewMode,
  onToggleShadows,
  onToggleDims,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimCanvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const materialsRef = useRef<AppMaterials | null>(null);

  // Groups
  const minirackGroupRef = useRef<THREE.Group>(new THREE.Group());
  const shelfGroupRef = useRef<THREE.Group>(new THREE.Group());
  const gondolaParedGroupRef = useRef<THREE.Group>(new THREE.Group());
  const gondolaCentralGroupRef = useRef<THREE.Group>(new THREE.Group());
  const obstacleGroupRef = useRef<THREE.Group>(new THREE.Group());
  const warehouseGroupRef = useRef<THREE.Group>(new THREE.Group());
  const aisleGroupRef = useRef<THREE.Group>(new THREE.Group());
  const punteraGroupRef = useRef<THREE.Group>(new THREE.Group());
  const heladeraGroupRef = useRef<THREE.Group>(new THREE.Group());
  const checkoutGroupRef = useRef<THREE.Group>(new THREE.Group());
  const doorGroupRef = useRef<THREE.Group>(new THREE.Group());
  const heavyRackGroupRef = useRef<THREE.Group>(new THREE.Group());
  const selBoxHelperRef = useRef<THREE.Box3Helper | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Lights
  const ambLightRef = useRef<THREE.AmbientLight | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  // Camera Animation Tween
  const animFrameRef = useRef<number | null>(null);
  const cameraTargetPos = useRef<THREE.Vector3 | null>(null);
  const controlsTargetPos = useRef<THREE.Vector3 | null>(null);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const mouseDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycaster = useRef(new THREE.Raycaster());
  const mouseVec = useRef(new THREE.Vector2());

  interface DragSession {
    type: string;
    idx: number;
    initialItemX: number;
    initialItemZ: number;
    currentItemX: number;
    currentItemZ: number;
    itemW: number;
    itemD: number;
    targetGroup: THREE.Group | null;
    initialGroupPos: { x: number; z: number };
    attachedPunteras: { idx: number; group: THREE.Group; initialPos: { x: number; z: number } }[];
    initialSelBoxMin: THREE.Vector3 | null;
    initialSelBoxMax: THREE.Vector3 | null;
  }
  const dragSessionRef = useRef<DragSession | null>(null);

  const getObjectGroup = (type: string, idx: number): THREE.Group | null => {
    if (idx < 0) return null;
    let parentGroup: THREE.Group | null = null;
    if (type === 'minirack') parentGroup = minirackGroupRef.current;
    else if (type === 'estanteria') parentGroup = shelfGroupRef.current;
    else if (type === 'gondolaPared') parentGroup = gondolaParedGroupRef.current;
    else if (type === 'gondolaCentral') parentGroup = gondolaCentralGroupRef.current;
    else if (type === 'obstacle') parentGroup = obstacleGroupRef.current;
    else if (type === 'puntera') parentGroup = punteraGroupRef.current;
    else if (type === 'heladera') parentGroup = heladeraGroupRef.current;
    else if (type === 'checkout') parentGroup = checkoutGroupRef.current;
    else if (type === 'door') parentGroup = doorGroupRef.current;
    else if (type === 'heavyRack') parentGroup = heavyRackGroupRef.current;

    if (parentGroup && parentGroup.children[idx] instanceof THREE.Group) {
      return parentGroup.children[idx] as THREE.Group;
    }
    return null;
  };

  // Initialize Three.js
  useEffect(() => {
    if (!canvasRef.current || !dimCanvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 350);
    camera.position.set(12, 9, 14);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, canvasRef.current);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 120;
    controls.minDistance = 0.8;
    controls.target.set(4, 1.2, 4);
    controls.update();
    controlsRef.current = controls;

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(amb);
    ambLightRef.current = amb;

    const sun = new THREE.DirectionalLight(0xfff8ed, 1.5);
    sun.position.set(15, 24, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    sunLightRef.current = sun;

    const hemi = new THREE.HemisphereLight(0x94a3b8, 0x1e293b, 0.45);
    scene.add(hemi);
    hemiLightRef.current = hemi;

    // Materials
    const mats = initMaterials();
    materialsRef.current = mats;

    // Floor Mesh
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mats.floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Grid helper
    const grid = new THREE.GridHelper(100, 100, 0x38bdf8, 0x1e3a5f);
    if (grid.material instanceof THREE.Material) {
      grid.material.opacity = 0.25;
      grid.material.transparent = true;
    }
    grid.position.y = 0.002;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Add groups to scene
    scene.add(minirackGroupRef.current);
    scene.add(shelfGroupRef.current);
    scene.add(gondolaParedGroupRef.current);
    scene.add(gondolaCentralGroupRef.current);
    scene.add(obstacleGroupRef.current);
    scene.add(warehouseGroupRef.current);
    scene.add(aisleGroupRef.current);
    scene.add(punteraGroupRef.current);
    scene.add(heladeraGroupRef.current);
    scene.add(checkoutGroupRef.current);
    scene.add(doorGroupRef.current);
    scene.add(heavyRackGroupRef.current);

    // Dimension canvas setup
    dimCanvasRef.current.width = width;
    dimCanvasRef.current.height = height;

    // Animation Loop with smooth camera interpolation
    let running = true;
    const animate = () => {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(animate);

      // Smooth camera interpolation
      if (cameraTargetPos.current && controlsTargetPos.current) {
        camera.position.lerp(cameraTargetPos.current, 0.08);
        controls.target.lerp(controlsTargetPos.current, 0.08);

        if (
          camera.position.distanceTo(cameraTargetPos.current) < 0.05 &&
          controls.target.distanceTo(controlsTargetPos.current) < 0.05
        ) {
          cameraTargetPos.current = null;
          controlsTargetPos.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      drawDimensions();
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera || !dimCanvasRef.current) return;
      const w = containerRef.current.clientWidth || 800;
      const h = containerRef.current.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      dimCanvasRef.current.width = w;
      dimCanvasRef.current.height = h;
      drawDimensions();
    };

    window.addEventListener('resize', handleResize);

    const canvas = canvasRef.current;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL Context Lost - prevent canvas crash');
    };
    const handleContextRestored = () => {
      console.log('WebGL Context Restored');
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      renderer.dispose();
    };
  }, []);

  // Helper to build 3D mesh box
  const mkBox = (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    px: number,
    py: number,
    pz: number,
    meta: Record<string, any>
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(px + w / 2, py + h / 2, pz + d / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    Object.assign(mesh.userData, meta);
    return mesh;
  };

  const disposeHierarchy = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        if (child.geometry) {
          child.geometry.dispose();
        }
      }
    });
  };

  const clearGroup = (g: THREE.Group) => {
    while (g.children.length > 0) {
      const child = g.children.pop();
      if (child) {
        disposeHierarchy(child);
        g.remove(child);
      }
    }
  };

  // ── Build 3D Models on state updates ──
  useEffect(() => {
    if (!sceneRef.current || !materialsRef.current) return;
    const mats = materialsRef.current;

    // Apply View Mode
    const isWf = state.viewMode === 'wireframe';
    (Object.values(mats) as THREE.MeshStandardMaterial[]).forEach((m) => {
      if (m && 'wireframe' in m) {
        m.wireframe = isWf;
      }
    });

    if (state.viewMode === 'realistic') {
      sceneRef.current.background = new THREE.Color(0x0c1222);
      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.45 * state.lightIntensity;
      if (ambLightRef.current) ambLightRef.current.intensity = (state.showShadows ? 0.45 : 0.95) * state.lightIntensity;
      if (sunLightRef.current) {
        sunLightRef.current.intensity = (state.showShadows ? 2.0 : 1.1) * state.lightIntensity;
        sunLightRef.current.castShadow = state.showShadows;
      }
      if (hemiLightRef.current) hemiLightRef.current.intensity = (state.showShadows ? 0.35 : 0.65) * state.lightIntensity;
    } else {
      sceneRef.current.background = new THREE.Color(0x090d16);
      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.0 * state.lightIntensity;
      if (ambLightRef.current) ambLightRef.current.intensity = (state.showShadows ? 0.65 : 1.10) * state.lightIntensity;
      if (sunLightRef.current) {
        sunLightRef.current.intensity = (state.showShadows ? 1.4 : 0.8) * state.lightIntensity;
        sunLightRef.current.castShadow = state.showShadows;
      }
      if (hemiLightRef.current) hemiLightRef.current.intensity = (state.showShadows ? 0.45 : 0.75) * state.lightIntensity;
    }

    if (gridHelperRef.current) gridHelperRef.current.visible = state.showGrid;

    // 1. Miniracks 3D
    clearGroup(minirackGroupRef.current);
    const PW = 0.065;
    const BH = 0.055;
    const BD = 0.055;
    const ST = 0.018;
    const BRT = 0.025;

    state.lines.forEach((line: MinirackLine, li: number) => {
      const lineGroup = new THREE.Group();
      const D = state.depth;
      const H = state.height;
      const W = realMinirackLineWidth(line);
      const rot = ((line.rotation || 0) % 360 + 360) % 360;
      if (rot === 0) {
        lineGroup.position.set(line.xOff, 0, line.zOff);
        lineGroup.rotation.y = 0;
      } else if (rot === 90) {
        lineGroup.position.set(line.xOff, 0, line.zOff + W);
        lineGroup.rotation.y = Math.PI / 2;
      } else if (rot === 180) {
        lineGroup.position.set(line.xOff + W, 0, line.zOff + D);
        lineGroup.rotation.y = Math.PI;
      } else if (rot === 270) {
        lineGroup.position.set(line.xOff + D, 0, line.zOff);
        lineGroup.rotation.y = -Math.PI / 2;
      }
      minirackGroupRef.current.add(lineGroup);

      const addBastidor = (g: THREE.Group, x: number) => {
        const meta = { type: 'minirack', idx: li };
        g.add(mkBox(PW, H, PW, mats.post, x - PW / 2, 0, 0, meta));
        g.add(mkBox(PW, H, PW, mats.post, x - PW / 2, 0, D - PW, meta));
        g.add(mkBox(BRT, BRT, D, mats.brace, x - BRT / 2, H - BRT, 0, meta));
        const len = Math.sqrt(D * D + H * H);
        const angle = Math.atan2(H, D);
        for (const s of [-1, 1]) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(BRT, BRT, len), mats.brace);
          m.position.set(x, H / 2, D / 2);
          m.rotation.x = s * angle;
          m.castShadow = m.receiveShadow = true;
          Object.assign(m.userData, meta);
          g.add(m);
        }
      };

      let cumX = 0;
      addBastidor(lineGroup, 0);
      line.modules.forEach((mod) => {
        const sc = mod.sc ?? state.shelfCount;
        const gap = (H - 0.15) / sc;
        const meta = { type: 'minirack', idx: li };
        for (let i = 0; i < sc; i++) {
          const sh = 0.15 + i * gap;
          lineGroup.add(mkBox(mod.bl, BH, BD, mats.beam, cumX, sh, 0, meta));
          lineGroup.add(mkBox(mod.bl, BH, BD, mats.beam, cumX, sh, D - BD, meta));
          lineGroup.add(mkBox(mod.bl, ST, D, mats.shelf, cumX, sh + BH, 0, meta));
        }
        cumX += mod.bl;
        addBastidor(lineGroup, cumX);
      });
    });

    // 2. Estanterías 3D
    clearGroup(shelfGroupRef.current);
    state.shelfLines.forEach((sline: ShelfLine, si: number) => {
      const sGroup = new THREE.Group();
      const H = state.shelfHeight;
      const D = state.shelfDepth;
      const W = realShelfLineWidth(sline);
      const pThick = 0.035;
      const sThick = 0.025;
      const meta = { type: 'estanteria', idx: si };

      const rot = ((sline.rotation || 0) % 360 + 360) % 360;
      if (rot === 0) {
        sGroup.position.set(sline.xOff, 0, sline.zOff);
        sGroup.rotation.y = 0;
      } else if (rot === 90) {
        sGroup.position.set(sline.xOff, 0, sline.zOff + W);
        sGroup.rotation.y = Math.PI / 2;
      } else if (rot === 180) {
        sGroup.position.set(sline.xOff + W, 0, sline.zOff + D);
        sGroup.rotation.y = Math.PI;
      } else if (rot === 270) {
        sGroup.position.set(sline.xOff + D, 0, sline.zOff);
        sGroup.rotation.y = -Math.PI / 2;
      }
      shelfGroupRef.current.add(sGroup);

      let cumX = 0;
      sGroup.add(mkBox(pThick, H, pThick, mats.estPost, 0, 0, 0, meta));
      sGroup.add(mkBox(pThick, H, pThick, mats.estPost, 0, 0, D - pThick, meta));

      sline.modules.forEach((mod) => {
        const mW = mod.bl;
        const sc = mod.sc ?? state.shelfLevels;
        const shelfGap = (H - 0.15) / Math.max(1, sc - 1);

        for (let i = 0; i < sc; i++) {
          const y = 0.1 + i * shelfGap;
          sGroup.add(mkBox(mW, sThick, D, mats.estShelf, cumX, y, 0, meta));
          sGroup.add(mkBox(mW, 0.008, 0.003, mats.estShelf, cumX, y + sThick, 0, meta));
          sGroup.add(mkBox(mW, 0.008, 0.003, mats.estShelf, cumX, y + sThick, D - 0.003, meta));

          if (i === 0 || i === sc - 1) {
            sGroup.add(mkBox(0.06, 0.06, 0.002, mats.estCorner, cumX, y - 0.03, 0.001, meta));
            sGroup.add(mkBox(0.06, 0.06, 0.002, mats.estCorner, cumX + mW - 0.06, y - 0.03, 0.001, meta));
          }
        }
        cumX += mW;
        sGroup.add(mkBox(pThick, H, pThick, mats.estPost, cumX - pThick, 0, 0, meta));
        sGroup.add(mkBox(pThick, H, pThick, mats.estPost, cumX - pThick, 0, D - pThick, meta));
      });
    });

    // 3. Góndolas de Pared 3D
    clearGroup(gondolaParedGroupRef.current);
    state.gondolaPared.lines.forEach((gline: GondolaParedLine, gli: number) => {
      const gGroup = new THREE.Group();
      const H = 2.0; // Góndolas de pared solo pueden ser de 2 metros de alto
      const colW = 0.04;
      const colD = 0.06;
      const meta = { type: 'gondolaPared', idx: gli };
      const defaultD = gline.modules[0]?.depth || 0.47;
      const W = realGondolaParedLineWidth(gline);
      const D = gline.modules.reduce((maxD, m) => Math.max(maxD, m.depth || defaultD), defaultD);
      const rot = ((gline.rotation || 0) % 360 + 360) % 360;

      if (rot === 0) {
        gGroup.position.set(gline.xOff, 0, gline.zOff);
        gGroup.rotation.y = 0;
      } else if (rot === 90) {
        gGroup.position.set(gline.xOff, 0, gline.zOff + W);
        gGroup.rotation.y = Math.PI / 2;
      } else if (rot === 180) {
        gGroup.position.set(gline.xOff + W, 0, gline.zOff + D);
        gGroup.rotation.y = Math.PI;
      } else if (rot === 270) {
        gGroup.position.set(gline.xOff + D, 0, gline.zOff);
        gGroup.rotation.y = -Math.PI / 2;
      }
      gondolaParedGroupRef.current.add(gGroup);

      // Upright function with realistic legs and leveling screw feet (No closed zócalo)
      const buildGUpright = (g: THREE.Group, x: number, postH: number, footD: number) => {
        // Vertical post column
        g.add(mkBox(colW, postH - 0.03, colD, mats.gParedPost, x - colW / 2, 0.03, 0, meta));
        // Column base leveling screw pad
        g.add(mkBox(0.024, 0.03, 0.024, mats.gParedFoot, x - 0.012, 0, colD / 2 - 0.012, meta));
        // Base foot beam (pie de apoyo)
        g.add(mkBox(colW, 0.07, footD, mats.gParedFoot, x - colW / 2, 0.03, 0.01, meta));
        // Front leveling foot screw under the base foot
        g.add(mkBox(0.024, 0.03, 0.024, mats.gParedFoot, x - 0.012, 0, footD - 0.04, meta));
      };

      let cumX = 0;
      const firstPostH = 2.0;
      buildGUpright(gGroup, 0, firstPostH, defaultD);

      gline.modules.forEach((mod, modIdx) => {
        const mW = mod.bl;
        const mD = mod.depth || defaultD;
        const mH = 2.0;
        const sc = mod.sc || state.gondolaPared.shelfCount || 5;

        // Slotted back panel (paneles traseros)
        gGroup.add(mkBox(mW, mH - 0.10, 0.015, mats.gParedBack, cumX, 0.10, 0.005, meta));

        // Base shelf rests on foot beams at y = 0.10 (Open floor underneath, no closed zócalo)
        gGroup.add(mkBox(mW, 0.03, mD, mats.gParedShelf, cumX, 0.10, 0.01, meta));
        gGroup.add(mkBox(mW, 0.035, 0.008, mats.gParedPriceTag, cumX, 0.10, mD + 0.01, meta));

        // Aerial shelves: top shelf sits flush at top of column (al ras superior), intermediate shelves distributed evenly
        const numAereos = Math.max(0, sc - 1);
        if (numAereos > 0) {
          const topY = mH - 0.025;
          const baseY = 0.10;
          for (let s = 1; s <= numAereos; s++) {
            const y = numAereos === 1 ? topY : baseY + s * ((topY - baseY) / numAereos);
            gGroup.add(mkBox(mW, 0.025, mD, mats.gParedShelf, cumX, y, 0.015, meta));
            gGroup.add(mkBox(mW, 0.025, 0.008, mats.gParedPriceTag, cumX, y, mD + 0.015, meta));
            gGroup.add(mkBox(0.005, 0.07, mD * 0.9, mats.gParedBracket, cumX + 0.005, y - 0.05, 0.015, meta));
            gGroup.add(mkBox(0.005, 0.07, mD * 0.9, mats.gParedBracket, cumX + mW - 0.01, y - 0.05, 0.015, meta));
          }
        }

        cumX += mW;
        const nextPostH = 2.0;
        buildGUpright(gGroup, cumX, nextPostH, mD);
      });
    });

    // 4. Góndolas Centrales (Doble Faz) 3D
    clearGroup(gondolaCentralGroupRef.current);
    state.gondolaCentral.lines.forEach((gcline: GondolaCentralLine, gcli: number) => {
      const gGroup = new THREE.Group();
      const H = gcline.height || state.gondolaCentral.height || 1.6;
      const colW = 0.04;
      const colD = 0.06;
      const meta = { type: 'gondolaCentral', idx: gcli };
      const da = gcline.modules[0]?.depthA || 0.47;
      const db = gcline.modules[0]?.depthB || 0.47;
      const totalD = da + db;
      const W = realGondolaCentralLineWidth(gcline);
      const rot = ((gcline.rotation || 0) % 360 + 360) % 360;

      if (rot === 0) {
        gGroup.position.set(gcline.xOff, 0, gcline.zOff);
        gGroup.rotation.y = 0;
      } else if (rot === 90) {
        gGroup.position.set(gcline.xOff, 0, gcline.zOff + W);
        gGroup.rotation.y = Math.PI / 2;
      } else if (rot === 180) {
        gGroup.position.set(gcline.xOff + W, 0, gcline.zOff + totalD);
        gGroup.rotation.y = Math.PI;
      } else if (rot === 270) {
        gGroup.position.set(gcline.xOff + totalD, 0, gcline.zOff);
        gGroup.rotation.y = -Math.PI / 2;
      }
      gondolaCentralGroupRef.current.add(gGroup);

      const buildGCUpright = (g: THREE.Group, x: number, postH: number, centerZ: number, dSideA: number, dSideB: number) => {
        // Vertical central column
        g.add(mkBox(colW, postH - 0.03, colD, mats.gCentPost, x - colW / 2, 0.03, centerZ - colD / 2, meta));
        // Center column leveling foot
        g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, x - 0.012, 0, centerZ - 0.012, meta));
        // Double base foot beam (pie doble faz)
        g.add(mkBox(colW, 0.07, dSideA + dSideB, mats.gCentFoot, x - colW / 2, 0.03, centerZ - dSideB, meta));
        // Front leveling foot screw (Side A)
        g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, x - 0.012, 0, centerZ + dSideA - 0.04, meta));
        // Rear leveling foot screw (Side B)
        g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, x - 0.012, 0, centerZ - dSideB + 0.016, meta));
      };

      let cumX = 0;
      const firstPostH = gcline.modules[0]?.height || H;
      buildGCUpright(gGroup, 0, firstPostH, db, da, db);

      gcline.modules.forEach((mod, modIdx) => {
        const mW = mod.bl;
        const mH = mod.height || H;
        const sideA = mod.depthA || 0.47;
        const sideB = mod.depthB || 0.47;
        const scA = mod.scA || state.gondolaCentral.shelfCount || 3;
        const scB = mod.scB || state.gondolaCentral.shelfCount || 3;
        const centerZ = sideB;

        // Central divider panel (panel central ranurado)
        gGroup.add(mkBox(mW, mH - 0.10, 0.018, mats.gCentBack, cumX, 0.10, centerZ - 0.009, meta));

        // Side A (+Z)
        // Base shelf rests on feet at y = 0.10 (Open floor underneath, no closed zócalo)
        gGroup.add(mkBox(mW, 0.03, sideA, mats.gCentShelf, cumX, 0.10, centerZ, meta));
        gGroup.add(mkBox(mW, 0.035, 0.008, mats.gCentPriceTagA, cumX, 0.10, centerZ + sideA, meta));
        const numAereosA = Math.max(0, scA - 1);
        if (numAereosA > 0) {
          const topYA = mH - 0.025;
          const baseYA = 0.10;
          for (let sa = 1; sa <= numAereosA; sa++) {
            const ya = numAereosA === 1 ? topYA : baseYA + sa * ((topYA - baseYA) / numAereosA);
            gGroup.add(mkBox(mW, 0.025, sideA, mats.gCentShelf, cumX, ya, centerZ, meta));
            gGroup.add(mkBox(mW, 0.025, 0.008, mats.gCentPriceTagA, cumX, ya, centerZ + sideA, meta));
            gGroup.add(mkBox(0.005, 0.07, sideA * 0.9, mats.gCentBracket, cumX + 0.005, ya - 0.05, centerZ + 0.01, meta));
            gGroup.add(mkBox(0.005, 0.07, sideA * 0.9, mats.gCentBracket, cumX + mW - 0.009, ya - 0.05, centerZ + 0.01, meta));
          }
        }

        // Side B (-Z)
        // Base shelf rests on feet at y = 0.10 (Open floor underneath, no closed zócalo)
        gGroup.add(mkBox(mW, 0.03, sideB, mats.gCentShelf, cumX, 0.10, centerZ - sideB, meta));
        gGroup.add(mkBox(mW, 0.035, 0.008, mats.gCentPriceTagB, cumX, 0.10, centerZ - sideB - 0.008, meta));
        const numAereosB = Math.max(0, scB - 1);
        if (numAereosB > 0) {
          const topYB = mH - 0.025;
          const baseYB = 0.10;
          for (let sb = 1; sb <= numAereosB; sb++) {
            const yb = numAereosB === 1 ? topYB : baseYB + sb * ((topYB - baseYB) / numAereosB);
            gGroup.add(mkBox(mW, 0.025, sideB, mats.gCentShelf, cumX, yb, centerZ - sideB, meta));
            gGroup.add(mkBox(mW, 0.025, 0.008, mats.gCentPriceTagB, cumX, yb, centerZ - sideB - 0.008, meta));
            gGroup.add(mkBox(0.005, 0.07, sideB * 0.9, mats.gCentBracket, cumX + 0.005, yb - 0.05, centerZ - sideB, meta));
            gGroup.add(mkBox(0.005, 0.07, sideB * 0.9, mats.gCentBracket, cumX + mW - 0.009, yb - 0.05, centerZ - sideB, meta));
          }
        }

        cumX += mW;
        const nextMod = gcline.modules[modIdx + 1];
        const nextPostH = nextMod ? Math.max(mH, nextMod.height || H) : mH;
        buildGCUpright(gGroup, cumX, nextPostH, centerZ, sideA, sideB);
      });
    });

    // 5. Obstáculos 3D
    clearGroup(obstacleGroupRef.current);
    const colH = state.warehouse.enabled ? state.warehouse.height : 4.0;
    state.obstacles.forEach((obs: Obstacle, oi: number) => {
      const obsGroup = new THREE.Group();
      obstacleGroupRef.current.add(obsGroup);
      const meta = { type: 'obstacle', idx: oi };
      if (obs.type === 'column') {
        const dVal = obs.d || obs.w;
        obsGroup.add(mkBox(obs.w, colH, dVal, mats.column, obs.x, 0, obs.z, meta));
        obsGroup.add(mkBox(obs.w + 0.12, 0.1, dVal + 0.12, mats.colBase, obs.x - 0.06, 0, obs.z - 0.06, meta));
      } else {
        const fw = obs.w;
        const fh = obs.fh || 2.5;
        const ft = 0.12;
        const rot = obs.rotation || 0;
        if (rot === 0) {
          obsGroup.add(mkBox(ft, fh, ft, mats.opening, obs.x, 0, obs.z, meta));
          obsGroup.add(mkBox(ft, fh, ft, mats.opening, obs.x + fw - ft, 0, obs.z, meta));
          obsGroup.add(mkBox(fw, ft, ft, mats.opening, obs.x, fh - ft, obs.z, meta));
          obsGroup.add(mkBox(fw, 0.015, 0.18, mats.openFloor, obs.x, 0, obs.z - 0.09, meta));
        } else {
          obsGroup.add(mkBox(ft, fh, ft, mats.opening, obs.x, 0, obs.z, meta));
          obsGroup.add(mkBox(ft, fh, ft, mats.opening, obs.x, 0, obs.z + fw - ft, meta));
          obsGroup.add(mkBox(ft, ft, fw, mats.opening, obs.x, fh - ft, obs.z, meta));
          obsGroup.add(mkBox(0.18, 0.015, fw, mats.openFloor, obs.x - 0.09, 0, obs.z, meta));
        }
      }
    });

    // 6. Depósito / Salón 3D
    clearGroup(warehouseGroupRef.current);
    if (state.warehouse.enabled) {
      const W = state.warehouse.width;
      const D = state.warehouse.depth;
      const H = state.warehouse.height;

      mats.depWallMat.color.set(state.warehouse.wallColor || '#1e40af');
      mats.depWallMat.opacity = state.warehouse.wallOpacity ?? 0.3;
      mats.depWallMat.needsUpdate = true;

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
      );
      edges.position.set(W / 2, H / 2, D / 2);
      warehouseGroupRef.current.add(edges);

      const walls = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), mats.depWallMat);
      walls.position.set(W / 2, H / 2, D / 2);
      warehouseGroupRef.current.add(walls);

      const floorPerimeter = new THREE.Mesh(
        new THREE.PlaneGeometry(W, D),
        new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: 0.1,
        })
      );
      floorPerimeter.rotation.x = -Math.PI / 2;
      floorPerimeter.position.set(W / 2, 0.003, D / 2);
      warehouseGroupRef.current.add(floorPerimeter);
    }

    // 7. Punteras de Góndola 3D (Salón)
    clearGroup(punteraGroupRef.current);
    (state.punteras || []).forEach((p, idx) => {
      const g = new THREE.Group();
      const rot = ((p.rotation || 0) % 360 + 360) % 360;
      const W = p.width || 0.9;
      const D = p.depth || 0.45;
      const H = p.height || 1.6;
      const sc = p.shelfCount || 4;

      if (rot === 0) {
        g.position.set(p.x, 0, p.z);
        g.rotation.y = 0;
      } else if (rot === 90) {
        g.position.set(p.x, 0, p.z + W);
        g.rotation.y = Math.PI / 2;
      } else if (rot === 180) {
        g.position.set(p.x + W, 0, p.z + D);
        g.rotation.y = Math.PI;
      } else if (rot === 270) {
        g.position.set(p.x + D, 0, p.z);
        g.rotation.y = -Math.PI / 2;
      }
      punteraGroupRef.current.add(g);

      const meta = { type: 'puntera', idx };

      // Uprights with realistic legs and leveling screw feet (Open underneath, no closed zócalo)
      const colW = 0.04;
      const colD = 0.06;
      // Center upright column
      g.add(mkBox(colW, H - 0.03, colD, mats.gCentPost, W / 2 - colW / 2, 0.03, 0.01, meta));
      g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, W / 2 - 0.012, 0, 0.02, meta));
      // Base foot beam extending forward along Z
      g.add(mkBox(colW, 0.07, D, mats.gCentFoot, W / 2 - colW / 2, 0.03, 0.01, meta));
      g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, W / 2 - 0.012, 0, D - 0.04, meta));

      // Side foot beams & posts
      g.add(mkBox(0.03, H - 0.03, 0.04, mats.gCentPost, 0.02, 0.03, 0.01, meta));
      g.add(mkBox(0.03, H - 0.03, 0.04, mats.gCentPost, W - 0.05, 0.03, 0.01, meta));
      g.add(mkBox(0.03, 0.07, D, mats.gCentFoot, 0.02, 0.03, 0.01, meta));
      g.add(mkBox(0.03, 0.07, D, mats.gCentFoot, W - 0.05, 0.03, 0.01, meta));

      // Slotted back panel
      g.add(mkBox(W, H - 0.10, 0.018, mats.gCentBack, 0, 0.10, 0.015, meta));

      // Base shelf at y = 0.10 (Open floor underneath, NO closed zócalo)
      g.add(mkBox(W, 0.03, D, mats.gCentShelf, 0, 0.10, 0.01, meta));
      g.add(mkBox(W, 0.035, 0.008, mats.gCentPriceTagA, 0, 0.10, D + 0.01, meta));

      // Aerial shelves: top shelf sits flush at H - 0.025 (al ras superior), intermediate shelves distributed evenly
      const numAereos = Math.max(0, sc - 1);
      if (numAereos > 0) {
        const topY = H - 0.025;
        const baseY = 0.10;
        for (let s = 1; s <= numAereos; s++) {
          const sy = numAereos === 1 ? topY : baseY + s * ((topY - baseY) / numAereos);
          const sDepth = Math.max(0.28, D - 0.03);
          g.add(mkBox(W, 0.025, sDepth, mats.gCentShelf, 0, sy, 0.015, meta));
          g.add(mkBox(W, 0.025, 0.008, mats.gCentPriceTagA, 0, sy, sDepth + 0.015, meta));
          g.add(mkBox(0.005, 0.07, sDepth * 0.9, mats.gCentBracket, 0.02, sy - 0.05, 0.015, meta));
          g.add(mkBox(0.005, 0.07, sDepth * 0.9, mats.gCentBracket, W - 0.025, sy - 0.05, 0.015, meta));
        }
      }
    });

    // 8. Heladeras Comerciales 3D (Salón)
    clearGroup(heladeraGroupRef.current);
    (state.heladeras || []).forEach((h, idx) => {
      const g = new THREE.Group();
      const rot = ((h.rotation || 0) % 360 + 360) % 360;
      const W = h.width || 1.8;
      const D = h.depth || 0.85;
      const H = h.height || 2.0;

      if (rot === 0) {
        g.position.set(h.x, 0, h.z);
        g.rotation.y = 0;
      } else if (rot === 90) {
        g.position.set(h.x, 0, h.z + W);
        g.rotation.y = Math.PI / 2;
      } else if (rot === 180) {
        g.position.set(h.x + W, 0, h.z + D);
        g.rotation.y = Math.PI;
      } else if (rot === 270) {
        g.position.set(h.x + D, 0, h.z);
        g.rotation.y = -Math.PI / 2;
      }
      heladeraGroupRef.current.add(g);

      const meta = { type: 'heladera', idx };
      const bodyMat = h.color === 'negro' ? mats.refrigBodyBlack : h.color === 'inox' ? mats.refrigBodyInox : mats.refrigBodyWhite;

      if (h.type === 'mostrador') {
        // Heladera Mostrador / Vitrina Refrigerada para Fiambrería, Carnicería y Lácteos
        // Base cerrada y unidad condensadora
        g.add(mkBox(W, 0.45, D, bodyMat, 0, 0, 0, meta));
        // Rejilla de ventilación frontal/inferior
        g.add(mkBox(W - 0.12, 0.12, 0.02, mats.colBase, 0.06, 0.04, D - 0.015, meta));
        // Bandeja/plano interior de exhibición en acero inoxidable
        g.add(mkBox(W - 0.06, 0.03, D - 0.08, mats.refrigBodyInox, 0.03, 0.45, 0.04, meta));
        // Estante intermedio de vidrio para exhibición
        g.add(mkBox(W - 0.08, 0.012, D * 0.52, mats.glass, 0.04, 0.80, 0.08, meta));
        // Tira de iluminación LED bajo estante
        g.add(mkBox(W - 0.12, 0.015, 0.02, mats.refrigLed, 0.06, 0.78, 0.12, meta));
        // Vidrio panorámico frontal
        g.add(mkBox(W - 0.06, H - 0.48, 0.012, mats.glass, 0.03, 0.46, D - 0.03, meta));
        // Laterales de vidrio
        g.add(mkBox(0.012, H - 0.48, D - 0.08, mats.glass, 0.02, 0.46, 0.04, meta));
        g.add(mkBox(0.012, H - 0.48, D - 0.08, mats.glass, W - 0.032, 0.46, 0.04, meta));
        // Plano superior de trabajo / mostrador de despacho
        g.add(mkBox(W, 0.035, 0.30, mats.checkoutTop, 0, H - 0.035, 0.02, meta));
        // Puertas corredizas traseras de atención
        g.add(mkBox(W - 0.08, H - 0.52, 0.01, mats.glass, 0.04, 0.48, 0.035, meta));
      } else {
        // Murales verticales
        g.add(mkBox(W, 0.28, D, mats.refrigBodyBlack, 0, 0, 0, meta));
        g.add(mkBox(0.06, H - 0.28, D, bodyMat, 0, 0.28, 0, meta));
        g.add(mkBox(0.06, H - 0.28, D, bodyMat, W - 0.06, 0.28, 0, meta));
        g.add(mkBox(W, 0.20, D, bodyMat, 0, H - 0.20, 0, meta));
        g.add(mkBox(W - 0.12, 0.15, 0.02, mats.refrigLed, 0.06, H - 0.18, D - 0.02, meta));
        g.add(mkBox(W - 0.12, H - 0.48, 0.04, bodyMat, 0.06, 0.28, 0, meta));

        const levels = 4;
        const gap = (H - 0.54) / levels;
        for (let s = 1; s <= levels; s++) {
          const sy = 0.28 + s * gap;
          g.add(mkBox(W - 0.14, 0.015, D - 0.14, mats.shelf, 0.07, sy, 0.05, meta));
        }

        const doors = h.doorsCount || (W >= 2.0 ? 3 : 2);
        const doorW = (W - 0.12) / doors;
        for (let d = 0; d < doors; d++) {
          const dx = 0.06 + d * doorW;
          g.add(mkBox(doorW - 0.015, H - 0.48, 0.012, mats.glass, dx + 0.007, 0.28, D - 0.018, meta));
          g.add(mkBox(doorW, 0.025, 0.02, mats.doorFrame, dx, 0.28, D - 0.02, meta));
          g.add(mkBox(doorW, 0.025, 0.02, mats.doorFrame, dx, H - 0.22, D - 0.02, meta));
          g.add(mkBox(0.02, 0.35, 0.025, mats.checkoutTop, dx + doorW - 0.035, H / 2 - 0.15, D, meta));
        }
      }
    });

    // 9. Check Outs / Cajas de Cobro 3D (Salón)
    clearGroup(checkoutGroupRef.current);
    (state.checkouts || []).forEach((c, idx) => {
      const g = new THREE.Group();
      const rot = ((c.rotation || 0) % 360 + 360) % 360;
      const L = c.length || 1.8;
      const W = c.width || 1.1;
      const H = c.height || 0.88;

      if (rot === 0) {
        g.position.set(c.x, 0, c.z);
        g.rotation.y = 0;
      } else if (rot === 90) {
        g.position.set(c.x, 0, c.z + L);
        g.rotation.y = Math.PI / 2;
      } else if (rot === 180) {
        g.position.set(c.x + L, 0, c.z + W);
        g.rotation.y = Math.PI;
      } else if (rot === 270) {
        g.position.set(c.x + W, 0, c.z);
        g.rotation.y = -Math.PI / 2;
      }
      checkoutGroupRef.current.add(g);

      const meta = { type: 'checkout', idx };

      // Lado Izquierdo vs Derecho del cajero
      const isLeft = (c.scannerSide || 'derecha') === 'izquierda';
      const beltW = 0.58;
      const cashierW = Math.max(0.45, W - beltW); // Ancho puesto cajero (~0.52m)
      const beltZ = isLeft ? cashierW : 0;
      const cashierZ = isLeft ? 0 : beltW;

      // 1. Mueble base del carril de la cinta transportadora
      g.add(mkBox(L, H - 0.05, beltW, mats.checkoutBody, 0, 0, beltZ, meta));
      g.add(mkBox(L, 0.05, beltW, mats.checkoutTop, 0, H - 0.05, beltZ, meta));

      // 2. Cinta transportadora de goma negra
      const beltLen = L * 0.52;
      g.add(mkBox(beltLen, 0.015, beltW - 0.08, mats.checkoutBelt, 0.06, H, beltZ + 0.04, meta));

      // Baranda guía lateral en acero inox (lado pasillo del cliente)
      const guideRailZ = isLeft ? W - 0.025 : 0.005;
      g.add(mkBox(L, 0.08, 0.02, mats.refrigBodyInox, 0, H, guideRailZ, meta));

      // 3. Plato de balanza y escáner bióptico
      const scanX = 0.06 + beltLen + 0.02;
      const scanLen = Math.min(0.35, L * 0.20);
      g.add(mkBox(scanLen, 0.018, beltW - 0.10, mats.glass, scanX, H, beltZ + 0.05, meta));
      g.add(mkBox(scanLen + 0.02, 0.012, 0.02, mats.refrigBodyInox, scanX - 0.01, H + 0.01, beltZ + 0.03, meta));

      // 4. Batea / rampa de embolsado de mercadería (acero inoxidable)
      const bagX = scanX + scanLen + 0.04;
      const bagLen = Math.max(0.35, L - bagX - 0.02);
      g.add(mkBox(bagLen, 0.025, beltW - 0.06, mats.refrigBodyInox, bagX, H - 0.02, beltZ + 0.03, meta));
      // Separador central de mercadería
      g.add(mkBox(bagLen * 0.85, 0.06, 0.015, mats.checkoutTop, bagX + 0.03, H, beltZ + beltW / 2 - 0.007, meta));

      // 5. Módulo del cajero (Mesa y pedestal con cajón portabilletes)
      const deskLen = L * 0.50;
      const deskX = L * 0.20;
      // Cuerpo del mueble cajero (altura real de trabajo ~0.84m)
      g.add(mkBox(deskLen, H - 0.04, cashierW, mats.checkoutBody, deskX, 0, cashierZ, meta));
      g.add(mkBox(deskLen, 0.04, cashierW, mats.checkoutTop, deskX, H - 0.04, cashierZ, meta));
      // Cajón portabilletes / dinero metálico
      g.add(mkBox(0.42, 0.10, cashierW - 0.08, mats.colBase, deskX + deskLen * 0.30, H - 0.14, cashierZ + 0.04, meta));

      // 6. Poste metálico y pantalla táctil POS / monitor
      const postX = deskX + deskLen * 0.70;
      const postZ = cashierZ + (isLeft ? cashierW - 0.12 : 0.12);
      g.add(mkBox(0.04, 0.45, 0.04, mats.refrigBodyInox, postX, H, postZ, meta));
      g.add(mkBox(0.24, 0.18, 0.025, mats.checkoutScreen, postX - 0.10, H + 0.28, postZ - 0.02, meta));
    });

    // 10. Puertas y Portones 3D (Salón y Depósito)
    clearGroup(doorGroupRef.current);
    (state.doors || []).forEach((door, idx) => {
      const g = new THREE.Group();
      const rot = ((door.rotation || 0) % 360 + 360) % 360;
      const W = door.width || (door.section === 'deposito' ? 3.0 : 2.0);
      const H = door.height || (door.section === 'deposito' ? 3.5 : 2.4);
      const dThick = 0.25;

      if (rot === 0) {
        g.position.set(door.x, 0, door.z);
        g.rotation.y = 0;
      } else if (rot === 90) {
        g.position.set(door.x, 0, door.z + W);
        g.rotation.y = Math.PI / 2;
      } else if (rot === 180) {
        g.position.set(door.x + W, 0, door.z + dThick);
        g.rotation.y = Math.PI;
      } else if (rot === 270) {
        g.position.set(door.x + dThick, 0, door.z);
        g.rotation.y = -Math.PI / 2;
      }
      doorGroupRef.current.add(g);

      const meta = { type: 'door', idx };

      if (door.section === 'deposito' || door.type === 'porton_industrial') {
        g.add(mkBox(0.12, H, 0.12, mats.doorFrame, 0, 0, 0, meta));
        g.add(mkBox(0.12, H, 0.12, mats.doorFrame, W - 0.12, 0, 0, meta));
        g.add(mkBox(W, 0.35, 0.22, mats.doorFrame, 0, H - 0.35, -0.05, meta));
        g.add(mkBox(W - 0.24, 0.10, 0.02, mats.colBase, 0.12, H - 0.45, 0.06, meta));
        const panelH = (H - 0.35) / 5;
        for (let p = 0; p < 5; p++) {
          const py = p * panelH;
          g.add(mkBox(W - 0.24, panelH - 0.015, 0.04, mats.doorIndustrial, 0.12, py, 0.02, meta));
        }
      } else {
        g.add(mkBox(0.08, H, 0.08, mats.doorFrame, 0, 0, 0, meta));
        g.add(mkBox(0.08, H, 0.08, mats.doorFrame, W - 0.08, 0, 0, meta));
        g.add(mkBox(W, 0.10, 0.08, mats.doorFrame, 0, H - 0.10, 0, meta));
        const leafW = (W - 0.16) / 2;
        g.add(mkBox(leafW - 0.01, H - 0.12, 0.015, mats.glass, 0.08, 0.01, 0.03, meta));
        g.add(mkBox(0.025, 0.65, 0.03, mats.checkoutTop, 0.08 + leafW - 0.04, 0.85, 0.04, meta));
        g.add(mkBox(leafW - 0.01, H - 0.12, 0.015, mats.glass, 0.08 + leafW + 0.01, 0.01, 0.03, meta));
        g.add(mkBox(0.025, 0.65, 0.03, mats.checkoutTop, 0.08 + leafW + 0.02, 0.85, 0.04, meta));
      }
    });

    // 11. Racks Pesados 3D (Depósito)
    clearGroup(heavyRackGroupRef.current);
    const HPW = 0.09;
    const HBH = 0.11;
    const HBD = 0.055;
    const HH_DEF = state.heavyRacks?.height || 4.5;
    const HD_DEF = state.heavyRacks?.depth || 1.10;

    (state.heavyRacks?.lines || []).forEach((line, li) => {
      const lineGroup = new THREE.Group();
      const H = line.height || HH_DEF;
      const D = line.depth || HD_DEF;
      const W = realHeavyRackLineWidth(line);
      const rot = ((line.rotation || 0) % 360 + 360) % 360;

      if (rot === 0) {
        lineGroup.position.set(line.xOff, 0, line.zOff);
        lineGroup.rotation.y = 0;
      } else if (rot === 90) {
        lineGroup.position.set(line.xOff, 0, line.zOff + W);
        lineGroup.rotation.y = Math.PI / 2;
      } else if (rot === 180) {
        lineGroup.position.set(line.xOff + W, 0, line.zOff + D);
        lineGroup.rotation.y = Math.PI;
      } else if (rot === 270) {
        lineGroup.position.set(line.xOff + D, 0, line.zOff);
        lineGroup.rotation.y = -Math.PI / 2;
      }
      heavyRackGroupRef.current.add(lineGroup);

      const addHeavyBastidor = (g: THREE.Group, x: number) => {
        const meta = { type: 'heavyRack', idx: li };
        g.add(mkBox(HPW, H, HPW, mats.heavyPost, x - HPW / 2, 0, 0, meta));
        g.add(mkBox(HPW, H, HPW, mats.heavyPost, x - HPW / 2, 0, D - HPW, meta));
        g.add(mkBox(HPW * 1.5, 0.015, HPW * 1.5, mats.post, x - HPW * 0.75, 0, -HPW * 0.25, meta));
        g.add(mkBox(HPW * 1.5, 0.015, HPW * 1.5, mats.post, x - HPW * 0.75, 0, D - HPW * 1.25, meta));

        const numBraces = Math.max(3, Math.floor(H / 0.8));
        const bH = H / numBraces;
        for (let b = 0; b < numBraces; b++) {
          const by = b * bH;
          const len = Math.sqrt(D * D + bH * bH);
          const angle = Math.atan2(bH, D);
          const s = b % 2 === 0 ? 1 : -1;
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, len), mats.brace);
          mesh.position.set(x, by + bH / 2, D / 2);
          mesh.rotation.x = s * angle;
          mesh.castShadow = mesh.receiveShadow = true;
          Object.assign(mesh.userData, meta);
          g.add(mesh);
        }
      };

      let cumX = 0;
      addHeavyBastidor(lineGroup, 0);
      line.modules.forEach((mod) => {
        const levels = mod.levels || 3;
        const gap = (H - 0.3) / levels;
        const meta = { type: 'heavyRack', idx: li };

        for (let lvl = 0; lvl < levels; lvl++) {
          const beamY = 0.25 + lvl * gap;
          lineGroup.add(mkBox(mod.bl, HBH, HBD, mats.heavyBeam, cumX, beamY, 0, meta));
          lineGroup.add(mkBox(mod.bl, HBH, HBD, mats.heavyBeam, cumX, beamY, D - HBD, meta));

          const palletsInBay = mod.bl >= 3.0 ? 3 : 2;
          const palSpacing = mod.bl / palletsInBay;
          const palW = 1.0;
          const palD = 1.2;
          for (let p = 0; p < palletsInBay; p++) {
            const px = cumX + p * palSpacing + (palSpacing - palW) / 2;
            const py = beamY + HBH;
            const pz = (D - palD) / 2;
            lineGroup.add(mkBox(palW, 0.14, palD, mats.palletWood, px, py, pz, meta));
            const boxH = Math.min(gap - HBH - 0.20, 0.90);
            lineGroup.add(mkBox(palW * 0.92, boxH, palD * 0.92, mats.palletBox, px + palW * 0.04, py + 0.14, pz + palD * 0.04, meta));
          }
        }

        cumX += mod.bl;
        addHeavyBastidor(lineGroup, cumX);
      });
    });

    // 12. Workspace Section Focus (Salón vs Depósito)
    const isSalon = state.activeSection === 'salon';
    gondolaParedGroupRef.current.visible = isSalon;
    gondolaCentralGroupRef.current.visible = isSalon;
    punteraGroupRef.current.visible = isSalon;
    heladeraGroupRef.current.visible = isSalon;
    checkoutGroupRef.current.visible = isSalon;

    minirackGroupRef.current.visible = !isSalon;
    heavyRackGroupRef.current.visible = !isSalon;
    shelfGroupRef.current.visible = !isSalon;

    warehouseGroupRef.current.visible = state.warehouse.enabled;
    obstacleGroupRef.current.visible = true;
    doorGroupRef.current.visible = true;

    // 13. Update Selection Box
    updateSelectionHelper();
  }, [state]);

  // Update Golden Selection Bounding Box Helper
  const updateSelectionHelper = () => {
    if (!sceneRef.current) return;
    if (selBoxHelperRef.current) {
      sceneRef.current.remove(selBoxHelperRef.current);
      if (selBoxHelperRef.current.geometry) selBoxHelperRef.current.geometry.dispose();
      selBoxHelperRef.current = null;
    }

    if (!selection.type || selection.idx === null) return;

    let mn: THREE.Vector3 | null = null;
    let mx: THREE.Vector3 | null = null;

    if (selection.type === 'minirack' && state.lines[selection.idx]) {
      const b = getMinirackLineBounds(state.lines[selection.idx], state.depth);
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, state.height, b.z1);
    } else if (selection.type === 'estanteria' && state.shelfLines[selection.idx]) {
      const b = getShelfLineBounds(state.shelfLines[selection.idx], state.shelfDepth);
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, state.shelfHeight, b.z1);
    } else if (selection.type === 'gondolaPared' && state.gondolaPared.lines[selection.idx]) {
      const b = getGondolaParedLineBounds(state.gondolaPared.lines[selection.idx], state.gondolaPared.depth);
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, 2.0, b.z1);
    } else if (selection.type === 'gondolaCentral' && state.gondolaCentral.lines[selection.idx]) {
      const b = getGondolaCentralLineBounds(state.gondolaCentral.lines[selection.idx], state.gondolaCentral.depth);
      const h = state.gondolaCentral.lines[selection.idx].height || state.gondolaCentral.height || 1.6;
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, h, b.z1);
    } else if (selection.type === 'obstacle' && state.obstacles[selection.idx]) {
      const b = getObstacleBounds(state.obstacles[selection.idx], state.warehouse.height);
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, b.h || 3.0, b.z1);
    } else if (selection.type === 'puntera' && state.punteras?.[selection.idx]) {
      const b = getPunteraBounds(state.punteras[selection.idx]);
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, b.h || 1.6, b.z1);
    } else if (selection.type === 'heladera' && state.heladeras?.[selection.idx]) {
      const b = getHeladeraBounds(state.heladeras[selection.idx]);
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, b.h || 2.0, b.z1);
    } else if (selection.type === 'checkout' && state.checkouts?.[selection.idx]) {
      const b = getCheckoutBounds(state.checkouts[selection.idx]);
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, b.h || 0.88, b.z1);
    } else if (selection.type === 'door' && state.doors?.[selection.idx]) {
      const b = getDoorBounds(state.doors[selection.idx]);
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, b.h || 2.4, b.z1);
    } else if (selection.type === 'heavyRack' && state.heavyRacks?.lines?.[selection.idx]) {
      const b = getHeavyRackLineBounds(state.heavyRacks.lines[selection.idx], state.heavyRacks.depth);
      mn = new THREE.Vector3(b.x0, 0, b.z0);
      mx = new THREE.Vector3(b.x1, state.heavyRacks.height || 4.5, b.z1);
    }

    if (mn && mx) {
      const boxHelper = new THREE.Box3Helper(new THREE.Box3(mn, mx), new THREE.Color(0xfbbf24));
      sceneRef.current.add(boxHelper);
      selBoxHelperRef.current = boxHelper;
    }
  };

  useEffect(() => {
    updateSelectionHelper();
  }, [selection]);

  // ── 2D Dimensions Rendering on Canvas ──
  const drawDimensions = () => {
    if (!dimCanvasRef.current || !cameraRef.current) return;
    const canvas = dimCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dynamically synchronize canvas internal buffer with display size
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const curState = stateRef.current;
    if (!curState || !curState.showDims) return;

    const camera = cameraRef.current;
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const project = (x: number, y: number, z: number) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * canvas.width,
        y: (-v.y * 0.5 + 0.5) * canvas.height,
        visible: v.z < 1,
      };
    };

    const drawPill = (
      p1: { x: number; y: number; visible: boolean },
      p2: { x: number; y: number; visible: boolean },
      text: string,
      color = '#f8fafc',
      bgColor = 'rgba(15, 23, 42, 0.94)'
    ) => {
      if (!p1.visible && !p2.visible) return;

      // Draw dimension guide line connecting the endpoints
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Draw 45° architectural tick marks at the ends
      const tick = 5;
      ctx.beginPath();
      ctx.moveTo(p1.x - tick, p1.y - tick);
      ctx.lineTo(p1.x + tick, p1.y + tick);
      ctx.moveTo(p2.x - tick, p2.y - tick);
      ctx.lineTo(p2.x + tick, p2.y + tick);
      ctx.stroke();

      // Measurement badge pill in the center
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2 - 14;

      const tw = ctx.measureText(text).width + 16;
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(mx - tw / 2, my - 11, tw, 22, 6);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(text, mx, my);
      ctx.restore();
    };

    if (curState.activeSection === 'salon') {
      // Góndolas Pared cotas
      curState.gondolaPared.lines.forEach((gline) => {
        const b = getGondolaParedLineBounds(gline, curState.gondolaPared.depth);
        const pA = project(b.x0, 0.05, b.z0);
        const pB = project(b.x1, 0.05, b.z0);
        drawPill(pA, pB, `${realGondolaParedLineWidth(gline).toFixed(2)} m (G. Pared)`, '#f43f5e');
      });

      // Góndolas Centrales cotas
      curState.gondolaCentral.lines.forEach((gcline) => {
        const b = getGondolaCentralLineBounds(gcline, curState.gondolaCentral.depth);
        const pA = project(b.x0, 0.05, b.z0);
        const pB = project(b.x1, 0.05, b.z0);
        drawPill(pA, pB, `${realGondolaCentralLineWidth(gcline).toFixed(2)} m (G. Central)`, '#ec4899');
      });

      // Punteras cotas
      (curState.punteras || []).forEach((p) => {
        const b = getPunteraBounds(p);
        const pA = project(b.x0, 0.05, b.z0);
        const pB = project(b.x1, 0.05, b.z0);
        drawPill(pA, pB, `${(p.width || 0.9).toFixed(2)} m (Puntera)`, '#f59e0b');
      });

      // Heladeras cotas
      (curState.heladeras || []).forEach((h) => {
        const b = getHeladeraBounds(h);
        const pA = project(b.x0, 0.05, b.z0);
        const pB = project(b.x1, 0.05, b.z0);
        const label = h.type === 'mostrador' ? 'Mostrador Vitrina' : h.type === 'isla_congelados' ? 'Isla' : 'Mural';
        drawPill(pA, pB, `${(h.width || 2.0).toFixed(2)} m (${label})`, '#06b6d4');
      });

      // Check Outs cotas (1.60, 1.80, 2.00 m)
      (curState.checkouts || []).forEach((c) => {
        const b = getCheckoutBounds(c);
        const pA = project(b.x0, 0.05, b.z0);
        const pB = project(b.x1, 0.05, b.z0);
        const side = (c.scannerSide || 'derecha') === 'derecha' ? 'Der' : 'Izq';
        drawPill(pA, pB, `${(c.length || 1.8).toFixed(2)} m (Check Out ${side})`, '#10b981');
      });
    } else {
      // Minirack lines cotas (Racks Livianos)
      curState.lines.forEach((line) => {
        const b = getMinirackLineBounds(line, curState.depth);
        const pA = project(b.x0, 0.05, b.z0);
        const pB = project(b.x1, 0.05, b.z0);
        drawPill(pA, pB, `${realMinirackLineWidth(line).toFixed(2)} m (R. Liviano)`, '#f97316');
      });

      // Racks Pesados cotas
      (curState.heavyRacks?.lines || []).forEach((hrl) => {
        const b = getHeavyRackLineBounds(hrl, curState.heavyRacks.depth);
        const pA = project(b.x0, 0.05, b.z0);
        const pB = project(b.x1, 0.05, b.z0);
        drawPill(pA, pB, `${realHeavyRackLineWidth(hrl).toFixed(2)} m (R. Pesado)`, '#ea580c');
      });

      // Estanterías cotas
      curState.shelfLines.forEach((sline) => {
        const b = getShelfLineBounds(sline, curState.shelfDepth);
        const pA = project(b.x0, 0.05, b.z0);
        const pB = project(b.x1, 0.05, b.z0);
        drawPill(pA, pB, `${realShelfLineWidth(sline).toFixed(2)} m (Estantería)`, '#38bdf8');
      });
    }
  };

  // ── Smooth Camera Transition Functions ──
  const triggerCameraTransition = (targetCamPos: THREE.Vector3, targetLookAt: THREE.Vector3) => {
    cameraTargetPos.current = targetCamPos;
    controlsTargetPos.current = targetLookAt;
  };

  const handleIsometricView = () => {
    triggerCameraTransition(new THREE.Vector3(12, 10, 14), new THREE.Vector3(4, 1.2, 4));
  };

  const handleTopView = () => {
    triggerCameraTransition(new THREE.Vector3(6, 22, 5), new THREE.Vector3(6, 0, 5));
  };

  const handleFrontView = () => {
    triggerCameraTransition(new THREE.Vector3(6, 2.5, 16), new THREE.Vector3(6, 1.5, 3));
  };

  const handleWalkthroughView = () => {
    triggerCameraTransition(new THREE.Vector3(2.5, 1.65, 4.5), new THREE.Vector3(2.5, 1.65, 0));
  };

  const handleFocusSelected = () => {
    if (!selection.type || selection.idx === null) return;
    let center = new THREE.Vector3(4, 1, 4);

    if (selection.type === 'minirack' && state.lines[selection.idx]) {
      const b = getMinirackLineBounds(state.lines[selection.idx], state.depth);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, state.height / 2, (b.z0 + b.z1) / 2);
    } else if (selection.type === 'estanteria' && state.shelfLines[selection.idx]) {
      const b = getShelfLineBounds(state.shelfLines[selection.idx], state.shelfDepth);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, state.shelfHeight / 2, (b.z0 + b.z1) / 2);
    } else if (selection.type === 'gondolaPared' && state.gondolaPared.lines[selection.idx]) {
      const b = getGondolaParedLineBounds(state.gondolaPared.lines[selection.idx], state.gondolaPared.depth);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, 1.0, (b.z0 + b.z1) / 2);
    } else if (selection.type === 'gondolaCentral' && state.gondolaCentral.lines[selection.idx]) {
      const b = getGondolaCentralLineBounds(state.gondolaCentral.lines[selection.idx], state.gondolaCentral.depth);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, 0.9, (b.z0 + b.z1) / 2);
    } else if (selection.type === 'obstacle' && state.obstacles[selection.idx]) {
      const b = getObstacleBounds(state.obstacles[selection.idx], state.warehouse.height);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, 1.2, (b.z0 + b.z1) / 2);
    } else if (selection.type === 'puntera' && state.punteras?.[selection.idx]) {
      const b = getPunteraBounds(state.punteras[selection.idx]);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, 0.8, (b.z0 + b.z1) / 2);
    } else if (selection.type === 'heladera' && state.heladeras?.[selection.idx]) {
      const b = getHeladeraBounds(state.heladeras[selection.idx]);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, 1.0, (b.z0 + b.z1) / 2);
    } else if (selection.type === 'checkout' && state.checkouts?.[selection.idx]) {
      const b = getCheckoutBounds(state.checkouts[selection.idx]);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, 0.5, (b.z0 + b.z1) / 2);
    } else if (selection.type === 'door' && state.doors?.[selection.idx]) {
      const b = getDoorBounds(state.doors[selection.idx]);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, 1.2, (b.z0 + b.z1) / 2);
    } else if (selection.type === 'heavyRack' && state.heavyRacks?.lines?.[selection.idx]) {
      const b = getHeavyRackLineBounds(state.heavyRacks.lines[selection.idx], state.heavyRacks.depth);
      center = new THREE.Vector3((b.x0 + b.x1) / 2, 2.0, (b.z0 + b.z1) / 2);
    }

    triggerCameraTransition(new THREE.Vector3(center.x + 3.5, center.y + 2.5, center.z + 4.5), center);
  };

  // ── Mouse Drag & Selection Handlers ──
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !canvasRef.current || !cameraRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    mouseVec.current.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.current.setFromCamera(mouseVec.current, cameraRef.current);
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

    const isSalon = state.activeSection === 'salon';
    const selectableChildren = isSalon
      ? [
          ...gondolaParedGroupRef.current.children,
          ...gondolaCentralGroupRef.current.children,
          ...punteraGroupRef.current.children,
          ...heladeraGroupRef.current.children,
          ...checkoutGroupRef.current.children,
          ...doorGroupRef.current.children,
          ...obstacleGroupRef.current.children,
        ]
      : [
          ...minirackGroupRef.current.children,
          ...heavyRackGroupRef.current.children,
          ...shelfGroupRef.current.children,
          ...doorGroupRef.current.children,
          ...obstacleGroupRef.current.children,
        ];

    const hits = raycaster.current.intersectObjects(selectableChildren, true);

    if (hits.length > 0) {
      const data = hits[0].object.userData;
      if (data.type && data.idx !== undefined && data.idx >= 0) {
        onSelect({ type: data.type, idx: data.idx });
        isDraggingRef.current = true;
        if (controlsRef.current) controlsRef.current.enabled = false;

        const hitFloor = new THREE.Vector3();
        if (raycaster.current.ray.intersectPlane(floorPlane.current, hitFloor)) {
          let curX = 0;
          let curZ = 0;
          let itemW = 1.0;
          let itemD = 1.0;
          if (data.type === 'minirack' && state.lines[data.idx]) {
            const l = state.lines[data.idx];
            curX = l.xOff;
            curZ = l.zOff;
            const b = getMinirackLineBounds(l, state.depth);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          } else if (data.type === 'estanteria' && state.shelfLines[data.idx]) {
            const l = state.shelfLines[data.idx];
            curX = l.xOff;
            curZ = l.zOff;
            const b = getShelfLineBounds(l, state.shelfDepth);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          } else if (data.type === 'gondolaPared' && state.gondolaPared.lines[data.idx]) {
            const l = state.gondolaPared.lines[data.idx];
            curX = l.xOff;
            curZ = l.zOff;
            const b = getGondolaParedLineBounds(l, state.gondolaPared.depth);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          } else if (data.type === 'gondolaCentral' && state.gondolaCentral.lines[data.idx]) {
            const l = state.gondolaCentral.lines[data.idx];
            curX = l.xOff;
            curZ = l.zOff;
            const b = getGondolaCentralLineBounds(l, state.gondolaCentral.depth);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          } else if (data.type === 'obstacle' && state.obstacles[data.idx]) {
            const o = state.obstacles[data.idx];
            curX = o.x;
            curZ = o.z;
            const b = getObstacleBounds(o, state.warehouse.height);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          } else if (data.type === 'puntera' && state.punteras?.[data.idx]) {
            const p = state.punteras[data.idx];
            curX = p.x;
            curZ = p.z;
            const b = getPunteraBounds(p);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          } else if (data.type === 'heladera' && state.heladeras?.[data.idx]) {
            const h = state.heladeras[data.idx];
            curX = h.x;
            curZ = h.z;
            const b = getHeladeraBounds(h);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          } else if (data.type === 'checkout' && state.checkouts?.[data.idx]) {
            const c = state.checkouts[data.idx];
            curX = c.x;
            curZ = c.z;
            const b = getCheckoutBounds(c);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          } else if (data.type === 'door' && state.doors?.[data.idx]) {
            const d = state.doors[data.idx];
            curX = d.x;
            curZ = d.z;
            const b = getDoorBounds(d);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          } else if (data.type === 'heavyRack' && state.heavyRacks?.lines?.[data.idx]) {
            const l = state.heavyRacks.lines[data.idx];
            curX = l.xOff;
            curZ = l.zOff;
            const b = getHeavyRackLineBounds(l, state.heavyRacks.depth);
            itemW = b.x1 - b.x0;
            itemD = b.z1 - b.z0;
          }
          dragOffsetRef.current = { x: hitFloor.x - curX, z: hitFloor.z - curZ };

          const targetGrp = getObjectGroup(data.type, data.idx);
          const attachedPunteras: { idx: number; group: THREE.Group; initialPos: { x: number; z: number } }[] = [];
          if (data.type === 'gondolaCentral') {
            (state.punteras || []).forEach((p, pIdx) => {
              if (p.attachedCentralIdx === data.idx) {
                const pGrp = getObjectGroup('puntera', pIdx);
                if (pGrp) {
                  attachedPunteras.push({ idx: pIdx, group: pGrp, initialPos: { x: pGrp.position.x, z: pGrp.position.z } });
                }
              }
            });
          }

          dragSessionRef.current = {
            type: data.type,
            idx: data.idx,
            initialItemX: curX,
            initialItemZ: curZ,
            currentItemX: curX,
            currentItemZ: curZ,
            itemW,
            itemD,
            targetGroup: targetGrp,
            initialGroupPos: targetGrp ? { x: targetGrp.position.x, z: targetGrp.position.z } : { x: 0, z: 0 },
            attachedPunteras,
            initialSelBoxMin: selBoxHelperRef.current ? selBoxHelperRef.current.box.min.clone() : null,
            initialSelBoxMax: selBoxHelperRef.current ? selBoxHelperRef.current.box.max.clone() : null,
          };
        }
        return;
      }
    }

    onSelect({ type: null, idx: null });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !canvasRef.current || !cameraRef.current || !dragSessionRef.current) return;
    const dist = Math.hypot(e.clientX - mouseDownPosRef.current.x, e.clientY - mouseDownPosRef.current.y);
    if (dist < 4) return;

    const r = canvasRef.current.getBoundingClientRect();
    mouseVec.current.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.current.setFromCamera(mouseVec.current, cameraRef.current);

    const hitFloor = new THREE.Vector3();
    if (raycaster.current.ray.intersectPlane(floorPlane.current, hitFloor)) {
      const session = dragSessionRef.current;
      const rawTargetX = snap10(hitFloor.x - dragOffsetRef.current.x);
      const rawTargetZ = snap10(hitFloor.z - dragOffsetRef.current.z);

      const maxAllowedX = Math.max(0, snap10(state.warehouse.width - session.itemW));
      const maxAllowedZ = Math.max(0, snap10(state.warehouse.depth - session.itemD));
      const targetX = Math.max(0, Math.min(maxAllowedX, rawTargetX));
      const targetZ = Math.max(0, Math.min(maxAllowedZ, rawTargetZ));

      if (session.currentItemX === targetX && session.currentItemZ === targetZ) {
        return;
      }

      session.currentItemX = targetX;
      session.currentItemZ = targetZ;

      const deltaX = targetX - session.initialItemX;
      const deltaZ = targetZ - session.initialItemZ;

      // Update 3D mesh position directly - 0 memory allocation, 0 React re-render
      if (session.targetGroup) {
        session.targetGroup.position.x = session.initialGroupPos.x + deltaX;
        session.targetGroup.position.z = session.initialGroupPos.z + deltaZ;
      }

      // Move attached punteras in sync
      session.attachedPunteras.forEach((p) => {
        p.group.position.x = p.initialPos.x + deltaX;
        p.group.position.z = p.initialPos.z + deltaZ;
      });

      // Update selection bounding box helper in real-time
      if (selBoxHelperRef.current && session.initialSelBoxMin && session.initialSelBoxMax) {
        selBoxHelperRef.current.box.min.x = session.initialSelBoxMin.x + deltaX;
        selBoxHelperRef.current.box.max.x = session.initialSelBoxMax.x + deltaX;
        selBoxHelperRef.current.box.min.z = session.initialSelBoxMin.z + deltaZ;
        selBoxHelperRef.current.box.max.z = session.initialSelBoxMax.z + deltaZ;
      }
    }
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      if (controlsRef.current) controlsRef.current.enabled = true;

      const session = dragSessionRef.current;
      dragSessionRef.current = null;

      if (session && (session.currentItemX !== session.initialItemX || session.currentItemZ !== session.initialItemZ)) {
        const { type, idx, currentItemX, currentItemZ } = session;
        if (type === 'minirack') {
          onMoveMinirack(idx, currentItemX, currentItemZ);
        } else if (type === 'estanteria') {
          onMoveShelf(idx, currentItemX, currentItemZ);
        } else if (type === 'gondolaPared') {
          onMoveGondolaPared(idx, currentItemX, currentItemZ);
        } else if (type === 'gondolaCentral') {
          onMoveGondolaCentral(idx, currentItemX, currentItemZ);
        } else if (type === 'obstacle') {
          onMoveObstacle(idx, currentItemX, currentItemZ);
        } else if (type === 'puntera' && onMovePuntera) {
          onMovePuntera(idx, currentItemX, currentItemZ);
        } else if (type === 'heladera' && onMoveHeladera) {
          onMoveHeladera(idx, currentItemX, currentItemZ);
        } else if (type === 'checkout' && onMoveCheckout) {
          onMoveCheckout(idx, currentItemX, currentItemZ);
        } else if (type === 'door' && onMoveDoor) {
          onMoveDoor(idx, currentItemX, currentItemZ);
        } else if (type === 'heavyRack' && onMoveHeavyRack) {
          onMoveHeavyRack(idx, currentItemX, currentItemZ);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      id="viewport-container"
      className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden cursor-default"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} id="canvas-3d" className="block w-full h-full" />
      <canvas ref={dimCanvasRef} id="canvas-dimensions" className="absolute inset-0 pointer-events-none w-full h-full" />

      {/* Floating View Transitions HUD Toolbar */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 text-xs">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            Niveles de Vista
          </div>
          <button
            onClick={handleIsometricView}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all font-medium text-left"
            title="Vista Isométrica 3D"
          >
            <span className="text-amber-400">📐</span> Isométrica 3D
          </button>
          <button
            onClick={handleTopView}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all font-medium text-left"
            title="Vista de Planta 2D"
          >
            <span className="text-cyan-400">⊞</span> Vista Planta
          </button>
          <button
            onClick={handleFrontView}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all font-medium text-left"
            title="Vista Frontal / Alzado"
          >
            <span className="text-emerald-400">👁️</span> Frontal / Alzado
          </button>
          <button
            onClick={handleWalkthroughView}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all font-medium text-left"
            title="Paseo Peatonal Inmersivo"
          >
            <span className="text-rose-400">🚶</span> Peatonal Pasillo
          </button>

          {selection.type && (
            <button
              onClick={handleFocusSelected}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 transition-all font-medium text-left mt-1 animate-pulse"
              title="Enfocar Elemento Seleccionado"
            >
              <span>🎯</span> Enfocar Selección
            </button>
          )}
        </div>

        {/* Quick Render Mode Toggle */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-2xl flex gap-1 justify-center text-xs">
          <button
            onClick={() => onSetViewMode('standard')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              state.viewMode === 'standard' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Estándar
          </button>
          <button
            onClick={() => onSetViewMode('realistic')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              state.viewMode === 'realistic' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Realista
          </button>
          <button
            onClick={() => onSetViewMode('wireframe')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              state.viewMode === 'wireframe' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Líneas
          </button>
        </div>

        {/* Quick Visual Toggles: Sombras y Cotas */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-2xl flex gap-1 text-xs">
          <button
            onClick={onToggleShadows}
            className={`flex-1 px-2 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              state.showShadows
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Activar / Desactivar Sombras 3D"
          >
            <span>🌓</span>
            <span>Sombras</span>
          </button>
          <button
            onClick={onToggleDims}
            className={`flex-1 px-2 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              state.showDims
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Activar / Desactivar Cotas y Medidas"
          >
            <span>📏</span>
            <span>Cotas</span>
          </button>
        </div>
      </div>

      {/* Bottom helper tip */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/85 backdrop-blur-md border border-slate-800 text-slate-400 text-xs px-4 py-1.5 rounded-full pointer-events-none shadow-lg whitespace-nowrap">
        Clic para seleccionar · Flechas del teclado (Shift=0.05m) para mover · Arrastrar vacío para orbitar
      </div>
    </div>
  );
};
