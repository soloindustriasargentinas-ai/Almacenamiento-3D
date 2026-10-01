import React, { useState } from 'react';
import { AppState, HeladeraComercial, SelectionState } from '../../types';
import { findOpenPlacementSpot } from '../../utils/calculations';
import { Snowflake, Plus, RotateCw, Trash2, Palette } from 'lucide-react';

interface HeladerasTabProps {
  state: AppState;
  selection: SelectionState;
  onSelect: (sel: SelectionState) => void;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const HeladerasTab: React.FC<HeladerasTabProps> = ({
  state,
  selection,
  onSelect,
  onUpdateState,
}) => {
  const [newWidth, setNewWidth] = useState<number>(1.80);
  const [newDepth, setNewDepth] = useState<number>(0.85);
  const [newHeight, setNewHeight] = useState<number>(2.00);
  const [newColor, setNewColor] = useState<'blanco' | 'negro' | 'inox'>('negro');
  const [newType, setNewType] = useState<'mural_vidrio' | 'mural_abierto' | 'isla_congelados'>('mural_vidrio');

  const addHeladera = () => {
    onUpdateState((prev) => {
      const spot = findOpenPlacementSpot(prev, newWidth, newDepth);
      const doors = newWidth >= 2.4 ? 4 : newWidth >= 1.8 ? 3 : 2;

      const item: HeladeraComercial = {
        id: Date.now(),
        x: spot.x,
        z: spot.z,
        rotation: 0,
        type: newType,
        width: newWidth,
        depth: newDepth,
        height: newHeight,
        color: newColor,
        doorsCount: doors,
        illuminated: true,
      };

      const heladeras = [...(prev.heladeras || []), item];
      return { ...prev, heladeras };
    });
  };

  const removeHeladera = (idx: number) => {
    onUpdateState((prev) => {
      const heladeras = (prev.heladeras || []).filter((_, i) => i !== idx);
      return { ...prev, heladeras };
    });
    if (selection.type === 'heladera' && selection.idx === idx) {
      onSelect({ type: null, idx: null });
    }
  };

  const rotateHeladera = (idx: number) => {
    onUpdateState((prev) => {
      const heladeras = [...(prev.heladeras || [])];
      if (!heladeras[idx]) return prev;
      const curRot = heladeras[idx].rotation || 0;
      heladeras[idx] = {
        ...heladeras[idx],
        rotation: (curRot + 90) % 360,
      };
      return { ...prev, heladeras };
    });
  };

  const cycleColor = (idx: number) => {
    onUpdateState((prev) => {
      const heladeras = [...(prev.heladeras || [])];
      if (!heladeras[idx]) return prev;
      const colors: ('blanco' | 'negro' | 'inox')[] = ['blanco', 'negro', 'inox'];
      const nextIdx = (colors.indexOf(heladeras[idx].color) + 1) % colors.length;
      heladeras[idx] = {
        ...heladeras[idx],
        color: colors[nextIdx],
      };
      return { ...prev, heladeras };
    });
  };

  return (
    <div className="space-y-4">
      {/* Header & Add */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Snowflake className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Heladeras y Murales</h3>
            <p className="text-[11px] text-slate-400">Exhibidoras refrigeradas comerciales con luz LED</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-2.5 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Módulo / Ancho:</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { w: 1.20, label: '1.20m (2 ptas)' },
                { w: 1.80, label: '1.80m (3 ptas)' },
                { w: 2.40, label: '2.40m (4 ptas)' },
              ].map(({ w, label }) => (
                <button
                  key={w}
                  onClick={() => setNewWidth(w)}
                  className={`py-1.5 px-1 rounded font-bold text-center transition-all ${
                    newWidth === w
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Acabado / Color:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'negro' as const, label: 'Negro Grafito', bg: 'bg-slate-950 border-slate-700' },
                { id: 'blanco' as const, label: 'Blanco Puro', bg: 'bg-slate-200 text-slate-950' },
                { id: 'inox' as const, label: 'Inoxidable', bg: 'bg-slate-400 text-slate-950' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setNewColor(c.id)}
                  className={`py-1 rounded font-bold border text-xs transition-all ${
                    newColor === c.id
                      ? 'ring-2 ring-cyan-400 border-cyan-400 font-bold'
                      : 'border-slate-800 opacity-70 hover:opacity-100'
                  } ${c.bg}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={addHeladera}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Heladera Comercial</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Heladeras Instaladas ({state.heladeras?.length || 0})
        </span>

        {(!state.heladeras || state.heladeras.length === 0) ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-xs">
            No hay heladeras en el salón aún. Haz clic en "Agregar Heladera Comercial" para colocar una.
          </div>
        ) : (
          state.heladeras.map((h, idx) => {
            const isSel = selection.type === 'heladera' && selection.idx === idx;
            return (
              <div
                key={h.id || idx}
                onClick={() => onSelect({ type: 'heladera', idx })}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-cyan-950/30 border-cyan-500/80 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                      #{idx + 1}
                    </span>
                    <strong className="text-slate-200">
                      Mural {h.width}m ({h.doorsCount} ptas)
                    </strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleColor(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-cyan-400 text-slate-400"
                      title="Cambiar Color"
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateHeladera(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-cyan-400 text-slate-400"
                      title="Rotar 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHeladera(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-rose-400 text-slate-400"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Pos: ({h.x.toFixed(1)}m, {h.z.toFixed(1)}m) · Rot: {h.rotation}°</span>
                  <span className="capitalize px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 font-medium border border-slate-800">
                    Color: {h.color}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
