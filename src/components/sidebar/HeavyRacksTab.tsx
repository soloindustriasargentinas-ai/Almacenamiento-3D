import React from 'react';
import { AppState, HeavyRackLine, SelectionState } from '../../types';
import { findOpenPlacementSpot, realHeavyRackLineWidth } from '../../utils/calculations';
import { Layers, Plus, RotateCw, Trash2 } from 'lucide-react';

interface HeavyRacksTabProps {
  state: AppState;
  selection: SelectionState;
  onSelect: (sel: SelectionState) => void;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const HeavyRacksTab: React.FC<HeavyRacksTabProps> = ({
  state,
  selection,
  onSelect,
  onUpdateState,
}) => {
  const currentHeight = state.heavyRacks?.height || 4.5;
  const currentDepth = state.heavyRacks?.depth || 1.10;
  const lines = state.heavyRacks?.lines || [];

  const setHeight = (h: number) => {
    onUpdateState((prev) => ({
      ...prev,
      heavyRacks: {
        ...(prev.heavyRacks || { defaultLevels: 3, lines: [] }),
        height: h,
        depth: prev.heavyRacks?.depth || 1.10,
        lines: (prev.heavyRacks?.lines || []).map((l) => ({ ...l, height: h })),
      },
    }));
  };

  const setDepth = (d: number) => {
    onUpdateState((prev) => ({
      ...prev,
      heavyRacks: {
        ...(prev.heavyRacks || { height: 4.5, defaultLevels: 3, lines: [] }),
        depth: d,
        height: prev.heavyRacks?.height || 4.5,
        lines: (prev.heavyRacks?.lines || []).map((l) => ({ ...l, depth: d })),
      },
    }));
  };

  const addHeavyRackLine = () => {
    onUpdateState((prev) => {
      const newLineMods = [
        { bl: 2.70, levels: prev.heavyRacks?.defaultLevels || 3, capPerLevel: 2400 },
        { bl: 2.70, levels: prev.heavyRacks?.defaultLevels || 3, capPerLevel: 2400 },
      ];
      const tempLine: HeavyRackLine = {
        xOff: 0,
        zOff: 0,
        rotation: 0,
        height: prev.heavyRacks?.height || 4.5,
        depth: prev.heavyRacks?.depth || 1.10,
        modules: newLineMods,
      };
      const w = realHeavyRackLineWidth(tempLine);
      const d = prev.heavyRacks?.depth || 1.10;
      const spot = findOpenPlacementSpot(prev, w, d);

      const newLine: HeavyRackLine = {
        ...tempLine,
        xOff: spot.x,
        zOff: spot.z,
      };

      const updatedLines = [...(prev.heavyRacks?.lines || []), newLine];
      return {
        ...prev,
        heavyRacks: {
          ...(prev.heavyRacks || { height: 4.5, depth: 1.10, defaultLevels: 3 }),
          lines: updatedLines,
        },
      };
    });
  };

  const removeLine = (idx: number) => {
    onUpdateState((prev) => {
      const updatedLines = (prev.heavyRacks?.lines || []).filter((_, i) => i !== idx);
      return {
        ...prev,
        heavyRacks: {
          ...prev.heavyRacks,
          lines: updatedLines,
        },
      };
    });
    if (selection.type === 'heavyRack' && selection.idx === idx) {
      onSelect({ type: null, idx: null });
    }
  };

  const rotateLine = (idx: number) => {
    onUpdateState((prev) => {
      const updatedLines = [...(prev.heavyRacks?.lines || [])];
      if (!updatedLines[idx]) return prev;
      const curRot = updatedLines[idx].rotation || 0;
      updatedLines[idx] = {
        ...updatedLines[idx],
        rotation: (curRot + 90) % 360,
      };
      return {
        ...prev,
        heavyRacks: {
          ...prev.heavyRacks,
          lines: updatedLines,
        },
      };
    });
  };

  const addModuleToLine = (lineIdx: number) => {
    onUpdateState((prev) => {
      const updatedLines = [...(prev.heavyRacks?.lines || [])];
      const cur = updatedLines[lineIdx];
      if (!cur) return prev;
      const lastMod = cur.modules[cur.modules.length - 1];
      const newMod = {
        bl: lastMod ? lastMod.bl : 2.70,
        levels: lastMod ? lastMod.levels : 3,
        capPerLevel: lastMod?.capPerLevel || 2400,
      };
      updatedLines[lineIdx] = {
        ...cur,
        modules: [...cur.modules, newMod],
      };
      return {
        ...prev,
        heavyRacks: {
          ...prev.heavyRacks,
          lines: updatedLines,
        },
      };
    });
  };

  const removeModuleFromLine = (lineIdx: number, modIdx: number) => {
    onUpdateState((prev) => {
      const updatedLines = [...(prev.heavyRacks?.lines || [])];
      const cur = updatedLines[lineIdx];
      if (!cur || cur.modules.length <= 1) return prev;
      updatedLines[lineIdx] = {
        ...cur,
        modules: cur.modules.filter((_, i) => i !== modIdx),
      };
      return {
        ...prev,
        heavyRacks: {
          ...prev.heavyRacks,
          lines: updatedLines,
        },
      };
    });
  };

  const changeModuleBeam = (lineIdx: number, modIdx: number) => {
    onUpdateState((prev) => {
      const updatedLines = [...(prev.heavyRacks?.lines || [])];
      const cur = updatedLines[lineIdx];
      if (!cur || !cur.modules[modIdx]) return prev;
      const beamLengths = [2.30, 2.70, 3.30];
      const nextIdx = (beamLengths.indexOf(cur.modules[modIdx].bl) + 1) % beamLengths.length;
      const mods = [...cur.modules];
      mods[modIdx] = { ...mods[modIdx], bl: beamLengths[nextIdx] };
      updatedLines[lineIdx] = { ...cur, modules: mods };
      return {
        ...prev,
        heavyRacks: {
          ...prev.heavyRacks,
          lines: updatedLines,
        },
      };
    });
  };

  const changeModuleLevels = (lineIdx: number, modIdx: number, delta: number) => {
    onUpdateState((prev) => {
      const updatedLines = [...(prev.heavyRacks?.lines || [])];
      const cur = updatedLines[lineIdx];
      if (!cur || !cur.modules[modIdx]) return prev;
      const curL = cur.modules[modIdx].levels || 3;
      const nextL = Math.max(2, Math.min(6, curL + delta));
      const mods = [...cur.modules];
      mods[modIdx] = { ...mods[modIdx], levels: nextL };
      updatedLines[lineIdx] = { ...cur, modules: mods };
      return {
        ...prev,
        heavyRacks: {
          ...prev.heavyRacks,
          lines: updatedLines,
        },
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* Parameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Racks Pesados Selectivos</h3>
            <p className="text-[11px] text-slate-400">Estructuras industriales para estiba de pallets pesados</p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <label className="text-slate-400 mb-1 flex justify-between">
              <span>Altura de Bastidor:</span>
              <strong className="text-orange-400 font-bold">{currentHeight.toFixed(1)}m</strong>
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[3.0, 4.0, 5.0, 6.0].map((h) => (
                <button
                  key={h}
                  onClick={() => setHeight(h)}
                  className={`py-1.5 rounded font-bold transition-all ${
                    currentHeight === h
                      ? 'bg-orange-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {h.toFixed(1)}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 mb-1 flex justify-between">
              <span>Profundidad (Fondo Bastidor):</span>
              <strong className="text-orange-400 font-bold">{currentDepth.toFixed(2)}m</strong>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { d: 1.00, label: '1.00m (Pallet 1000)' },
                { d: 1.10, label: '1.10m (Pallet 1200 Arlog)' },
              ].map((item) => (
                <button
                  key={item.d}
                  onClick={() => setDepth(item.d)}
                  className={`py-1.5 rounded font-bold transition-all ${
                    currentDepth === item.d
                      ? 'bg-orange-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={addHeavyRackLine}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Batería de Racks Pesados</span>
          </button>
        </div>
      </div>

      {/* Lines List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Baterías de Racks Pesados ({lines.length})
        </span>

        {lines.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-xs">
            No hay racks pesados instalados aún. Haz clic en "Agregar Batería de Racks Pesados" para crear una línea.
          </div>
        ) : (
          lines.map((line, li) => {
            const isSel = selection.type === 'heavyRack' && selection.idx === li;
            const totalLen = realHeavyRackLineWidth(line);
            return (
              <div
                key={li}
                onClick={() => onSelect({ type: 'heavyRack', idx: li })}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-orange-950/30 border-orange-500/80 shadow-md shadow-orange-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[10px]">
                      R#{li + 1}
                    </span>
                    <strong className="text-slate-200">
                      Batería {totalLen.toFixed(2)}m ({line.modules.length} módulos)
                    </strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateLine(li);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-orange-400 text-slate-400"
                      title="Rotar 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLine(li);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-rose-400 text-slate-400"
                      title="Eliminar línea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mb-2">
                  Pos: ({line.xOff.toFixed(1)}m, {line.zOff.toFixed(1)}m) · Rot: {line.rotation}° · H: {line.height}m
                </div>

                {/* Modules chips */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {line.modules.map((m, mi) => (
                    <div
                      key={mi}
                      className="flex items-center gap-1 bg-slate-950 border border-slate-800 hover:border-orange-500/50 px-2 py-1 rounded-lg text-slate-300 font-semibold"
                    >
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          changeModuleBeam(li, mi);
                        }}
                        className="hover:text-orange-400 cursor-pointer"
                        title="Clic para cambiar largo de viga"
                      >
                        {m.bl}m
                      </span>
                      <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1 ml-0.5 text-[10px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            changeModuleLevels(li, mi, -1);
                          }}
                          className="text-slate-500 hover:text-orange-400 font-bold px-0.5"
                        >
                          −
                        </button>
                        <span className="text-orange-400 font-mono">↕{m.levels}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            changeModuleLevels(li, mi, 1);
                          }}
                          className="text-slate-500 hover:text-orange-400 font-bold px-0.5"
                        >
                          +
                        </button>
                      </div>
                      {line.modules.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeModuleFromLine(li, mi);
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
                      addModuleToLine(li);
                    }}
                    className="px-2 py-1 border border-dashed border-slate-700 hover:border-orange-400 text-slate-400 hover:text-orange-400 rounded-lg text-xs font-bold"
                  >
                    ＋ Mód.
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
