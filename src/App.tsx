import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveTab, AppState, SelectionState, ViewMode, MetaConfig, Bounds3D, WorkspaceSection } from './types';
import { Sidebar } from './components/Sidebar';
import { Viewport3D } from './components/Viewport3D';
import { FloatingInfo } from './components/FloatingInfo';
import { SaveModal } from './components/SaveModal';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { DbProject, saveProject, calculateProjectStats } from './services/dbService';
import {
  clampObstacleToWarehouse,
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
  getAllColliders,
  hasCollision,
  isWithinWarehouse,
  tryMoveWithConstraints,
} from './utils/calculations';
import { 
  ArrowLeft, 
  Home, 
  Cloud, 
  Check, 
  Loader2, 
  PanelLeftClose, 
  PanelLeftOpen, 
  FileText, 
  Sparkles, 
  Boxes,
  Eye,
  Store,
  Building2,
} from 'lucide-react';

export default function App() {
  const { user, profile } = useAuth();

  // Navigation Screen: 'landing' | 'admin' | 'visualizer'
  const [screen, setScreen] = useState<'landing' | 'admin' | 'visualizer'>('landing');
  const [activeProject, setActiveProject] = useState<DbProject | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [savingCloud, setSavingCloud] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('gondola-pared');
  const [selection, setSelection] = useState<SelectionState>({ type: null, idx: null });
  const [saveDialogAction, setSaveDialogAction] = useState<'save' | 'designer' | 'share' | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const notifTimeoutRef = useRef<number | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    notifTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 2800);
  }, []);

  // Global Integrated 3D Layout State
  const [state, setState] = useState<AppState>({
    activeSection: 'salon',

    // 1. Miniracks (Racks Livianos)
    height: 2.4,
    depth: 0.6,
    shelfCount: 3,
    lines: [
      {
        xOff: 1.0,
        zOff: 1.0,
        rotation: 0,
        modules: [
          { bl: 1.5, sc: 3 },
          { bl: 1.5, sc: 3 },
        ],
      },
    ],

    // 1.b Racks Pesados (Selectivos para pallets)
    heavyRacks: {
      height: 4.5,
      depth: 1.10,
      defaultLevels: 3,
      lines: [
        {
          xOff: 1.0,
          zOff: 4.0,
          rotation: 0,
          height: 4.5,
          depth: 1.10,
          modules: [
            { bl: 2.70, levels: 3, capPerLevel: 2400 },
            { bl: 2.70, levels: 3, capPerLevel: 2400 },
          ],
        },
      ],
    },

    // 2. Estanterías
    shelfHeight: 2.0,
    shelfDepth: 0.42,
    shelfLevels: 5,
    shelfCapacity: 100,
    shelfLines: [
      {
        xOff: 1.0,
        zOff: 2.8,
        rotation: 0,
        modules: [
          { bl: 0.9, sc: 5 },
          { bl: 0.9, sc: 5 },
        ],
      },
    ],

    // 3. Góndolas de Pared
    gondolaPared: {
      height: 2.0,
      depth: 0.47,
      shelfCount: 5,
      moduleLength: 1.0,
      lines: [
        {
          xOff: 1.0,
          zOff: 1.0,
          rotation: 0,
          modules: [
            { bl: 1.0, sc: 5, depth: 0.47 },
            { bl: 1.0, sc: 5, depth: 0.47 },
          ],
        },
      ],
    },

    // 4. Góndolas Centrales (Doble Faz)
    gondolaCentral: {
      height: 1.6,
      depth: 0.47,
      shelfCount: 3,
      moduleLength: 1.0,
      lines: [
        {
          xOff: 1.0,
          zOff: 4.0,
          rotation: 0,
          height: 1.6,
          modules: [
            {
              bl: 1.0,
              height: 1.6,
              scA: 3,
              scB: 3,
              depthA: 0.47,
              depthB: 0.47,
            },
            {
              bl: 1.0,
              height: 1.6,
              scA: 3,
              scB: 3,
              depthA: 0.47,
              depthB: 0.47,
            },
          ],
        },
      ],
    },

    // Salón Components
    punteras: [
      {
        id: 1,
        x: 3.04,
        z: 4.02,
        rotation: 90,
        width: 0.90,
        height: 1.60,
        depth: 0.38,
        shelfCount: 4,
        attachedCentralIdx: 0,
      },
    ],
    heladeras: [
      {
        id: 2,
        x: 6.0,
        z: 1.0,
        rotation: 0,
        type: 'mural_vidrio',
        width: 1.80,
        depth: 0.85,
        height: 2.00,
        color: 'negro',
        doorsCount: 3,
        illuminated: true,
      },
    ],
    checkouts: [
      {
        id: 3,
        x: 6.0,
        z: 6.5,
        rotation: 0,
        type: 'estandar',
        length: 2.20,
        width: 1.10,
        height: 0.88,
        scannerSide: 'derecha',
        hasBelt: true,
      },
    ],
    doors: [
      {
        id: 4,
        x: 1.0,
        z: 10.0,
        rotation: 0,
        section: 'salon',
        type: 'vidrio_doble',
        width: 2.00,
        height: 2.20,
      },
    ],

    // 5. Salón / Depósito & Obstáculos
    warehouse: {
      enabled: true,
      width: 14.0,
      depth: 12.0,
      height: 4.5,
      wallColor: '#1e40af',
      wallOpacity: 0.3,
    },
    obstacles: [
      { id: 101, type: 'column', x: 8.0, z: 4.0, w: 0.4, d: 0.4 },
      { id: 102, type: 'opening', x: 0.0, z: 6.0, w: 2.2, fh: 2.6, rotation: 90 },
    ],

    // 6. View & Display Options
    viewMode: 'standard',
    lightIntensity: 1.0,
    showDims: true,
    showShelfDims: false,
    showShadows: true,
    showGrid: true,

    // 7. Metadata
    meta: {
      cliente: '',
      nroPlano: '',
      fecha: new Date().toISOString().slice(0, 10),
      whatsapp: '',
    },
  });

  // Strict Movement Handlers: No product leaves the warehouse, no product overlaps another
  const handleMoveMinirack = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const lines = [...prev.lines];
      if (!lines[idx]) return prev;
      const cur = lines[idx];
      const b = getMinirackLineBounds(cur, prev.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'minirack', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.xOff,
        cur.zOff,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.xOff && newZ === cur.zOff) return prev;
      lines[idx] = { ...cur, xOff: newX, zOff: newZ };
      return { ...prev, lines };
    });
  }, []);

  const handleMoveShelf = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const shelfLines = [...prev.shelfLines];
      if (!shelfLines[idx]) return prev;
      const cur = shelfLines[idx];
      const b = getShelfLineBounds(cur, prev.shelfDepth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'estanteria', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.xOff,
        cur.zOff,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.xOff && newZ === cur.zOff) return prev;
      shelfLines[idx] = { ...cur, xOff: newX, zOff: newZ };
      return { ...prev, shelfLines };
    });
  }, []);

  const handleMoveGondolaPared = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const lines = [...prev.gondolaPared.lines];
      if (!lines[idx]) return prev;
      const cur = lines[idx];
      const b = getGondolaParedLineBounds(cur, prev.gondolaPared.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'gondolaPared', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.xOff,
        cur.zOff,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.xOff && newZ === cur.zOff) return prev;
      lines[idx] = { ...cur, xOff: newX, zOff: newZ };
      return {
        ...prev,
        gondolaPared: { ...prev.gondolaPared, lines },
      };
    });
  }, []);

  const handleMoveGondolaCentral = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const lines = [...prev.gondolaCentral.lines];
      if (!lines[idx]) return prev;
      const cur = lines[idx];
      const b = getGondolaCentralLineBounds(cur, prev.gondolaCentral.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'gondolaCentral', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.xOff,
        cur.zOff,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.xOff && newZ === cur.zOff) return prev;
      lines[idx] = { ...cur, xOff: newX, zOff: newZ };

      const dx = newX - cur.xOff;
      const dz = newZ - cur.zOff;
      const punteras = (prev.punteras || []).map((p) => {
        if (p.attachedCentralIdx === idx) {
          return {
            ...p,
            x: Math.max(0, snap10(p.x + dx)),
            z: Math.max(0, snap10(p.z + dz)),
          };
        }
        return p;
      });

      return {
        ...prev,
        gondolaCentral: { ...prev.gondolaCentral, lines },
        punteras,
      };
    });
  }, []);

  const handleMoveObstacle = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const obstacles = [...prev.obstacles];
      if (!obstacles[idx]) return prev;
      const cur = obstacles[idx];
      const b = getObstacleBounds(cur, prev.warehouse.height);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'obstacle', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.x,
        cur.z,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.x && newZ === cur.z) return prev;
      obstacles[idx] = { ...cur, x: newX, z: newZ };
      return { ...prev, obstacles };
    });
  }, []);

  const handleMovePuntera = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const punteras = [...(prev.punteras || [])];
      if (!punteras[idx]) return prev;
      const cur = punteras[idx];
      const b = getPunteraBounds(cur);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'puntera', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.x,
        cur.z,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.x && newZ === cur.z) return prev;
      punteras[idx] = { ...cur, x: newX, z: newZ };
      return { ...prev, punteras };
    });
  }, []);

  const handleMoveHeladera = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const heladeras = [...(prev.heladeras || [])];
      if (!heladeras[idx]) return prev;
      const cur = heladeras[idx];
      const b = getHeladeraBounds(cur);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'heladera', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.x,
        cur.z,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.x && newZ === cur.z) return prev;
      heladeras[idx] = { ...cur, x: newX, z: newZ };
      return { ...prev, heladeras };
    });
  }, []);

  const handleMoveCheckout = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const checkouts = [...(prev.checkouts || [])];
      if (!checkouts[idx]) return prev;
      const cur = checkouts[idx];
      const b = getCheckoutBounds(cur);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'checkout', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.x,
        cur.z,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.x && newZ === cur.z) return prev;
      checkouts[idx] = { ...cur, x: newX, z: newZ };
      return { ...prev, checkouts };
    });
  }, []);

  const handleMoveDoor = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const doors = [...(prev.doors || [])];
      if (!doors[idx]) return prev;
      const cur = doors[idx];
      const b = getDoorBounds(cur);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'door', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.x,
        cur.z,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.x && newZ === cur.z) return prev;
      doors[idx] = { ...cur, x: newX, z: newZ };
      return { ...prev, doors };
    });
  }, []);

  const handleMoveHeavyRack = useCallback((idx: number, x: number, z: number) => {
    setState((prev) => {
      const lines = [...(prev.heavyRacks?.lines || [])];
      if (!lines[idx]) return prev;
      const cur = lines[idx];
      const b = getHeavyRackLineBounds(cur, prev.heavyRacks.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const colliders = getAllColliders(prev, 'heavyRack', idx);

      const { x: newX, z: newZ } = tryMoveWithConstraints(
        cur.xOff,
        cur.zOff,
        x,
        z,
        w,
        d,
        prev.warehouse,
        colliders
      );

      if (newX === cur.xOff && newZ === cur.zOff) return prev;
      lines[idx] = { ...cur, xOff: newX, zOff: newZ };
      return {
        ...prev,
        heavyRacks: {
          ...prev.heavyRacks,
          lines,
        },
      };
    });
  }, []);

  // Keyboard Navigation (Arrow Keys & Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'visualizer') return;
      const allowed = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'];
      if (!allowed.includes(e.key) || !selection.type || selection.idx === null) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      e.preventDefault();

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
        return;
      }

      const step = e.shiftKey ? 0.05 : 0.1;
      let dx = 0;
      let dz = 0;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowDown') dz = step;
      if (e.key === 'ArrowUp') dz = -step;

      handleNudgeSelected(dx, dz);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, state, screen]);

  const handleNudgeSelected = (dx: number, dz: number) => {
    if (!selection.type || selection.idx === null) return;

    if (selection.type === 'minirack' && state.lines[selection.idx]) {
      const cur = state.lines[selection.idx];
      handleMoveMinirack(selection.idx, cur.xOff + dx, cur.zOff + dz);
    } else if (selection.type === 'estanteria' && state.shelfLines[selection.idx]) {
      const cur = state.shelfLines[selection.idx];
      handleMoveShelf(selection.idx, cur.xOff + dx, cur.zOff + dz);
    } else if (selection.type === 'gondolaPared' && state.gondolaPared.lines[selection.idx]) {
      const cur = state.gondolaPared.lines[selection.idx];
      handleMoveGondolaPared(selection.idx, cur.xOff + dx, cur.zOff + dz);
    } else if (selection.type === 'gondolaCentral' && state.gondolaCentral.lines[selection.idx]) {
      const cur = state.gondolaCentral.lines[selection.idx];
      handleMoveGondolaCentral(selection.idx, cur.xOff + dx, cur.zOff + dz);
    } else if (selection.type === 'obstacle' && state.obstacles[selection.idx]) {
      const cur = state.obstacles[selection.idx];
      handleMoveObstacle(selection.idx, cur.x + dx, cur.z + dz);
    } else if (selection.type === 'puntera' && state.punteras?.[selection.idx]) {
      const cur = state.punteras[selection.idx];
      handleMovePuntera(selection.idx, cur.x + dx, cur.z + dz);
    } else if (selection.type === 'heladera' && state.heladeras?.[selection.idx]) {
      const cur = state.heladeras[selection.idx];
      handleMoveHeladera(selection.idx, cur.x + dx, cur.z + dz);
    } else if (selection.type === 'checkout' && state.checkouts?.[selection.idx]) {
      const cur = state.checkouts[selection.idx];
      handleMoveCheckout(selection.idx, cur.x + dx, cur.z + dz);
    } else if (selection.type === 'door' && state.doors?.[selection.idx]) {
      const cur = state.doors[selection.idx];
      handleMoveDoor(selection.idx, cur.x + dx, cur.z + dz);
    } else if (selection.type === 'heavyRack' && state.heavyRacks?.lines?.[selection.idx]) {
      const cur = state.heavyRacks.lines[selection.idx];
      handleMoveHeavyRack(selection.idx, cur.xOff + dx, cur.zOff + dz);
    }
  };

  const handleRotateSelected = () => {
    if (!selection.type || selection.idx === null) return;

    if (selection.type === 'minirack') {
      setState((prev) => {
        const lines = [...prev.lines];
        const cur = lines[selection.idx!];
        if (!cur) return prev;
        const newRot = ((cur.rotation || 0) + 90) % 360;
        const prospective = { ...cur, rotation: newRot };
        const b = getMinirackLineBounds(prospective, prev.depth);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        if (w > prev.warehouse.width || d > prev.warehouse.depth) {
          showNotification('No se puede rotar: supera los límites del depósito.');
          return prev;
        }

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'minirack', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión con otro producto u obstáculo.');
          return prev;
        }

        lines[selection.idx!] = { ...prospective, xOff: clampedX, zOff: clampedZ };
        return { ...prev, lines };
      });
    } else if (selection.type === 'estanteria') {
      setState((prev) => {
        const shelfLines = [...prev.shelfLines];
        const cur = shelfLines[selection.idx!];
        if (!cur) return prev;
        const newRot = ((cur.rotation || 0) + 90) % 360;
        const prospective = { ...cur, rotation: newRot };
        const b = getShelfLineBounds(prospective, prev.shelfDepth);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        if (w > prev.warehouse.width || d > prev.warehouse.depth) {
          showNotification('No se puede rotar: supera los límites del depósito.');
          return prev;
        }

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'estanteria', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión con otro producto u obstáculo.');
          return prev;
        }

        shelfLines[selection.idx!] = { ...prospective, xOff: clampedX, zOff: clampedZ };
        return { ...prev, shelfLines };
      });
    } else if (selection.type === 'gondolaPared') {
      setState((prev) => {
        const lines = [...prev.gondolaPared.lines];
        const cur = lines[selection.idx!];
        if (!cur) return prev;
        const newRot = ((cur.rotation || 0) + 90) % 360;
        const prospective = { ...cur, rotation: newRot };
        const b = getGondolaParedLineBounds(prospective, prev.gondolaPared.depth);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        if (w > prev.warehouse.width || d > prev.warehouse.depth) {
          showNotification('No se puede rotar: supera los límites del depósito.');
          return prev;
        }

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'gondolaPared', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión con otro producto u obstáculo.');
          return prev;
        }

        lines[selection.idx!] = { ...prospective, xOff: clampedX, zOff: clampedZ };
        return {
          ...prev,
          gondolaPared: { ...prev.gondolaPared, lines },
        };
      });
    } else if (selection.type === 'gondolaCentral') {
      setState((prev) => {
        const lines = [...prev.gondolaCentral.lines];
        const cur = lines[selection.idx!];
        if (!cur) return prev;
        const newRot = ((cur.rotation || 0) + 90) % 360;
        const prospective = { ...cur, rotation: newRot };
        const b = getGondolaCentralLineBounds(prospective, prev.gondolaCentral.depth);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        if (w > prev.warehouse.width || d > prev.warehouse.depth) {
          showNotification('No se puede rotar: supera los límites del depósito.');
          return prev;
        }

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'gondolaCentral', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión con otro producto u obstáculo.');
          return prev;
        }

        lines[selection.idx!] = { ...prospective, xOff: clampedX, zOff: clampedZ };
        return {
          ...prev,
          gondolaCentral: { ...prev.gondolaCentral, lines },
        };
      });
    } else if (selection.type === 'obstacle') {
      setState((prev) => {
        const obstacles = [...prev.obstacles];
        const cur = obstacles[selection.idx!];
        if (!cur || cur.type !== 'opening') return prev;
        const newRot = cur.rotation === 0 ? 90 : 0;
        const prospective = { ...cur, rotation: newRot };
        const b = getObstacleBounds(prospective, prev.warehouse.height);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.x));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.z));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'obstacle', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión con otro producto u obstáculo.');
          return prev;
        }

        obstacles[selection.idx!] = { ...prospective, x: clampedX, z: clampedZ };
        return { ...prev, obstacles };
      });
    } else if (selection.type === 'puntera') {
      setState((prev) => {
        const punteras = [...(prev.punteras || [])];
        const cur = punteras[selection.idx!];
        if (!cur) return prev;
        const newRot = ((cur.rotation || 0) + 90) % 360;
        const prospective = { ...cur, rotation: newRot };
        const b = getPunteraBounds(prospective);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        if (w > prev.warehouse.width || d > prev.warehouse.depth) {
          showNotification('No se puede rotar: supera los límites del salón.');
          return prev;
        }

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.x));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.z));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'puntera', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión detectada.');
          return prev;
        }

        punteras[selection.idx!] = { ...prospective, x: clampedX, z: clampedZ };
        return { ...prev, punteras };
      });
    } else if (selection.type === 'heladera') {
      setState((prev) => {
        const heladeras = [...(prev.heladeras || [])];
        const cur = heladeras[selection.idx!];
        if (!cur) return prev;
        const newRot = ((cur.rotation || 0) + 90) % 360;
        const prospective = { ...cur, rotation: newRot };
        const b = getHeladeraBounds(prospective);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        if (w > prev.warehouse.width || d > prev.warehouse.depth) {
          showNotification('No se puede rotar: supera los límites del salón.');
          return prev;
        }

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.x));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.z));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'heladera', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión detectada.');
          return prev;
        }

        heladeras[selection.idx!] = { ...prospective, x: clampedX, z: clampedZ };
        return { ...prev, heladeras };
      });
    } else if (selection.type === 'checkout') {
      setState((prev) => {
        const checkouts = [...(prev.checkouts || [])];
        const cur = checkouts[selection.idx!];
        if (!cur) return prev;
        const newRot = ((cur.rotation || 0) + 90) % 360;
        const prospective = { ...cur, rotation: newRot };
        const b = getCheckoutBounds(prospective);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        if (w > prev.warehouse.width || d > prev.warehouse.depth) {
          showNotification('No se puede rotar: supera los límites del salón.');
          return prev;
        }

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.x));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.z));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'checkout', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión detectada.');
          return prev;
        }

        checkouts[selection.idx!] = { ...prospective, x: clampedX, z: clampedZ };
        return { ...prev, checkouts };
      });
    } else if (selection.type === 'door') {
      setState((prev) => {
        const doors = [...(prev.doors || [])];
        const cur = doors[selection.idx!];
        if (!cur) return prev;
        const newRot = ((cur.rotation || 0) + 90) % 360;
        const prospective = { ...cur, rotation: newRot };
        const b = getDoorBounds(prospective);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.x));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.z));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'door', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión detectada.');
          return prev;
        }

        doors[selection.idx!] = { ...prospective, x: clampedX, z: clampedZ };
        return { ...prev, doors };
      });
    } else if (selection.type === 'heavyRack') {
      setState((prev) => {
        const lines = [...(prev.heavyRacks?.lines || [])];
        const cur = lines[selection.idx!];
        if (!cur) return prev;
        const newRot = ((cur.rotation || 0) + 90) % 360;
        const prospective = { ...cur, rotation: newRot };
        const b = getHeavyRackLineBounds(prospective, prev.heavyRacks.depth);
        const w = b.x1 - b.x0;
        const d = b.z1 - b.z0;

        if (w > prev.warehouse.width || d > prev.warehouse.depth) {
          showNotification('No se puede rotar: supera los límites del depósito.');
          return prev;
        }

        const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
        const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
        const finalBounds: Bounds3D = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

        const colliders = getAllColliders(prev, 'heavyRack', selection.idx!);
        if (hasCollision(finalBounds, colliders)) {
          showNotification('Rotación bloqueada: colisión con otro producto u obstáculo.');
          return prev;
        }

        lines[selection.idx!] = { ...prospective, xOff: clampedX, zOff: clampedZ };
        return { ...prev, heavyRacks: { ...prev.heavyRacks, lines } };
      });
    }
  };

  // Central Gondola Module Height Handler
  const handleSetGondolaCentralModuleHeight = useCallback((lineIdx: number, modIdx: number, height: number) => {
    setState((prev) => {
      const lines = [...prev.gondolaCentral.lines];
      const line = lines[lineIdx];
      if (!line) return prev;
      const updatedModules = [...line.modules];
      updatedModules[modIdx] = { ...updatedModules[modIdx], height };
      const maxH = updatedModules.reduce((max, m) => Math.max(max, m.height || height), height);
      lines[lineIdx] = { ...line, height: maxH, modules: updatedModules };
      return {
        ...prev,
        gondolaCentral: { ...prev.gondolaCentral, lines },
      };
    });
  }, []);

  const handleDeleteSelected = () => {
    if (!selection.type || selection.idx === null) return;

    if (selection.type === 'minirack' && state.lines.length > 1) {
      setState((prev) => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== selection.idx),
      }));
    } else if (selection.type === 'estanteria') {
      setState((prev) => ({
        ...prev,
        shelfLines: prev.shelfLines.filter((_, i) => i !== selection.idx),
      }));
    } else if (selection.type === 'gondolaPared') {
      setState((prev) => ({
        ...prev,
        gondolaPared: {
          ...prev.gondolaPared,
          lines: prev.gondolaPared.lines.filter((_, i) => i !== selection.idx),
        },
      }));
    } else if (selection.type === 'gondolaCentral') {
      setState((prev) => ({
        ...prev,
        gondolaCentral: {
          ...prev.gondolaCentral,
          lines: prev.gondolaCentral.lines.filter((_, i) => i !== selection.idx),
        },
      }));
    } else if (selection.type === 'obstacle') {
      setState((prev) => ({
        ...prev,
        obstacles: prev.obstacles.filter((_, i) => i !== selection.idx),
      }));
    } else if (selection.type === 'puntera') {
      setState((prev) => ({
        ...prev,
        punteras: (prev.punteras || []).filter((_, i) => i !== selection.idx),
      }));
    } else if (selection.type === 'heladera') {
      setState((prev) => ({
        ...prev,
        heladeras: (prev.heladeras || []).filter((_, i) => i !== selection.idx),
      }));
    } else if (selection.type === 'checkout') {
      setState((prev) => ({
        ...prev,
        checkouts: (prev.checkouts || []).filter((_, i) => i !== selection.idx),
      }));
    } else if (selection.type === 'door') {
      setState((prev) => ({
        ...prev,
        doors: (prev.doors || []).filter((_, i) => i !== selection.idx),
      }));
    } else if (selection.type === 'heavyRack') {
      setState((prev) => ({
        ...prev,
        heavyRacks: {
          ...prev.heavyRacks,
          lines: (prev.heavyRacks?.lines || []).filter((_, i) => i !== selection.idx),
        },
      }));
    }

    setSelection({ type: null, idx: null });
  };

  // PDF Print Output Handler
  const handlePrintPDF = () => {
    window.print();
  };

  // Cloud Save to Firestore
  const handleSaveToCloud = async () => {
    if (!user) {
      showNotification('Inicia sesión en el panel para guardar en la base de datos.');
      return;
    }

    setSavingCloud(true);
    try {
      const projName = activeProject?.name || state.meta.cliente || 'Almacén 3D Guardado';
      const updated = await saveProject(
        user.uid,
        projName,
        state,
        activeProject?.id,
        activeProject?.clientId,
        activeProject?.clientName
      );
      setActiveProject(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      showNotification('✓ Proyecto guardado en la base de datos de Firestore.');
    } catch (e) {
      console.error('Error guardando en la nube:', e);
      showNotification('Error al guardar en la nube. Revisa la consola.');
    } finally {
      setSavingCloud(false);
    }
  };

  // View: Landing Page
  if (screen === 'landing') {
    return (
      <LandingPage
        onGoToAdmin={() => setScreen('admin')}
        onGoTo3D={() => setScreen('visualizer')}
      />
    );
  }

  // View: Admin Dashboard
  if (screen === 'admin') {
    return (
      <AdminDashboard
        onOpenProjectIn3D={(proj) => {
          try {
            const parsed: AppState = JSON.parse(proj.warehouseState);
            setState(parsed);
          } catch (e) {
            console.error('Error cargando estado:', e);
          }
          setActiveProject(proj);
          setScreen('visualizer');
        }}
        onNewProjectIn3D={(name, clientId, clientName) => {
          setActiveProject({
            id: `proj_${Date.now()}`,
            userId: user?.uid || '',
            name,
            clientId,
            clientName,
            warehouseState: JSON.stringify(state),
            stats: calculateProjectStats(state),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setScreen('visualizer');
        }}
        onGoToHome={() => setScreen('landing')}
        currentState={state}
      />
    );
  }

  // View: Full-Screen 3D Visualizer
  return (
    <div id="app-root" className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 3D Visualizer Dedicated Top Header */}
      <header className="h-14 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('admin')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Volver al Panel de Administración"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Panel Admin</span>
          </button>

          <button
            onClick={() => setScreen('landing')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Ir a Pantalla de Inicio"
          >
            <Home className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Workspace Section Switcher in Header */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setState((p) => ({ ...p, activeSection: 'salon' }));
                setActiveTab('gondola-pared');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                state.activeSection === 'salon'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sección Salón Comercial: Góndolas, Heladeras, Check Outs, Punteras"
            >
              <Store className="w-3.5 h-3.5 text-rose-200" />
              <span>Salón</span>
            </button>
            <button
              onClick={() => {
                setState((p) => ({ ...p, activeSection: 'deposito' }));
                setActiveTab('racks-livianos');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                state.activeSection === 'deposito'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sección Depósito Industrial: Racks Livianos, Racks Pesados, Estanterías, Portones"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-200" />
              <span>Depósito</span>
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden md:block" />

          {/* Project Title & Client Tag */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-bold text-sm text-white max-w-[140px] md:max-w-[240px] truncate">
              {activeProject?.name || state.meta.cliente || 'Proyecto 3D'}
            </span>
            {activeProject?.clientName && (
              <span className="hidden md:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {activeProject.clientName}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Cloud Save Button */}
          <button
            onClick={handleSaveToCloud}
            disabled={savingCloud}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
            title="Guardar cambios en la base de datos de Firestore"
          >
            {savingCloud ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : savedSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {savingCloud ? 'Guardando...' : savedSuccess ? '¡Guardado!' : 'Guardar en Nube'}
            </span>
          </button>

          {/* Export / Share Modal Button */}
          <button
            onClick={() => setSaveDialogAction('save')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Exportar archivo HTML interactivo o Ficha"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Exportar</span>
          </button>

          {/* View Mode Quick Buttons */}
          <div className="hidden lg:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setState((p) => ({ ...p, viewMode: 'standard' }))}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                state.viewMode === 'standard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Estándar
            </button>
            <button
              onClick={() => setState((p) => ({ ...p, viewMode: 'realistic' }))}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                state.viewMode === 'realistic' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Realista
            </button>
            <button
              onClick={() => setState((p) => ({ ...p, viewMode: 'wireframe' }))}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                state.viewMode === 'wireframe' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alambre
            </button>
          </div>

          {/* Toggle Sidebar (Full Screen 3D Mode) */}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sidebarOpen
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
            }`}
            title={sidebarOpen ? 'Ocultar panel lateral (Modo 3D Total)' : 'Mostrar panel de herramientas'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main 3D Screen Workspace */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar Controls */}
        {sidebarOpen && (
          <div className="shrink-0 h-full border-r border-slate-800/80 transition-all duration-300 z-20">
            <Sidebar
              state={state}
              activeTab={activeTab}
              selection={selection}
              onTabChange={setActiveTab}
              onSelect={setSelection}
              onUpdateState={setState}
              onOpenSaveDialog={(act) => setSaveDialogAction(act)}
              onPrintPDF={handlePrintPDF}
              onSetGondolaCentralModuleHeight={handleSetGondolaCentralModuleHeight}
            />
          </div>
        )}

        {/* 3D Viewport Component */}
        <main id="viewport-wrapper" className="relative flex-1 h-full overflow-hidden">
          <Viewport3D
            state={state}
            selection={selection}
            onSelect={setSelection}
            onMoveMinirack={handleMoveMinirack}
            onMoveShelf={handleMoveShelf}
            onMoveGondolaPared={handleMoveGondolaPared}
            onMoveGondolaCentral={handleMoveGondolaCentral}
            onMoveObstacle={handleMoveObstacle}
            onMovePuntera={handleMovePuntera}
            onMoveHeladera={handleMoveHeladera}
            onMoveCheckout={handleMoveCheckout}
            onMoveDoor={handleMoveDoor}
            onMoveHeavyRack={handleMoveHeavyRack}
            onSetViewMode={(mode) => setState((prev) => ({ ...prev, viewMode: mode }))}
          />

          {/* If sidebar is collapsed, quick open button floating on top left of viewport */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-4 left-4 z-30 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <PanelLeftOpen className="w-4 h-4 text-blue-400" />
              <span>Abrir Herramientas</span>
            </button>
          )}

          {/* Floating Inspector for Selected Item */}
          <FloatingInfo
            state={state}
            selection={selection}
            onClose={() => setSelection({ type: null, idx: null })}
            onNudge={handleNudgeSelected}
            onRotate={handleRotateSelected}
            onDelete={handleDeleteSelected}
            onSetGondolaCentralModuleHeight={handleSetGondolaCentralModuleHeight}
          />

          {/* Collision / Limit Notification Toast */}
          {notification && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-500/95 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs border border-amber-300 flex items-center gap-2 animate-bounce">
              <span>⚠️</span>
              <span>{notification}</span>
            </div>
          )}
        </main>
      </div>

      {/* Save / Export Modal */}
      {saveDialogAction && (
        <SaveModal
          action={saveDialogAction}
          state={state}
          onClose={() => setSaveDialogAction(null)}
          onUpdateMeta={(meta: MetaConfig) =>
            setState((prev) => ({ ...prev, meta }))
          }
        />
      )}
    </div>
  );
}
