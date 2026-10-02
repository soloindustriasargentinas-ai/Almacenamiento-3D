import React, { useState } from 'react';
import { AppState, HeladeraComercial, SelectionState } from '../../types';
import { findOpenPlacementSpot } from '../../utils/calculations';
import { Snowflake, Plus, RotateCw, Trash2, Palette, Check } from 'lucide-react';

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
  const [newWidth, setNewWidth] = useState<number>(2.00);
  const [newDepth, setNewDepth] = useState<number>(0.95);
  const [newHeight, setNewHeight] = useState<number>(1.25);
  const [newColor, setNewColor] = useState<'blanco' | 'negro' | 'inox'>('inox');
  const [newType, setNewType] = useState<'mostrador' | 'mural_vidrio' | 'mural_abierto' | 'isla_congelados'>('mostrador');

  const selectedIdx = selection.type === 'heladera' && selection.idx !== null ? selection.idx : null;
  const selectedHeladera = selectedIdx !== null && state.heladeras ? state.heladeras[selectedIdx] : null;

  const updateHeladera = (idx: number, patch: Partial<HeladeraComercial>) => {
    onUpdateState((prev) => {
      const heladeras = [...(prev.heladeras || [])];
      if (!heladeras[idx]) return prev;
      heladeras[idx] = {
        ...heladeras[idx],
        ...patch,
      };
      return { ...prev, heladeras };
    });
  };

  const handleSelectType = (type: 'mostrador' | 'mural_vidrio' | 'mural_abierto' | 'isla_congelados') => {
    setNewType(type);
    let h = newHeight;
    let d = newDepth;
    let w = newWidth;
    if (type === 'mostrador') {
      h = 1.25;
      d = 0.95;
      if (w < 1.20) w = 2.00;
    } else if (type === 'mural_vidrio' || type === 'mural_abierto') {
      h = 2.00;
      d = 0.85;
    } else if (type === 'isla_congelados') {
      h = 0.88;
      d = 1.00;
    }
    setNewHeight(h);
    setNewDepth(d);
    setNewWidth(w);

    if (selectedIdx !== null) {
      updateHeladera(selectedIdx, { type, height: h, depth: d, width: w });
    }
  };

  const handleSelectWidth = (w: number) => {
    setNewWidth(w);
    if (selectedIdx !== null) {
      const doors = w >= 2.4 ? 4 : w >= 1.8 ? 3 : 2;
      updateHeladera(selectedIdx, { width: w, doorsCount: doors });
    }
  };

  const handleSelectColor = (color: 'blanco' | 'negro' | 'inox') => {
    setNewColor(color);
    if (selectedIdx !== null) {
      updateHeladera(selectedIdx, { color });
    }
  };

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

  const activeType = selectedHeladera ? selectedHeladera.type : newType;
  const activeWidth = selectedHeladera ? selectedHeladera.width : newWidth;
  const activeColor = selectedHeladera ? selectedHeladera.color : newColor;

  return (
    <div className="space-y-4">
      {/* Header & Add */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Snowflake className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Heladeras y Mostradores</h3>
            <p className="text-[11px] text-slate-400">Heladeras mostrador batea, murales y pozos de frío</p>
          </div>
        </div>

        {selectedHeladera && (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold flex items-center justify-between">
            <span>Editando Heladera #{selectedIdx! + 1} seleccionada</span>
            <span className="font-mono text-white capitalize">{selectedHeladera.type.replace('_', ' ')} · {selectedHeladera.width}m</span>
          </div>
        )}

        {/* Configuration */}
        <div className="space-y-2.5 text-xs">
          {/* Tipo de Heladera */}
          <div>
            <label className="text-slate-400 block mb-1 font-medium">
              Tipo de Equipamiento {selectedHeladera ? '(Heladera Seleccionada)' : '(Nuevo)'}:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'mostrador' as const, label: '🥩 Heladera Mostrador', desc: 'Vitrina 1.25m con mesada y batea' },
                { id: 'mural_vidrio' as const, label: '🥛 Mural con Vidrio', desc: 'Puertas batientes 2.00m' },
                { id: 'mural_abierto' as const, label: '🥬 Mural Abierto', desc: 'Cortina de aire 2.00m' },
                { id: 'isla_congelados' as const, label: '🧊 Isla Congelados', desc: 'Pozo horizontal 0.88m' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectType(t.id)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    activeType === t.id
                      ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/50 shadow-sm'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px] flex items-center justify-between">
                    <span>{t.label}</span>
                    {activeType === t.id && <Check className="w-3 h-3 text-cyan-300 stroke-[3]" />}
                  </div>
                  <div className="text-[9px] text-slate-500">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">
              {activeType === 'mostrador' ? 'Largo del Mostrador:' : 'Módulo / Ancho:'}
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { w: 1.20, label: '1.20 m' },
                { w: 1.80, label: '1.80 m' },
                { w: 2.00, label: '2.00 m' },
                { w: 2.40, label: '2.40 m' },
              ].map(({ w, label }) => {
                const isSelected = Math.abs(activeWidth - w) < 0.05;
                return (
                  <button
                    key={w}
                    onClick={() => handleSelectWidth(w)}
                    className={`py-1.5 px-1 rounded-lg font-bold text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md ring-2 ring-cyan-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Acabado / Color:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'inox' as const, label: 'Inoxidable', bg: 'bg-slate-400 text-slate-950' },
                { id: 'negro' as const, label: 'Negro Grafito', bg: 'bg-slate-950 border-slate-700 text-white' },
                { id: 'blanco' as const, label: 'Blanco Puro', bg: 'bg-slate-200 text-slate-950' },
              ].map((c) => {
                const isSelected = activeColor === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectColor(c.id)}
                    className={`py-1.5 rounded-lg font-bold border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-cyan-400 border-cyan-400 font-black shadow-md'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    } ${c.bg}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={addHeladera}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar {activeType === 'mostrador' ? 'Heladera Mostrador' : 'Heladera Comercial'}</span>
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
            No hay heladeras en el salón aún. Haz clic en "Agregar Heladera" para colocar una.
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
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-400/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                      #{idx + 1}
                    </span>
                    <strong className="text-slate-100 text-xs">
                      {h.type === 'mostrador'
                        ? `🥩 Mostrador ${h.width}m`
                        : h.type === 'isla_congelados'
                        ? `🧊 Isla ${h.width}m`
                        : `🥛 Mural ${h.width}m`}
                    </strong>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                      {h.color}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateHeladera(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-cyan-400 text-slate-400 transition-colors"
                      title="Rotar 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHeladera(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-rose-400 text-slate-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Type Selection on Card */}
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateHeladera(idx, { type: 'mostrador', height: 1.25, depth: 0.95 });
                    }}
                    className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      h.type === 'mostrador'
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span>🥩 Mostrador Vitrina</span>
                    {h.type === 'mostrador' && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateHeladera(idx, { type: 'mural_vidrio', height: 2.00, depth: 0.85 });
                    }}
                    className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      h.type === 'mural_vidrio'
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span>🥛 Mural Vidrio</span>
                    {h.type === 'mural_vidrio' && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                </div>

                {/* Quick Width Buttons */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {[1.20, 1.80, 2.00, 2.40].map((w) => {
                    const isW = Math.abs(h.width - w) < 0.05;
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateHeladera(idx, { width: w });
                        }}
                        className={`py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isW
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {w.toFixed(2)}m
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-400 flex justify-between items-center pt-1.5 border-t border-slate-800/60">
                  <span>Pos: ({h.x.toFixed(1)}m, {h.z.toFixed(1)}m) · Rot: {h.rotation}°</span>
                  <span className="font-mono text-cyan-300">{h.width.toFixed(2)}m × {h.depth.toFixed(2)}m × {h.height.toFixed(2)}m</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
