import React from 'react';
import {
  ActiveTab,
  AppState,
  GondolaCentralLine,
  GondolaParedLine,
  MinirackLine,
  Obstacle,
  SelectionState,
  ShelfLine,
} from '../types';
import {
  calculateSummary,
  findOpenPlacementSpot,
  getAllColliders,
  getGondolaCentralLineBounds,
  getGondolaParedLineBounds,
  getMinirackLineBounds,
  getObstacleBounds,
  getShelfLineBounds,
  hasCollision,
  isWithinWarehouse,
  realGondolaCentralLineWidth,
  realGondolaParedLineWidth,
  realMinirackLineWidth,
  realShelfLineWidth,
  snap10,
} from '../utils/calculations';
import { 
  Boxes, 
  Layers, 
  Store, 
  Columns3, 
  Building2, 
  ShieldAlert, 
  Eye, 
  Plus, 
  RotateCw, 
  Trash2, 
  Printer, 
  UserCheck, 
  Wrench, 
  Share2,
  Snowflake,
  CreditCard,
  DoorOpen,
  DoorClosed,
  Package,
} from 'lucide-react';
import { PunterasTab } from './sidebar/PunterasTab';
import { HeladerasTab } from './sidebar/HeladerasTab';
import { CheckoutsTab } from './sidebar/CheckoutsTab';
import { PuertasTab } from './sidebar/PuertasTab';
import { HeavyRacksTab } from './sidebar/HeavyRacksTab';

interface SidebarProps {
  state: AppState;
  activeTab: ActiveTab;
  selection: SelectionState;
  onTabChange: (tab: ActiveTab) => void;
  onSelect: (sel: SelectionState) => void;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onOpenSaveDialog: (action: 'save' | 'designer' | 'share') => void;
  onPrintPDF: () => void;
  onSetGondolaCentralModuleHeight?: (lineIdx: number, modIdx: number, height: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  activeTab,
  selection,
  onTabChange,
  onSelect,
  onUpdateState,
  onOpenSaveDialog,
  onPrintPDF,
  onSetGondolaCentralModuleHeight,
}) => {
  const summary = calculateSummary(state);
  const isSalon = state.activeSection === 'salon';

  // Tabs configuration for Salón (ordered: Espacio/Depósito, Obstáculos, Puertas, Heladeras, Check Outs, G. Pared, G. Central, Punteras, Vista)
  const salonTabs = [
    { id: 'salon-espacio' as ActiveTab, label: 'Espacio', icon: Building2, color: 'text-indigo-400' },
    { id: 'salon-obstaculos' as ActiveTab, label: 'Obstáculos', icon: ShieldAlert, color: 'text-orange-400' },
    { id: 'salon-puertas' as ActiveTab, label: 'Puertas', icon: DoorOpen, color: 'text-blue-400' },
    { id: 'heladeras' as ActiveTab, label: 'Heladeras', icon: Snowflake, color: 'text-cyan-400' },
    { id: 'checkouts' as ActiveTab, label: 'Check Outs', icon: CreditCard, color: 'text-emerald-400' },
    { id: 'gondola-pared' as ActiveTab, label: 'G. Pared', icon: Store, color: 'text-rose-400' },
    { id: 'gondola-central' as ActiveTab, label: 'G. Central', icon: Columns3, color: 'text-pink-400' },
    { id: 'punteras' as ActiveTab, label: 'Punteras', icon: Package, color: 'text-amber-400' },
    { id: 'vista' as ActiveTab, label: 'Vista', icon: Eye, color: 'text-purple-400' },
  ];

  // Tabs configuration for Depósito (ordered: Espacio/Depósito, Obstáculos, Puertas, Estanterías, R. Livianos, R. Pesados, Vista)
  const depositoTabs = [
    { id: 'deposito-espacio' as ActiveTab, label: 'Espacio', icon: Building2, color: 'text-indigo-400' },
    { id: 'deposito-obstaculos' as ActiveTab, label: 'Obstáculos', icon: ShieldAlert, color: 'text-cyan-400' },
    { id: 'deposito-puertas' as ActiveTab, label: 'Puertas', icon: DoorClosed, color: 'text-blue-400' },
    { id: 'estanterias' as ActiveTab, label: 'Estanterías', icon: Layers, color: 'text-sky-400' },
    { id: 'racks-livianos' as ActiveTab, label: 'R. Livianos', icon: Boxes, color: 'text-amber-500' },
    { id: 'racks-pesados' as ActiveTab, label: 'R. Pesados', icon: Layers, color: 'text-orange-500' },
    { id: 'vista' as ActiveTab, label: 'Vista', icon: Eye, color: 'text-purple-400' },
  ];

  const tabs = isSalon ? salonTabs : depositoTabs;

  // ── Handlers Miniracks ──
  const setMinirackHeight = (h: number) => {
    onUpdateState((prev) => ({ ...prev, height: h }));
  };

  const setMinirackDepth = (d: number) => {
    onUpdateState((prev) => ({ ...prev, depth: d }));
  };

  const setMinirackShelves = (s: number) => {
    onUpdateState((prev) => ({
      ...prev,
      shelfCount: s,
      lines: prev.lines.map((l) => ({
        ...l,
        modules: l.modules.map((m) => ({ ...m, sc: s })),
      })),
    }));
  };

  const addMinirackLine = () => {
    onUpdateState((prev) => {
      const newLineMods = [
        { bl: 1.5, sc: prev.shelfCount },
        { bl: 1.5, sc: prev.shelfCount },
      ];
      const tempLine: MinirackLine = { xOff: 0, zOff: 0, rotation: 0, modules: newLineMods };
      const w = realMinirackLineWidth(tempLine);
      const d = prev.depth;
      const spot = findOpenPlacementSpot(prev, w, d);

      const newLine: MinirackLine = {
        xOff: spot.x,
        zOff: spot.z,
        rotation: 0,
        modules: newLineMods,
      };
      return { ...prev, lines: [...prev.lines, newLine] };
    });
    onSelect({ type: 'minirack', idx: state.lines.length });
  };

  const rotateMinirackLine = (idx: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.lines];
      const cur = lines[idx];
      if (!cur) return prev;
      const newRot = ((cur.rotation || 0) + 90) % 360;
      const prospective = { ...cur, rotation: newRot };
      const b = getMinirackLineBounds(prospective, prev.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) {
        return prev;
      }

      const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      const finalBounds = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

      const colliders = getAllColliders(prev, 'minirack', idx);
      if (hasCollision(finalBounds, colliders)) {
        return prev;
      }

      lines[idx] = { ...prospective, xOff: clampedX, zOff: clampedZ };
      return { ...prev, lines };
    });
  };

  const addMinirackModule = (lineIdx: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.lines];
      const cur = lines[lineIdx];
      if (!cur) return prev;
      const lastMod = cur.modules[cur.modules.length - 1];
      const prospective = {
        ...cur,
        modules: [
          ...cur.modules,
          {
            bl: lastMod ? lastMod.bl : 1.5,
            sc: lastMod ? lastMod.sc : prev.shelfCount,
          },
        ],
      };
      const b = getMinirackLineBounds(prospective, prev.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) return prev;

      const shiftedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const shiftedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      prospective.xOff = shiftedX;
      prospective.zOff = shiftedZ;

      const finalBounds = getMinirackLineBounds(prospective, prev.depth);
      const colliders = getAllColliders(prev, 'minirack', lineIdx);
      if (hasCollision(finalBounds, colliders)) return prev;

      lines[lineIdx] = prospective;
      return { ...prev, lines };
    });
  };

  const removeMinirackModule = (lineIdx: number, modIdx: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.lines];
      if (lines[lineIdx].modules.length > 1) {
        lines[lineIdx] = {
          ...lines[lineIdx],
          modules: lines[lineIdx].modules.filter((_, mi) => mi !== modIdx),
        };
      }
      return { ...prev, lines };
    });
  };

  const cycleMinirackBeam = (lineIdx: number, modIdx: number) => {
    const opts = [1.2, 1.5, 1.8];
    onUpdateState((prev) => {
      const lines = [...prev.lines];
      const cur = lines[lineIdx];
      if (!cur) return prev;
      const mod = cur.modules[modIdx];
      const nextIdx = (opts.indexOf(mod.bl) + 1) % opts.length;
      const updatedModules = [...cur.modules];
      updatedModules[modIdx] = { ...mod, bl: opts[nextIdx] };

      const prospective = { ...cur, modules: updatedModules };
      const b = getMinirackLineBounds(prospective, prev.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) return prev;

      const shiftedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const shiftedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      prospective.xOff = shiftedX;
      prospective.zOff = shiftedZ;

      const finalBounds = getMinirackLineBounds(prospective, prev.depth);
      const colliders = getAllColliders(prev, 'minirack', lineIdx);
      if (hasCollision(finalBounds, colliders)) return prev;

      lines[lineIdx] = prospective;
      return { ...prev, lines };
    });
  };

  const changeMinirackModSc = (lineIdx: number, modIdx: number, delta: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.lines];
      const mod = lines[lineIdx].modules[modIdx];
      const updatedModules = [...lines[lineIdx].modules];
      updatedModules[modIdx] = { ...mod, sc: Math.max(1, Math.min(8, mod.sc + delta)) };
      lines[lineIdx] = { ...lines[lineIdx], modules: updatedModules };
      return { ...prev, lines };
    });
  };

  const removeMinirackLine = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx),
    }));
    onSelect({ type: null, idx: null });
  };

  // ── Handlers Estanterías ──
  const setShelfHeight = (h: number) => {
    onUpdateState((prev) => ({ ...prev, shelfHeight: h }));
  };

  const setShelfDepth = (d: number) => {
    onUpdateState((prev) => ({ ...prev, shelfDepth: d }));
  };

  const setShelfLevels = (s: number) => {
    onUpdateState((prev) => ({
      ...prev,
      shelfLevels: s,
      shelfLines: prev.shelfLines.map((l) => ({
        ...l,
        modules: l.modules.map((m) => ({ ...m, sc: s })),
      })),
    }));
  };

  const setShelfCapacity = (cap: number) => {
    onUpdateState((prev) => ({ ...prev, shelfCapacity: cap }));
  };

  const addShelfLine = () => {
    onUpdateState((prev) => {
      const newLineMods = [
        { bl: 0.9, sc: prev.shelfLevels },
        { bl: 0.9, sc: prev.shelfLevels },
      ];
      const tempLine: ShelfLine = { xOff: 0, zOff: 0, rotation: 0, modules: newLineMods };
      const w = realShelfLineWidth(tempLine);
      const d = prev.shelfDepth;
      const spot = findOpenPlacementSpot(prev, w, d);

      const newLine: ShelfLine = {
        xOff: spot.x,
        zOff: spot.z,
        rotation: 0,
        modules: newLineMods,
      };
      return { ...prev, shelfLines: [...prev.shelfLines, newLine] };
    });
    onSelect({ type: 'estanteria', idx: state.shelfLines.length });
  };

  const rotateShelfLine = (idx: number) => {
    onUpdateState((prev) => {
      const shelfLines = [...prev.shelfLines];
      const cur = shelfLines[idx];
      if (!cur) return prev;
      const newRot = ((cur.rotation || 0) + 90) % 360;
      const prospective = { ...cur, rotation: newRot };
      const b = getShelfLineBounds(prospective, prev.shelfDepth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) {
        return prev;
      }

      const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      const finalBounds = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

      const colliders = getAllColliders(prev, 'estanteria', idx);
      if (hasCollision(finalBounds, colliders)) {
        return prev;
      }

      shelfLines[idx] = { ...prospective, xOff: clampedX, zOff: clampedZ };
      return { ...prev, shelfLines };
    });
  };

  const addShelfModule = (lineIdx: number) => {
    onUpdateState((prev) => {
      const shelfLines = [...prev.shelfLines];
      const cur = shelfLines[lineIdx];
      if (!cur) return prev;
      const lastMod = cur.modules[cur.modules.length - 1];
      const prospective = {
        ...cur,
        modules: [
          ...cur.modules,
          {
            bl: lastMod ? lastMod.bl : 0.9,
            sc: lastMod ? lastMod.sc : prev.shelfLevels,
          },
        ],
      };
      const b = getShelfLineBounds(prospective, prev.shelfDepth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) return prev;

      const shiftedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const shiftedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      prospective.xOff = shiftedX;
      prospective.zOff = shiftedZ;

      const finalBounds = getShelfLineBounds(prospective, prev.shelfDepth);
      const colliders = getAllColliders(prev, 'estanteria', lineIdx);
      if (hasCollision(finalBounds, colliders)) return prev;

      shelfLines[lineIdx] = prospective;
      return { ...prev, shelfLines };
    });
  };

  const removeShelfModule = (lineIdx: number, modIdx: number) => {
    onUpdateState((prev) => {
      const shelfLines = [...prev.shelfLines];
      if (shelfLines[lineIdx].modules.length > 1) {
        shelfLines[lineIdx] = {
          ...shelfLines[lineIdx],
          modules: shelfLines[lineIdx].modules.filter((_, mi) => mi !== modIdx),
        };
      }
      return { ...prev, shelfLines };
    });
  };

  const cycleShelfBeam = (lineIdx: number, modIdx: number) => {
    const opts = [0.9, 1.0, 1.2];
    onUpdateState((prev) => {
      const shelfLines = [...prev.shelfLines];
      const cur = shelfLines[lineIdx];
      if (!cur) return prev;
      const mod = cur.modules[modIdx];
      const nextIdx = (opts.indexOf(mod.bl) + 1) % opts.length;
      const updatedModules = [...cur.modules];
      updatedModules[modIdx] = { ...mod, bl: opts[nextIdx] };

      const prospective = { ...cur, modules: updatedModules };
      const b = getShelfLineBounds(prospective, prev.shelfDepth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) return prev;

      const shiftedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const shiftedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      prospective.xOff = shiftedX;
      prospective.zOff = shiftedZ;

      const finalBounds = getShelfLineBounds(prospective, prev.shelfDepth);
      const colliders = getAllColliders(prev, 'estanteria', lineIdx);
      if (hasCollision(finalBounds, colliders)) return prev;

      shelfLines[lineIdx] = prospective;
      return { ...prev, shelfLines };
    });
  };

  const changeShelfModSc = (lineIdx: number, modIdx: number, delta: number) => {
    onUpdateState((prev) => {
      const shelfLines = [...prev.shelfLines];
      const mod = shelfLines[lineIdx].modules[modIdx];
      const updatedModules = [...shelfLines[lineIdx].modules];
      updatedModules[modIdx] = { ...mod, sc: Math.max(2, Math.min(8, (mod.sc ?? prev.shelfLevels) + delta)) };
      shelfLines[lineIdx] = { ...shelfLines[lineIdx], modules: updatedModules };
      return { ...prev, shelfLines };
    });
  };

  const removeShelfLine = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      shelfLines: prev.shelfLines.filter((_, i) => i !== idx),
    }));
    onSelect({ type: null, idx: null });
  };

  // ── Handlers Góndolas de Pared ──
  const setGondolaParedDepth = (d: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gondolaPared: {
        ...prev.gondolaPared,
        depth: d,
        lines: prev.gondolaPared.lines.map((l) => ({
          ...l,
          modules: l.modules.map((m) => ({ ...m, depth: d })),
        })),
      },
    }));
  };

  const setGondolaParedShelves = (s: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gondolaPared: {
        ...prev.gondolaPared,
        shelfCount: s,
        lines: prev.gondolaPared.lines.map((l) => ({
          ...l,
          modules: l.modules.map((m) => ({ ...m, sc: s })),
        })),
      },
    }));
  };

  const addGondolaParedLine = () => {
    onUpdateState((prev) => {
      const newLineMods = [
        {
          bl: 1.0,
          sc: prev.gondolaPared.shelfCount || 5,
          height: prev.gondolaPared.height || 2.0,
          depth: prev.gondolaPared.depth || 0.47,
        },
      ];
      const tempLine: GondolaParedLine = { xOff: 0, zOff: 0, rotation: 0, modules: newLineMods };
      const w = realGondolaParedLineWidth(tempLine);
      const d = prev.gondolaPared.depth || 0.47;
      const spot = findOpenPlacementSpot(prev, w, d);

      const newLine: GondolaParedLine = {
        xOff: spot.x,
        zOff: spot.z,
        rotation: 0,
        modules: newLineMods,
      };
      return {
        ...prev,
        gondolaPared: {
          ...prev.gondolaPared,
          lines: [...prev.gondolaPared.lines, newLine],
        },
      };
    });
    onSelect({ type: 'gondolaPared', idx: state.gondolaPared.lines.length });
  };

  const rotateGondolaParedLine = (idx: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaPared.lines];
      const cur = lines[idx];
      if (!cur) return prev;
      const newRot = ((cur.rotation || 0) + 90) % 360;
      const prospective = { ...cur, rotation: newRot };
      const b = getGondolaParedLineBounds(prospective, prev.gondolaPared.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) {
        return prev;
      }

      const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      const finalBounds = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

      const colliders = getAllColliders(prev, 'gondolaPared', idx);
      if (hasCollision(finalBounds, colliders)) {
        return prev;
      }

      lines[idx] = { ...prospective, xOff: clampedX, zOff: clampedZ };
      return {
        ...prev,
        gondolaPared: { ...prev.gondolaPared, lines },
      };
    });
  };

  const addGondolaParedModule = (lineIdx: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaPared.lines];
      const cur = lines[lineIdx];
      if (!cur) return prev;
      const lastMod = cur.modules[cur.modules.length - 1];
      const prospective = {
        ...cur,
        modules: [
          ...cur.modules,
          {
            bl: lastMod ? lastMod.bl : 1.0,
            sc: lastMod ? lastMod.sc : (prev.gondolaPared.shelfCount || 5),
            height: lastMod?.height || cur.height || prev.gondolaPared.height || 2.0,
            depth: lastMod?.depth || prev.gondolaPared.depth || 0.47,
          },
        ],
      };
      const b = getGondolaParedLineBounds(prospective, prev.gondolaPared.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) return prev;

      const shiftedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const shiftedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      prospective.xOff = shiftedX;
      prospective.zOff = shiftedZ;

      const finalBounds = getGondolaParedLineBounds(prospective, prev.gondolaPared.depth);
      const colliders = getAllColliders(prev, 'gondolaPared', lineIdx);
      if (hasCollision(finalBounds, colliders)) return prev;

      lines[lineIdx] = prospective;
      return {
        ...prev,
        gondolaPared: { ...prev.gondolaPared, lines },
      };
    });
  };

  const removeGondolaParedModule = (lineIdx: number, modIdx: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaPared.lines];
      if (lines[lineIdx].modules.length > 1) {
        lines[lineIdx] = {
          ...lines[lineIdx],
          modules: lines[lineIdx].modules.filter((_, mi) => mi !== modIdx),
        };
      }
      return {
        ...prev,
        gondolaPared: { ...prev.gondolaPared, lines },
      };
    });
  };

  const cycleGondolaParedLength = (lineIdx: number, modIdx: number) => {
    const opts = [0.7, 0.9, 1.0, 1.2];
    onUpdateState((prev) => {
      const lines = [...prev.gondolaPared.lines];
      const cur = lines[lineIdx];
      if (!cur) return prev;
      const mod = cur.modules[modIdx];
      const nextIdx = (opts.indexOf(mod.bl) + 1) % opts.length;
      const updatedModules = [...cur.modules];
      updatedModules[modIdx] = { ...mod, bl: opts[nextIdx] };

      const prospective = { ...cur, modules: updatedModules };
      const b = getGondolaParedLineBounds(prospective, prev.gondolaPared.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) return prev;

      const shiftedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const shiftedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      prospective.xOff = shiftedX;
      prospective.zOff = shiftedZ;

      const finalBounds = getGondolaParedLineBounds(prospective, prev.gondolaPared.depth);
      const colliders = getAllColliders(prev, 'gondolaPared', lineIdx);
      if (hasCollision(finalBounds, colliders)) return prev;

      lines[lineIdx] = prospective;
      return {
        ...prev,
        gondolaPared: { ...prev.gondolaPared, lines },
      };
    });
  };

  const changeGondolaParedSc = (lineIdx: number, modIdx: number, delta: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaPared.lines];
      const mod = lines[lineIdx].modules[modIdx];
      const updatedModules = [...lines[lineIdx].modules];
      updatedModules[modIdx] = { ...mod, sc: Math.max(2, Math.min(8, (mod.sc || 5) + delta)) };
      lines[lineIdx] = { ...lines[lineIdx], modules: updatedModules };
      return {
        ...prev,
        gondolaPared: { ...prev.gondolaPared, lines },
      };
    });
  };

  const removeGondolaParedLine = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gondolaPared: {
        ...prev.gondolaPared,
        lines: prev.gondolaPared.lines.filter((_, i) => i !== idx),
      },
    }));
    onSelect({ type: null, idx: null });
  };

  // ── Handlers Góndolas Centrales ──
  const setGondolaCentralHeight = (h: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gondolaCentral: {
        ...prev.gondolaCentral,
        height: h,
        lines: prev.gondolaCentral.lines.map((l) => ({
          ...l,
          height: h,
          modules: l.modules.map((m) => ({ ...m, height: h })),
        })),
      },
    }));
  };

  const setGondolaCentralModuleHeight = (lineIdx: number, modIdx: number, h: number) => {
    if (onSetGondolaCentralModuleHeight) {
      onSetGondolaCentralModuleHeight(lineIdx, modIdx, h);
    } else {
      onUpdateState((prev) => {
        const lines = [...prev.gondolaCentral.lines];
        const line = lines[lineIdx];
        if (!line) return prev;
        const updatedModules = [...line.modules];
        updatedModules[modIdx] = { ...updatedModules[modIdx], height: h };
        const maxH = updatedModules.reduce((max, m) => Math.max(max, m.height || h), h);
        lines[lineIdx] = { ...line, height: maxH, modules: updatedModules };
        return {
          ...prev,
          gondolaCentral: { ...prev.gondolaCentral, lines },
        };
      });
    }
  };

  const setGondolaCentralModuleDepth = (lineIdx: number, modIdx: number, d: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaCentral.lines];
      const line = lines[lineIdx];
      if (!line) return prev;
      const updatedModules = [...line.modules];
      updatedModules[modIdx] = { ...updatedModules[modIdx], depthA: d, depthB: d };
      lines[lineIdx] = { ...line, modules: updatedModules };
      return {
        ...prev,
        gondolaCentral: { ...prev.gondolaCentral, lines },
      };
    });
  };

  const setGondolaParedModuleHeight = (lineIdx: number, modIdx: number, h: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaPared.lines];
      const line = lines[lineIdx];
      if (!line) return prev;
      const updatedModules = [...line.modules];
      updatedModules[modIdx] = { ...updatedModules[modIdx], height: h };
      const maxH = updatedModules.reduce((max, m) => Math.max(max, m.height || h), h);
      lines[lineIdx] = { ...line, height: maxH, modules: updatedModules };
      return {
        ...prev,
        gondolaPared: { ...prev.gondolaPared, lines },
      };
    });
  };

  const setGondolaParedModuleDepth = (lineIdx: number, modIdx: number, d: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaPared.lines];
      const line = lines[lineIdx];
      if (!line) return prev;
      const updatedModules = [...line.modules];
      updatedModules[modIdx] = { ...updatedModules[modIdx], depth: d };
      lines[lineIdx] = { ...line, modules: updatedModules };
      return {
        ...prev,
        gondolaPared: { ...prev.gondolaPared, lines },
      };
    });
  };

  const setGondolaCentralDepth = (d: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gondolaCentral: {
        ...prev.gondolaCentral,
        depth: d,
        lines: prev.gondolaCentral.lines.map((l) => ({
          ...l,
          modules: l.modules.map((m) => ({ ...m, depthA: d, depthB: d })),
        })),
      },
    }));
  };

  const setGondolaCentralShelves = (s: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gondolaCentral: {
        ...prev.gondolaCentral,
        shelfCount: s,
        lines: prev.gondolaCentral.lines.map((l) => ({
          ...l,
          modules: l.modules.map((m) => ({ ...m, scA: s, scB: s })),
        })),
      },
    }));
  };

  const addGondolaCentralLine = () => {
    onUpdateState((prev) => {
      const newLineMods = [
        {
          bl: 1.0,
          height: prev.gondolaCentral.height || 1.6,
          scA: prev.gondolaCentral.shelfCount || 3,
          scB: prev.gondolaCentral.shelfCount || 3,
          depthA: prev.gondolaCentral.depth || 0.47,
          depthB: prev.gondolaCentral.depth || 0.47,
        },
      ];
      const tempLine: GondolaCentralLine = {
        xOff: 0,
        zOff: 0,
        rotation: 0,
        height: prev.gondolaCentral.height,
        modules: newLineMods,
      };
      const w = realGondolaCentralLineWidth(tempLine);
      const d = prev.gondolaCentral.depth * 2;
      const spot = findOpenPlacementSpot(prev, w, d);

      const newLine: GondolaCentralLine = {
        xOff: spot.x,
        zOff: spot.z,
        rotation: 0,
        height: prev.gondolaCentral.height,
        modules: newLineMods,
      };
      return {
        ...prev,
        gondolaCentral: {
          ...prev.gondolaCentral,
          lines: [...prev.gondolaCentral.lines, newLine],
        },
      };
    });
    onSelect({ type: 'gondolaCentral', idx: state.gondolaCentral.lines.length });
  };

  const rotateGondolaCentralLine = (idx: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaCentral.lines];
      const cur = lines[idx];
      if (!cur) return prev;
      const newRot = ((cur.rotation || 0) + 90) % 360;
      const prospective = { ...cur, rotation: newRot };
      const b = getGondolaCentralLineBounds(prospective, prev.gondolaCentral.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) {
        return prev;
      }

      const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      const finalBounds = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

      const colliders = getAllColliders(prev, 'gondolaCentral', idx);
      if (hasCollision(finalBounds, colliders)) {
        return prev;
      }

      lines[idx] = { ...prospective, xOff: clampedX, zOff: clampedZ };
      return {
        ...prev,
        gondolaCentral: { ...prev.gondolaCentral, lines },
      };
    });
  };

  const addGondolaCentralModule = (lineIdx: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaCentral.lines];
      const cur = lines[lineIdx];
      if (!cur) return prev;
      const lastMod = cur.modules[cur.modules.length - 1];
      const prospective = {
        ...cur,
        modules: [
          ...cur.modules,
          {
            bl: lastMod ? lastMod.bl : 1.0,
            height: lastMod?.height || cur.height || prev.gondolaCentral.height || 1.6,
            scA: lastMod ? lastMod.scA : (prev.gondolaCentral.shelfCount || 3),
            scB: lastMod ? lastMod.scB : (prev.gondolaCentral.shelfCount || 3),
            depthA: lastMod?.depthA || prev.gondolaCentral.depth || 0.47,
            depthB: lastMod?.depthB || prev.gondolaCentral.depth || 0.47,
          },
        ],
      };
      const b = getGondolaCentralLineBounds(prospective, prev.gondolaCentral.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) return prev;

      const shiftedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const shiftedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      prospective.xOff = shiftedX;
      prospective.zOff = shiftedZ;

      const finalBounds = getGondolaCentralLineBounds(prospective, prev.gondolaCentral.depth);
      const colliders = getAllColliders(prev, 'gondolaCentral', lineIdx);
      if (hasCollision(finalBounds, colliders)) return prev;

      lines[lineIdx] = prospective;
      return {
        ...prev,
        gondolaCentral: { ...prev.gondolaCentral, lines },
      };
    });
  };

  const removeGondolaCentralModule = (lineIdx: number, modIdx: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaCentral.lines];
      if (lines[lineIdx].modules.length > 1) {
        lines[lineIdx] = {
          ...lines[lineIdx],
          modules: lines[lineIdx].modules.filter((_, mi) => mi !== modIdx),
        };
      }
      return {
        ...prev,
        gondolaCentral: { ...prev.gondolaCentral, lines },
      };
    });
  };

  const cycleGondolaCentralLength = (lineIdx: number, modIdx: number) => {
    const opts = [0.7, 0.9, 1.0, 1.2];
    onUpdateState((prev) => {
      const lines = [...prev.gondolaCentral.lines];
      const cur = lines[lineIdx];
      if (!cur) return prev;
      const mod = cur.modules[modIdx];
      const nextIdx = (opts.indexOf(mod.bl) + 1) % opts.length;
      const updatedModules = [...cur.modules];
      updatedModules[modIdx] = { ...mod, bl: opts[nextIdx] };

      const prospective = { ...cur, modules: updatedModules };
      const b = getGondolaCentralLineBounds(prospective, prev.gondolaCentral.depth);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      if (w > prev.warehouse.width || d > prev.warehouse.depth) return prev;

      const shiftedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.xOff));
      const shiftedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.zOff));
      prospective.xOff = shiftedX;
      prospective.zOff = shiftedZ;

      const finalBounds = getGondolaCentralLineBounds(prospective, prev.gondolaCentral.depth);
      const colliders = getAllColliders(prev, 'gondolaCentral', lineIdx);
      if (hasCollision(finalBounds, colliders)) return prev;

      lines[lineIdx] = prospective;
      return {
        ...prev,
        gondolaCentral: { ...prev.gondolaCentral, lines },
      };
    });
  };

  const changeGondolaCentralScA = (lineIdx: number, modIdx: number, delta: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaCentral.lines];
      const mod = lines[lineIdx].modules[modIdx];
      const updatedModules = [...lines[lineIdx].modules];
      updatedModules[modIdx] = { ...mod, scA: Math.max(2, Math.min(8, (mod.scA || 3) + delta)) };
      lines[lineIdx] = { ...lines[lineIdx], modules: updatedModules };
      return {
        ...prev,
        gondolaCentral: { ...prev.gondolaCentral, lines },
      };
    });
  };

  const changeGondolaCentralScB = (lineIdx: number, modIdx: number, delta: number) => {
    onUpdateState((prev) => {
      const lines = [...prev.gondolaCentral.lines];
      const mod = lines[lineIdx].modules[modIdx];
      const updatedModules = [...lines[lineIdx].modules];
      updatedModules[modIdx] = { ...mod, scB: Math.max(2, Math.min(8, (mod.scB || 3) + delta)) };
      lines[lineIdx] = { ...lines[lineIdx], modules: updatedModules };
      return {
        ...prev,
        gondolaCentral: { ...prev.gondolaCentral, lines },
      };
    });
  };

  const removeGondolaCentralLine = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gondolaCentral: {
        ...prev.gondolaCentral,
        lines: prev.gondolaCentral.lines.filter((_, i) => i !== idx),
      },
    }));
    onSelect({ type: null, idx: null });
  };

  // ── Obstacles Handlers ──
  const addObstacle = (type: 'column' | 'opening') => {
    onUpdateState((prev) => {
      const w = type === 'column' ? 0.4 : 2.0;
      const d = type === 'column' ? 0.4 : 0.4;
      const spot = findOpenPlacementSpot(prev, w, d);
      const newObs: Obstacle =
        type === 'column'
          ? { id: Date.now(), type: 'column', x: spot.x, z: spot.z, w: 0.4, d: 0.4 }
          : { id: Date.now(), type: 'opening', x: spot.x, z: 0.0, w: 2.0, fh: 2.5, rotation: 0 };
      return { ...prev, obstacles: [...prev.obstacles, newObs] };
    });
    onSelect({ type: 'obstacle', idx: state.obstacles.length });
  };

  const removeObstacle = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      obstacles: prev.obstacles.filter((_, i) => i !== idx),
    }));
    onSelect({ type: null, idx: null });
  };

  const rotateObstacle = (idx: number) => {
    onUpdateState((prev) => {
      const obstacles = [...prev.obstacles];
      const cur = obstacles[idx];
      if (!cur || cur.type !== 'opening') return prev;
      const newRot = cur.rotation === 0 ? 90 : 0;
      const prospective = { ...cur, rotation: newRot };
      const b = getObstacleBounds(prospective, prev.warehouse.height);
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;

      const clampedX = Math.max(0, Math.min(snap10(prev.warehouse.width - w), cur.x));
      const clampedZ = Math.max(0, Math.min(snap10(prev.warehouse.depth - d), cur.z));
      const finalBounds = { x0: clampedX, x1: clampedX + w, z0: clampedZ, z1: clampedZ + d };

      const colliders = getAllColliders(prev, 'obstacle', idx);
      if (hasCollision(finalBounds, colliders)) {
        return prev;
      }

      obstacles[idx] = { ...prospective, x: clampedX, z: clampedZ };
      return { ...prev, obstacles };
    });
  };

  return (
    <aside
      id="sidebar"
      className="w-96 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden select-none"
    >
      {/* Brand Header */}
      <div className="p-4 pb-2 flex-shrink-0 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-black text-slate-950 shadow-md">
              3D
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-100 tracking-tight">Configurador 3D</h1>
              <p className="text-[11px] text-slate-400 font-medium">
                {isSalon ? 'Salón Comercial y Retail' : 'Depósito y Logística Industrial'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Section Switcher: Salón vs Depósito */}
      <div className="p-2 bg-slate-950/90 border-b border-slate-800">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              onUpdateState((prev) => ({ ...prev, activeSection: 'salon' }));
              onTabChange('gondola-pared');
            }}
            className={`py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isSalon
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-rose-200" />
            <span>Salón</span>
          </button>

          <button
            onClick={() => {
              onUpdateState((prev) => ({ ...prev, activeSection: 'deposito' }));
              onTabChange('racks-livianos');
            }}
            className={`py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              !isSalon
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-200" />
            <span>Depósito</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex border-b border-slate-800 flex-shrink-0 bg-slate-950/70 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = 
            activeTab === tab.id ||
            (tab.id === 'salon-espacio' && activeTab === 'deposito') ||
            (tab.id === 'deposito-espacio' && activeTab === 'deposito') ||
            (tab.id === 'salon-obstaculos' && activeTab === 'obstaculos') ||
            (tab.id === 'deposito-obstaculos' && activeTab === 'obstaculos') ||
            (tab.id === 'racks-livianos' && activeTab === 'miniracks');

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[68px] py-2.5 px-1.5 flex flex-col items-center gap-1 text-[11px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? isSalon 
                    ? 'border-rose-500 text-slate-100 bg-slate-800/60'
                    : 'border-blue-500 text-slate-100 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels Body Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* ── TAB 1: RACKS LIVIANOS (MINIRACKS) ── */}
        {(activeTab === 'miniracks' || activeTab === 'racks-livianos') && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Parámetros Minirack
              </span>

              {/* Altura */}
              <div className="mb-3">
                <label className="text-slate-400 mb-1.5 flex justify-between">
                  <span>Altura:</span>
                  <strong className="text-amber-400 font-bold">{state.height} m</strong>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[2.0, 2.4, 3.0].map((h) => (
                    <button
                      key={h}
                      onClick={() => setMinirackHeight(h)}
                      className={`py-1.5 rounded-lg border font-semibold transition-all ${
                        state.height === h
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-800/40'
                      }`}
                    >
                      {h} m
                    </button>
                  ))}
                </div>
              </div>

              {/* Profundidad */}
              <div className="mb-3">
                <label className="text-slate-400 mb-1.5 flex justify-between">
                  <span>Profundidad:</span>
                  <strong className="text-amber-400 font-bold">{state.depth} m</strong>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[0.6, 0.9].map((d) => (
                    <button
                      key={d}
                      onClick={() => setMinirackDepth(d)}
                      className={`py-1.5 rounded-lg border font-semibold transition-all ${
                        state.depth === d
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-800/40'
                      }`}
                    >
                      {d} m
                    </button>
                  ))}
                </div>
              </div>

              {/* Estantes por defecto */}
              <div className="mb-3">
                <label className="text-slate-400 mb-1.5 flex justify-between">
                  <span>Niveles de estantes:</span>
                  <strong className="text-amber-400 font-bold">{state.shelfCount}</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={state.shelfCount}
                  onChange={(e) => setMinirackShelves(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Líneas de Miniracks
                </span>
                <button
                  onClick={addMinirackLine}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs transition-all shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Línea
                </button>
              </div>

              {/* Minirack lines list */}
              <div className="space-y-2.5">
                {state.lines.map((line, li) => {
                  const isSel = selection.type === 'minirack' && selection.idx === li;
                  return (
                    <div
                      key={li}
                      onClick={() => onSelect({ type: 'minirack', idx: li })}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSel
                          ? 'border-amber-500 bg-amber-950/20 shadow-md ring-1 ring-amber-500/30'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-slate-200">Línea Minirack {li + 1}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rotateMinirackLine(li);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-400 border border-slate-800 rounded bg-slate-900"
                            title="Rotar 90°"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                          {state.lines.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMinirackLine(li);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 border border-slate-800 rounded bg-slate-900"
                              title="Eliminar línea"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 mb-2">
                        X: <strong className="text-slate-300">{line.xOff.toFixed(1)}m</strong> · Z:{' '}
                        <strong className="text-slate-300">{line.zOff.toFixed(1)}m</strong> · Largo:{' '}
                        <strong className="text-amber-400">{realMinirackLineWidth(line).toFixed(2)}m</strong>
                      </div>

                      {/* Module chips */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {line.modules.map((m, mi) => (
                          <div
                            key={mi}
                            className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-amber-500/50 px-2 py-1 rounded-lg text-slate-300 font-semibold"
                          >
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                cycleMinirackBeam(li, mi);
                              }}
                              className="hover:text-amber-400 cursor-pointer"
                              title="Clic para cambiar largo"
                            >
                              {m.bl}m
                            </span>
                            <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1 ml-0.5 text-[10px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeMinirackModSc(li, mi, -1);
                                }}
                                className="text-slate-500 hover:text-amber-400 font-bold px-0.5"
                              >
                                −
                              </button>
                              <span className="text-amber-400 font-mono">↕{m.sc}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeMinirackModSc(li, mi, 1);
                                }}
                                className="text-slate-500 hover:text-amber-400 font-bold px-0.5"
                              >
                                +
                              </button>
                            </div>
                            {line.modules.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMinirackModule(li, mi);
                                }}
                                className="text-slate-500 hover:text-rose-400 ml-1 text-xs"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addMinirackModule(li);
                          }}
                          className="px-2 py-1 border border-dashed border-slate-700 hover:border-amber-400 text-slate-400 hover:text-amber-400 rounded-lg text-xs font-bold"
                        >
                          ＋ Mód.
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: ESTANTERÍAS ── */}
        {activeTab === 'estanterias' && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Parámetros Estantería Metálica
              </span>

              {/* Altura */}
              <div className="mb-3">
                <label className="text-slate-400 mb-1.5 flex justify-between">
                  <span>Altura:</span>
                  <strong className="text-sky-400 font-bold">{state.shelfHeight} m</strong>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[1.8, 2.0, 2.4, 3.0].map((h) => (
                    <button
                      key={h}
                      onClick={() => setShelfHeight(h)}
                      className={`py-1.5 rounded-lg border font-semibold transition-all ${
                        state.shelfHeight === h
                          ? 'bg-sky-500 border-sky-500 text-slate-950'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-800/40'
                      }`}
                    >
                      {h} m
                    </button>
                  ))}
                </div>
              </div>

              {/* Profundidad */}
              <div className="mb-3">
                <label className="text-slate-400 mb-1.5 flex justify-between">
                  <span>Profundidad:</span>
                  <strong className="text-sky-400 font-bold">{state.shelfDepth} m</strong>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[0.3, 0.42, 0.6].map((d) => (
                    <button
                      key={d}
                      onClick={() => setShelfDepth(d)}
                      className={`py-1.5 rounded-lg border font-semibold transition-all ${
                        state.shelfDepth === d
                          ? 'bg-sky-500 border-sky-500 text-slate-950'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-800/40'
                      }`}
                    >
                      {d} m
                    </button>
                  ))}
                </div>
              </div>

              {/* Niveles */}
              <div className="mb-3">
                <label className="text-slate-400 mb-1.5 flex justify-between">
                  <span>Bandejas por módulo:</span>
                  <strong className="text-sky-400 font-bold">{state.shelfLevels}</strong>
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={state.shelfLevels}
                  onChange={(e) => setShelfLevels(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Capacidad */}
              <div className="mb-3">
                <label className="text-slate-400 mb-1.5 flex justify-between">
                  <span>Carga por bandeja:</span>
                  <strong className="text-sky-400 font-bold">{state.shelfCapacity} kg</strong>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[50, 80, 100, 120].map((c) => (
                    <button
                      key={c}
                      onClick={() => setShelfCapacity(c)}
                      className={`py-1.5 rounded-lg border font-semibold transition-all ${
                        state.shelfCapacity === c
                          ? 'bg-sky-500 border-sky-500 text-slate-950'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-800/40'
                      }`}
                    >
                      {c} kg
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Líneas de Estanterías
                </span>
                <button
                  onClick={addShelfLine}
                  className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs transition-all shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Línea
                </button>
              </div>

              {/* Shelf lines list */}
              <div className="space-y-2.5">
                {state.shelfLines.map((line, si) => {
                  const isSel = selection.type === 'estanteria' && selection.idx === si;
                  return (
                    <div
                      key={si}
                      onClick={() => onSelect({ type: 'estanteria', idx: si })}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSel
                          ? 'border-sky-500 bg-sky-950/20 shadow-md ring-1 ring-sky-500/30'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-slate-200">Estantería {si + 1}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rotateShelfLine(si);
                            }}
                            className="p-1 text-slate-400 hover:text-sky-400 border border-slate-800 rounded bg-slate-900"
                            title="Rotar 90°"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeShelfLine(si);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 border border-slate-800 rounded bg-slate-900"
                            title="Eliminar línea"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 mb-2">
                        X: <strong className="text-slate-300">{line.xOff.toFixed(1)}m</strong> · Z:{' '}
                        <strong className="text-slate-300">{line.zOff.toFixed(1)}m</strong> · Largo:{' '}
                        <strong className="text-sky-400">{realShelfLineWidth(line).toFixed(2)}m</strong>
                      </div>

                      {/* Module chips */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {line.modules.map((m, mi) => (
                          <div
                            key={mi}
                            className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-sky-500/50 px-2 py-1 rounded-lg text-slate-300 font-semibold"
                          >
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                cycleShelfBeam(si, mi);
                              }}
                              className="hover:text-sky-400 cursor-pointer"
                              title="Clic para cambiar ancho"
                            >
                              {m.bl}m
                            </span>
                            <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1 ml-0.5 text-[10px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeShelfModSc(si, mi, -1);
                                }}
                                className="text-slate-500 hover:text-sky-400 font-bold px-0.5"
                              >
                                −
                              </button>
                              <span className="text-sky-400 font-mono">↕{m.sc}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeShelfModSc(si, mi, 1);
                                }}
                                className="text-slate-500 hover:text-sky-400 font-bold px-0.5"
                              >
                                +
                              </button>
                            </div>
                            {line.modules.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeShelfModule(si, mi);
                                }}
                                className="text-slate-500 hover:text-rose-400 ml-1 text-xs"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addShelfModule(si);
                          }}
                          className="px-2 py-1 border border-dashed border-slate-700 hover:border-sky-400 text-slate-400 hover:text-sky-400 rounded-lg text-xs font-bold"
                        >
                          ＋ Mód.
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: GÓNDOLAS DE PARED ── */}
        {activeTab === 'gondola-pared' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Líneas Góndolas de Pared
              </span>
              <button
                onClick={addGondolaParedLine}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5" /> Línea
              </button>
            </div>

            {/* Gondola Pared lines list */}
            <div className="space-y-2.5">
              {state.gondolaPared.lines.map((line, gli) => {
                const isSel = selection.type === 'gondolaPared' && selection.idx === gli;
                const rot = ((line.rotation || 0) % 360 + 360) % 360;
                return (
                  <div
                    key={gli}
                    onClick={() => onSelect({ type: 'gondolaPared', idx: gli })}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSel
                        ? 'border-rose-500 bg-rose-950/20 shadow-md ring-1 ring-rose-500/30'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-slate-200">Góndola Pared {gli + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            rotateGondolaParedLine(gli);
                          }}
                          className="px-2 py-1 text-[11px] font-bold text-rose-300 hover:text-white border border-slate-800 hover:border-rose-500 rounded bg-slate-900 flex items-center gap-1 transition-all"
                          title="Rotar 90° (0°, 90°, 180°, 270°)"
                        >
                          <RotateCw className="w-3 h-3 text-rose-400" />
                          <span>{rot}°</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGondolaParedLine(gli);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 border border-slate-800 rounded bg-slate-900"
                          title="Eliminar línea"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mb-2">
                      X: <strong className="text-slate-300">{line.xOff.toFixed(1)}m</strong> · Z:{' '}
                      <strong className="text-slate-300">{line.zOff.toFixed(1)}m</strong> · Largo:{' '}
                      <strong className="text-rose-400">{realGondolaParedLineWidth(line).toFixed(2)}m</strong>
                    </div>

                    {/* Module chips with individual height, depth, shelf count */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {line.modules.map((m, mi) => (
                        <div
                          key={mi}
                          className="flex flex-col gap-1.5 bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-2 rounded-lg text-slate-300 font-semibold"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                cycleGondolaParedLength(gli, mi);
                              }}
                              className="hover:text-rose-400 cursor-pointer text-xs"
                              title="Clic para cambiar largo (0.7, 0.9, 1.0, 1.2m)"
                            >
                              {m.bl}m
                            </span>
                            {line.modules.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGondolaParedModule(gli, mi);
                                }}
                                className="text-slate-500 hover:text-rose-400 text-xs"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {/* Selector de Altura del Módulo */}
                          <div className="flex items-center justify-between gap-1 text-[9px] bg-slate-950/70 px-1.5 py-1 rounded border border-slate-800">
                            <span className="text-slate-400 font-medium">Alto:</span>
                            <div className="flex items-center gap-0.5">
                              {[1.6, 1.75, 2.0, 2.2].map((hOpt) => {
                                const curH = m.height || line.height || state.gondolaPared.height || 2.0;
                                const isSelH = curH === hOpt;
                                return (
                                  <button
                                    key={hOpt}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGondolaParedModuleHeight(gli, mi, hOpt);
                                    }}
                                    className={`px-1 py-0.5 rounded font-bold transition-all ${
                                      isSelH
                                        ? 'bg-rose-500 text-white shadow-sm ring-1 ring-rose-300'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                    }`}
                                    title={`Fijar altura ${hOpt}m`}
                                  >
                                    {hOpt}m
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Selector de Profundidad del Módulo */}
                          <div className="flex items-center justify-between gap-1 text-[9px] bg-slate-950/70 px-1.5 py-1 rounded border border-slate-800">
                            <span className="text-slate-400 font-medium">Prof:</span>
                            <div className="flex items-center gap-0.5">
                              {[0.38, 0.47].map((dOpt) => {
                                const curD = m.depth || state.gondolaPared.depth || 0.47;
                                const isSelD = curD === dOpt;
                                return (
                                  <button
                                    key={dOpt}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGondolaParedModuleDepth(gli, mi, dOpt);
                                    }}
                                    className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                                      isSelD
                                        ? 'bg-rose-500 text-white shadow-sm ring-1 ring-rose-300'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                    }`}
                                    title={`Fijar profundidad ${dOpt}m`}
                                  >
                                    {dOpt}m
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Selector de Estantes */}
                          <div className="flex items-center justify-between gap-1 text-[10px]">
                            <span className="text-slate-400 font-medium">Estantes:</span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeGondolaParedSc(gli, mi, -1);
                                }}
                                className="text-slate-500 hover:text-rose-400 font-bold px-1"
                              >
                                −
                              </button>
                              <span className="text-rose-400 font-mono font-bold">{m.sc || 5}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeGondolaParedSc(gli, mi, 1);
                                }}
                                className="text-slate-500 hover:text-rose-400 font-bold px-1"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addGondolaParedModule(gli);
                        }}
                        className="px-2.5 py-2 border border-dashed border-slate-700 hover:border-rose-400 text-slate-400 hover:text-rose-400 rounded-lg text-xs font-bold self-stretch flex items-center justify-center"
                        title="Agregar módulo contiguo (copia altura, estantes y prof)"
                      >
                        ＋ Mód.
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* ── TAB 4: GÓNDOLAS CENTRALES ── */}
        {activeTab === 'gondola-central' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Líneas Góndolas Centrales
              </span>
              <button
                onClick={addGondolaCentralLine}
                className="bg-pink-500 hover:bg-pink-600 text-slate-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5" /> Línea Doble
              </button>
            </div>

            {/* Gondola Central lines list */}
            <div className="space-y-2.5">
              {state.gondolaCentral.lines.map((line, gcli) => {
                const isSel = selection.type === 'gondolaCentral' && selection.idx === gcli;
                const rot = ((line.rotation || 0) % 360 + 360) % 360;
                return (
                  <div
                    key={gcli}
                    onClick={() => onSelect({ type: 'gondolaCentral', idx: gcli })}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSel
                        ? 'border-pink-500 bg-pink-950/20 shadow-md ring-1 ring-pink-500/30'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-slate-200">Góndola Central {gcli + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            rotateGondolaCentralLine(gcli);
                          }}
                          className="px-2 py-1 text-[11px] font-bold text-pink-300 hover:text-white border border-slate-800 hover:border-pink-500 rounded bg-slate-900 flex items-center gap-1 transition-all"
                          title="Rotar 90° (0°, 90°, 180°, 270°)"
                        >
                          <RotateCw className="w-3 h-3 text-pink-400" />
                          <span>{rot}°</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGondolaCentralLine(gcli);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 border border-slate-800 rounded bg-slate-900"
                          title="Eliminar línea"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mb-2">
                      X: <strong className="text-slate-300">{line.xOff.toFixed(1)}m</strong> · Z:{' '}
                      <strong className="text-slate-300">{line.zOff.toFixed(1)}m</strong> · Largo:{' '}
                      <strong className="text-pink-400">{realGondolaCentralLineWidth(line).toFixed(2)}m</strong>
                    </div>

                    {/* Module chips with individual height, depth, Side A & Side B controls */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {line.modules.map((m, mi) => (
                        <div
                          key={mi}
                          className="flex flex-col gap-1.5 bg-slate-900 border border-slate-800 hover:border-pink-500/50 p-2 rounded-lg text-slate-300 font-semibold"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                cycleGondolaCentralLength(gcli, mi);
                              }}
                              className="hover:text-pink-400 cursor-pointer text-xs"
                              title="Clic para cambiar largo"
                            >
                              {m.bl}m
                            </span>
                            {line.modules.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGondolaCentralModule(gcli, mi);
                                }}
                                className="text-slate-500 hover:text-rose-400 text-xs"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {/* Selector de Altura del Módulo Individual */}
                          <div className="flex items-center justify-between gap-1 text-[9px] bg-slate-950/70 px-1.5 py-1 rounded border border-slate-800">
                            <span className="text-slate-400 font-medium">Alto:</span>
                            <div className="flex items-center gap-0.5">
                              {[1.2, 1.6, 1.75, 2.0].map((hOpt) => {
                                const curModH = m.height || line.height || state.gondolaCentral.height || 1.6;
                                const isSelH = curModH === hOpt;
                                return (
                                  <button
                                    key={hOpt}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGondolaCentralModuleHeight(gcli, mi, hOpt);
                                    }}
                                    className={`px-1 py-0.5 rounded font-bold transition-all ${
                                      isSelH
                                        ? 'bg-pink-500 text-slate-950 shadow-sm ring-1 ring-pink-300'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                    }`}
                                    title={`Fijar altura ${hOpt}m`}
                                  >
                                    {hOpt}m
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Selector de Profundidad del Módulo */}
                          <div className="flex items-center justify-between gap-1 text-[9px] bg-slate-950/70 px-1.5 py-1 rounded border border-slate-800">
                            <span className="text-slate-400 font-medium">Prof:</span>
                            <div className="flex items-center gap-0.5">
                              {[0.38, 0.47].map((dOpt) => {
                                const curD = m.depthA || state.gondolaCentral.depth || 0.47;
                                const isSelD = curD === dOpt;
                                return (
                                  <button
                                    key={dOpt}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGondolaCentralModuleDepth(gcli, mi, dOpt);
                                    }}
                                    className={`px-1 py-0.5 rounded font-bold transition-all ${
                                      isSelD
                                        ? 'bg-pink-500 text-slate-950 shadow-sm ring-1 ring-pink-300'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                    }`}
                                    title={`Fijar profundidad ${dOpt}m`}
                                  >
                                    {dOpt}m
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            {/* Side A */}
                            <div className="flex items-center gap-0.5">
                              <span className="text-rose-400 font-bold">A:</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeGondolaCentralScA(gcli, mi, -1);
                                }}
                                className="text-slate-500 hover:text-rose-400 font-bold px-0.5"
                              >
                                −
                              </button>
                              <span className="text-slate-200 font-mono">{m.scA || 3}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeGondolaCentralScA(gcli, mi, 1);
                                }}
                                className="text-slate-500 hover:text-rose-400 font-bold px-0.5"
                              >
                                +
                              </button>
                            </div>

                            {/* Side B */}
                            <div className="flex items-center gap-0.5">
                              <span className="text-sky-400 font-bold">B:</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeGondolaCentralScB(gcli, mi, -1);
                                }}
                                className="text-slate-500 hover:text-sky-400 font-bold px-0.5"
                              >
                                −
                              </button>
                              <span className="text-slate-200 font-mono">{m.scB || 3}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changeGondolaCentralScB(gcli, mi, 1);
                                }}
                                className="text-slate-500 hover:text-sky-400 font-bold px-0.5"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addGondolaCentralModule(gcli);
                        }}
                        className="px-2.5 py-2 border border-dashed border-slate-700 hover:border-pink-400 text-slate-400 hover:text-pink-400 rounded-lg text-xs font-bold self-stretch flex items-center justify-center"
                        title="Agregar módulo contiguo (copia altura, estantes y prof)"
                      >
                        ＋ Mód.
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB: ESPACIO (SALÓN O DEPÓSITO) ── */}
        {(activeTab === 'deposito' || activeTab === 'salon-espacio' || activeTab === 'deposito-espacio') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-slate-200">
                  {isSalon ? 'Mostrar perímetro del Salón' : 'Mostrar nave del Depósito'}
                </div>
                <div className="text-[11px] text-slate-400">Visualizar paredes y límites físicos</div>
              </div>
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    warehouse: { ...prev.warehouse, enabled: !prev.warehouse.enabled },
                  }))
                }
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  state.warehouse.enabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                    state.warehouse.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {state.warehouse.enabled && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {isSalon ? 'Dimensiones del Salón Comercial (m)' : 'Dimensiones de la Nave Industrial (m)'}
                </span>

                <div>
                  <label className="text-slate-400 mb-1 flex justify-between">
                    <span>Ancho (X):</span>
                    <strong className="text-amber-400 font-bold">{state.warehouse.width.toFixed(1)} m</strong>
                  </label>
                  <input
                    type="range"
                    min={Math.max(4, Math.ceil((summary.enclosingWidth || 4) * 10) / 10)}
                    max="80"
                    step="0.5"
                    value={state.warehouse.width}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const minW = Math.max(4, Math.ceil((summary.enclosingWidth || 4) * 10) / 10);
                      onUpdateState((prev) => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, width: Math.max(minW, val) },
                      }));
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 flex justify-between">
                    <span>Largo / Profundidad (Z):</span>
                    <strong className="text-amber-400 font-bold">{state.warehouse.depth.toFixed(1)} m</strong>
                  </label>
                  <input
                    type="range"
                    min={Math.max(4, Math.ceil((summary.enclosingDepth || 4) * 10) / 10)}
                    max="80"
                    step="0.5"
                    value={state.warehouse.depth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const minD = Math.max(4, Math.ceil((summary.enclosingDepth || 4) * 10) / 10);
                      onUpdateState((prev) => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, depth: Math.max(minD, val) },
                      }));
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 flex justify-between">
                    <span>Altura libre (Y):</span>
                    <strong className="text-amber-400 font-bold">{state.warehouse.height.toFixed(1)} m</strong>
                  </label>
                  <input
                    type="range"
                    min="2.5"
                    max="15"
                    step="0.1"
                    value={state.warehouse.height}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, height: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Pintura y Opacidad de Paredes
                  </span>
                  <div className="flex gap-2 items-center mb-3">
                    {[
                      { name: 'Azul Titufaris', hex: '#1e40af' },
                      { name: 'Gris Chapa', hex: '#64748b' },
                      { name: 'Grafito', hex: '#334155' },
                      { name: 'Blanco', hex: '#e2e8f0' },
                      { name: 'Naranja', hex: '#ea580c' },
                      { name: 'Verde', hex: '#15803d' },
                    ].map((c) => (
                      <div
                        key={c.hex}
                        onClick={() =>
                          onUpdateState((prev) => ({
                            ...prev,
                            warehouse: { ...prev.warehouse, wallColor: c.hex },
                          }))
                        }
                        style={{ backgroundColor: c.hex }}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-all border-2 ${
                          state.warehouse.wallColor.toLowerCase() === c.hex.toLowerCase()
                            ? 'border-amber-400 scale-110 shadow'
                            : 'border-slate-800'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>

                  <label className="text-slate-400 mb-1 flex justify-between">
                    <span>Opacidad de paredes:</span>
                    <strong className="text-amber-400 font-bold">
                      {Math.round(state.warehouse.wallOpacity * 100)}%
                    </strong>
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.9"
                    step="0.05"
                    value={state.warehouse.wallOpacity}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, wallOpacity: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: OBSTÁCULOS (SALÓN Y DEPÓSITO) ── */}
        {(activeTab === 'obstaculos' || activeTab === 'salon-obstaculos' || activeTab === 'deposito-obstaculos') && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Agregar Elementos Estructurales
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addObstacle('column')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4 text-amber-500" /> Columna
                </button>
                <button
                  onClick={() => addObstacle('opening')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4 text-cyan-400" /> Abertura / Puerta
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Elementos en Planta ({state.obstacles.length})
              </span>

              {state.obstacles.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  Sin columnas ni aberturas creadas
                </div>
              ) : (
                <div className="space-y-2">
                  {state.obstacles.map((obs, oi) => {
                    const isSel = selection.type === 'obstacle' && selection.idx === oi;
                    return (
                      <div
                        key={obs.id || oi}
                        onClick={() => onSelect({ type: 'obstacle', idx: oi })}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSel
                            ? 'border-amber-400 bg-amber-950/20 shadow-md ring-1 ring-amber-400/30'
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`font-bold uppercase tracking-wider text-[10px] ${
                              obs.type === 'column' ? 'text-slate-400' : 'text-cyan-400'
                            }`}
                          >
                            {obs.type === 'column' ? `▪ Columna ${oi + 1}` : `⬡ Abertura ${oi + 1}`}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {obs.type === 'opening' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rotateObstacle(oi);
                                }}
                                className="p-1 text-cyan-400 border border-slate-800 rounded bg-slate-900"
                                title="Girar 90°"
                              >
                                <RotateCw className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeObstacle(oi);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 border border-slate-800 rounded bg-slate-900"
                              title="Eliminar elemento"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          X: <strong className="text-slate-200">{obs.x.toFixed(1)}m</strong> · Z:{' '}
                          <strong className="text-slate-200">{obs.z.toFixed(1)}m</strong> ·{' '}
                          {obs.type === 'column' ? `${obs.w}×${obs.d || obs.w} m` : `ancho ${obs.w} m`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 7: VISTA ── */}
        {activeTab === 'vista' && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Opciones Visuales
              </span>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-300 font-medium">Sombras y Oclusión</span>
                  <button
                    onClick={() =>
                      onUpdateState((prev) => ({ ...prev, showShadows: !prev.showShadows }))
                    }
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      state.showShadows ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform transform ${
                        state.showShadows ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-300 font-medium">Cotas y Dimensiones 2D</span>
                  <button
                    onClick={() => onUpdateState((prev) => ({ ...prev, showDims: !prev.showDims }))}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      state.showDims ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform transform ${
                        state.showDims ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-300 font-medium">Cuadrícula / Grid de Piso</span>
                  <button
                    onClick={() => onUpdateState((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      state.showGrid ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform transform ${
                        state.showGrid ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <label className="text-slate-400 mb-1 flex justify-between">
                <span>Intensidad de Iluminación:</span>
                <strong className="text-amber-400 font-bold">{Math.round(state.lightIntensity * 100)}%</strong>
              </label>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={state.lightIntensity}
                onChange={(e) =>
                  onUpdateState((prev) => ({ ...prev, lightIntensity: Number(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ── TAB: PUNTERAS (SALÓN) ── */}
        {activeTab === 'punteras' && (
          <PunterasTab
            state={state}
            selection={selection}
            onSelect={onSelect}
            onUpdateState={onUpdateState}
          />
        )}

        {/* ── TAB: HELADERAS (SALÓN) ── */}
        {activeTab === 'heladeras' && (
          <HeladerasTab
            state={state}
            selection={selection}
            onSelect={onSelect}
            onUpdateState={onUpdateState}
          />
        )}

        {/* ── TAB: CHECK OUTS (SALÓN) ── */}
        {activeTab === 'checkouts' && (
          <CheckoutsTab
            state={state}
            selection={selection}
            onSelect={onSelect}
            onUpdateState={onUpdateState}
          />
        )}

        {/* ── TAB: PUERTAS (SALÓN Y DEPÓSITO) ── */}
        {(activeTab === 'salon-puertas' || activeTab === 'deposito-puertas') && (
          <PuertasTab
            state={state}
            selection={selection}
            onSelect={onSelect}
            onUpdateState={onUpdateState}
          />
        )}

        {/* ── TAB: RACKS PESADOS (DEPÓSITO) ── */}
        {activeTab === 'racks-pesados' && (
          <HeavyRacksTab
            state={state}
            selection={selection}
            onSelect={onSelect}
            onUpdateState={onUpdateState}
          />
        )}

        {/* ── CÓMPUTO TOTAL DE MATERIALES ── */}
        <div className="border-t border-slate-800/80 pt-4 mt-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            {isSalon ? 'Cómputo Salón Comercial' : 'Cómputo Depósito Industrial'}
          </span>

          <div className="grid grid-cols-2 gap-2 mb-2">
            {isSalon ? (
              <>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Bandejas G. Pared</div>
                  <div className="text-base font-bold text-rose-400">{summary.gondolaParedBandejas}</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Bandejas G. Central</div>
                  <div className="text-base font-bold text-pink-400">{summary.gondolaCentralBandejas}</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Punteras ({summary.punterasCount})</div>
                  <div className="text-base font-bold text-amber-400">{summary.punterasBandejas} bandejas</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Heladeras / Murales</div>
                  <div className="text-base font-bold text-cyan-400">{summary.heladerasCount} uds.</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Check Outs / Cajas</div>
                  <div className="text-base font-bold text-emerald-400">{summary.checkoutsCount} cajas</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Puertas de Acceso</div>
                  <div className="text-base font-bold text-blue-400">{summary.puertasCount} uds.</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Racks Pesados Pallets</div>
                  <div className="text-base font-bold text-orange-400">{summary.heavyRackPallets} pos.</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Bastidores Pesados</div>
                  <div className="text-base font-bold text-orange-300">{summary.heavyRackBastidores}</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Bastidores Mini</div>
                  <div className="text-base font-bold text-amber-400">{summary.minirackBastidores}</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Paneles Mini</div>
                  <div className="text-base font-bold text-amber-300">{summary.minirackPaneles}</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Bandejas Estantería</div>
                  <div className="text-base font-bold text-sky-400">{summary.estanteriaBandejas}</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">Portones Industriales</div>
                  <div className="text-base font-bold text-blue-400">{summary.puertasCount} uds.</div>
                </div>
              </>
            )}
          </div>

          {/* Carga Total Highlight */}
          <div className="bg-gradient-to-r from-amber-950/50 to-orange-950/50 border border-amber-500/40 rounded-xl p-3 shadow-lg">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-0.5">
              Carga Máxima Combinada
            </div>
            <div className="text-xl font-extrabold text-amber-400 font-mono">
              {summary.cargaTotalKg.toLocaleString()} kg
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Área ocupada: <strong>{summary.areaOcupadaM2.toFixed(1)} m²</strong> ({summary.enclosingWidth.toFixed(1)} ×{' '}
              {summary.enclosingDepth.toFixed(1)} m)
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTION BAR ── */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex gap-2 flex-shrink-0">
        <button
          onClick={onPrintPDF}
          className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold flex flex-col items-center gap-1 transition-all text-[11px]"
          title="Imprimir o guardar PDF"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>PDF</span>
        </button>
        <button
          onClick={() => onOpenSaveDialog('save')}
          className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold flex flex-col items-center gap-1 transition-all text-[11px]"
          title="Guardar archivo para Cliente (solo lectura)"
        >
          <UserCheck className="w-4 h-4 text-sky-400" />
          <span>Cliente</span>
        </button>
        <button
          onClick={() => onOpenSaveDialog('designer')}
          className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold flex flex-col items-center gap-1 transition-all text-[11px]"
          title="Guardar archivo Maestro Diseñador"
        >
          <Wrench className="w-4 h-4 text-rose-400" />
          <span>Diseñador</span>
        </button>
        <button
          onClick={() => onOpenSaveDialog('share')}
          className="flex-1 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/50 text-emerald-300 font-bold flex flex-col items-center gap-1 transition-all text-[11px]"
          title="Compartir por WhatsApp"
        >
          <Share2 className="w-4 h-4 text-emerald-400" />
          <span>WhatsApp</span>
        </button>
      </div>
    </aside>
  );
};
