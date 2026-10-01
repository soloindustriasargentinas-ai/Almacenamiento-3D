import React, { useState } from 'react';
import { AppState, PunteraGondola, SelectionState } from '../../types';
import { findOpenPlacementSpot, getGondolaCentralLineBounds, snap10 } from '../../utils/calculations';
import { Package, Plus, RotateCw, Trash2, Link, Sparkles } from 'lucide-react';

interface PunterasTabProps {
  state: AppState;
  selection: SelectionState;
  onSelect: (sel: SelectionState) => void;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const PunterasTab: React.FC<PunterasTabProps> = ({
  state,
  selection,
  onSelect,
  onUpdateState,
}) => {
  const [newWidth, setNewWidth] = useState<number>(0.90);
  const [newHeight, setNewHeight] = useState<number>(1.60);
  const [newDepth, setNewDepth] = useState<number>(0.38);
  const [newShelves, setNewShelves] = useState<number>(4);

  const addPuntera = (attachedIdx?: number) => {
    onUpdateState((prev) => {
      let posX = 1.0;
      let posZ = 1.0;
      let rot = 0;

      if (attachedIdx !== undefined && prev.gondolaCentral?.lines?.[attachedIdx]) {
        const cLine = prev.gondolaCentral.lines[attachedIdx];
        const b = getGondolaCentralLineBounds(cLine, prev.gondolaCentral.depth);
        if (cLine.rotation === 0 || cLine.rotation === 180) {
          posX = snap10(b.x1 + 0.05);
          posZ = snap10((b.z0 + b.z1) / 2 - newWidth / 2);
          rot = 90;
        } else {
          posX = snap10((b.x0 + b.x1) / 2 - newWidth / 2);
          posZ = snap10(b.z1 + 0.05);
          rot = 0;
        }
      } else {
        const spot = findOpenPlacementSpot(prev, newWidth, newDepth);
        posX = spot.x;
        posZ = spot.z;
      }

      const item: PunteraGondola = {
        id: Date.now(),
        x: posX,
        z: posZ,
        rotation: rot,
        width: newWidth,
        height: newHeight,
        depth: newDepth,
        shelfCount: newShelves,
        attachedCentralIdx: attachedIdx ?? null,
      };

      const punteras = [...(prev.punteras || []), item];
      return { ...prev, punteras };
    });
  };

  const removePuntera = (idx: number) => {
    onUpdateState((prev) => {
      const punteras = (prev.punteras || []).filter((_, i) => i !== idx);
      return { ...prev, punteras };
    });
    if (selection.type === 'puntera' && selection.idx === idx) {
      onSelect({ type: null, idx: null });
    }
  };

  const rotatePuntera = (idx: number) => {
    onUpdateState((prev) => {
      const punteras = [...(prev.punteras || [])];
      if (!punteras[idx]) return prev;
      const curRot = punteras[idx].rotation || 0;
      punteras[idx] = {
        ...punteras[idx],
        rotation: (curRot + 90) % 360,
      };
      return { ...prev, punteras };
    });
  };

  const updatePunteraShelves = (idx: number, delta: number) => {
    onUpdateState((prev) => {
      const punteras = [...(prev.punteras || [])];
      if (!punteras[idx]) return prev;
      const curSc = punteras[idx].shelfCount || 4;
      punteras[idx] = {
        ...punteras[idx],
        shelfCount: Math.max(2, Math.min(8, curSc + delta)),
      };
      return { ...prev, punteras };
    });
  };

  return (
    <div className="space-y-4">
      {/* Header & Quick Add */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Punteras de Góndola</h3>
            <p className="text-[11px] text-slate-400">Cabeceras de exhibición para islas centrales</p>
          </div>
        </div>

        {/* Parameters for new Puntera */}
        <div className="space-y-2.5 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Ancho de Cabecera:</label>
            <div className="grid grid-cols-3 gap-1">
              {[0.90, 1.00, 1.20].map((w) => (
                <button
                  key={w}
                  onClick={() => setNewWidth(w)}
                  className={`py-1 rounded font-bold transition-all ${
                    newWidth === w
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {w.toFixed(2)}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Altura:</label>
            <div className="grid grid-cols-4 gap-1">
              {[1.20, 1.60, 1.75, 2.00].map((h) => (
                <button
                  key={h}
                  onClick={() => setNewHeight(h)}
                  className={`py-1 rounded font-bold transition-all ${
                    newHeight === h
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {h.toFixed(2)}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Estantes (Base + Superiores):</label>
            <div className="grid grid-cols-4 gap-1">
              {[3, 4, 5, 6].map((s) => (
                <button
                  key={s}
                  onClick={() => setNewShelves(s)}
                  className={`py-1 rounded font-bold transition-all ${
                    newShelves === s
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s} niveles
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => addPuntera()}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Puntera Libre</span>
          </button>
        </div>
      </div>

      {/* Quick Attach to Central Gondolas */}
      {(state.gondolaCentral?.lines?.length || 0) > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <Link className="w-3.5 h-3.5 text-pink-400" />
            <span>Acoplar a Isla Central</span>
          </span>
          <div className="space-y-1.5">
            {state.gondolaCentral.lines.map((cline, ci) => (
              <button
                key={ci}
                onClick={() => addPuntera(ci)}
                className="w-full py-1.5 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/40 rounded-lg text-left text-xs text-slate-300 flex items-center justify-between transition-all"
              >
                <span>Isla #{ci + 1} ({cline.modules.length} mód.)</span>
                <span className="text-pink-400 text-[11px] font-bold">＋ Acoplar</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List of Created Punteras */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Punteras en el Salón ({state.punteras?.length || 0})
        </span>

        {(!state.punteras || state.punteras.length === 0) ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-xs">
            No hay punteras agregadas aún. Haz clic en "Agregar Puntera Libre" o acóplala a una góndola central.
          </div>
        ) : (
          state.punteras.map((p, idx) => {
            const isSel = selection.type === 'puntera' && selection.idx === idx;
            return (
              <div
                key={p.id || idx}
                onClick={() => onSelect({ type: 'puntera', idx })}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-amber-950/30 border-amber-500/80 shadow-md shadow-amber-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                      #{idx + 1}
                    </span>
                    <strong className="text-slate-200">
                      Puntera {p.width}m × {p.height}m
                    </strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotatePuntera(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-amber-400 text-slate-400"
                      title="Rotar 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePuntera(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-rose-400 text-slate-400"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Pos: ({p.x.toFixed(1)}m, {p.z.toFixed(1)}m) · Rot: {p.rotation}°</span>
                  <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePunteraShelves(idx, -1);
                      }}
                      className="hover:text-amber-400 font-bold px-1"
                    >
                      −
                    </button>
                    <span className="text-amber-400 font-mono font-bold">{p.shelfCount} est.</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePunteraShelves(idx, 1);
                      }}
                      className="hover:text-amber-400 font-bold px-1"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
