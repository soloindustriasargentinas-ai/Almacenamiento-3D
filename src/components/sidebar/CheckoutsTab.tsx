import React, { useState } from 'react';
import { AppState, CheckoutCounter, SelectionState } from '../../types';
import { findOpenPlacementSpot } from '../../utils/calculations';
import { CreditCard, Plus, RotateCw, Trash2, ArrowLeftRight, Check } from 'lucide-react';

interface CheckoutsTabProps {
  state: AppState;
  selection: SelectionState;
  onSelect: (sel: SelectionState) => void;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const CheckoutsTab: React.FC<CheckoutsTabProps> = ({
  state,
  selection,
  onSelect,
  onUpdateState,
}) => {
  const [newLength, setNewLength] = useState<number>(1.80);
  const [newWidth] = useState<number>(1.10);
  const [newSide, setNewSide] = useState<'derecha' | 'izquierda'>('derecha');

  const selectedIdx = selection.type === 'checkout' && selection.idx !== null ? selection.idx : null;
  const selectedCheckout = selectedIdx !== null && state.checkouts ? state.checkouts[selectedIdx] : null;

  const handleSelectLength = (len: number) => {
    setNewLength(len);
    if (selectedIdx !== null) {
      setCheckoutLength(selectedIdx, len);
    }
  };

  const handleSelectSide = (side: 'derecha' | 'izquierda') => {
    setNewSide(side);
    if (selectedIdx !== null) {
      setCheckoutSide(selectedIdx, side);
    }
  };

  const addCheckout = () => {
    onUpdateState((prev) => {
      const spot = findOpenPlacementSpot(prev, newLength, newWidth);

      const item: CheckoutCounter = {
        id: Date.now(),
        x: spot.x,
        z: spot.z,
        rotation: 0,
        type: 'estandar',
        length: newLength,
        width: newWidth,
        height: 0.88,
        scannerSide: newSide,
        hasBelt: true,
      };

      const checkouts = [...(prev.checkouts || []), item];
      return { ...prev, checkouts };
    });
  };

  const setCheckoutLength = (idx: number, length: number) => {
    onUpdateState((prev) => {
      const checkouts = [...(prev.checkouts || [])];
      if (!checkouts[idx]) return prev;
      checkouts[idx] = {
        ...checkouts[idx],
        length,
      };
      return { ...prev, checkouts };
    });
  };

  const setCheckoutSide = (idx: number, side: 'derecha' | 'izquierda') => {
    onUpdateState((prev) => {
      const checkouts = [...(prev.checkouts || [])];
      if (!checkouts[idx]) return prev;
      checkouts[idx] = {
        ...checkouts[idx],
        scannerSide: side,
      };
      return { ...prev, checkouts };
    });
  };

  const removeCheckout = (idx: number) => {
    onUpdateState((prev) => {
      const checkouts = (prev.checkouts || []).filter((_, i) => i !== idx);
      return { ...prev, checkouts };
    });
    if (selection.type === 'checkout' && selection.idx === idx) {
      onSelect({ type: null, idx: null });
    }
  };

  const rotateCheckout = (idx: number) => {
    onUpdateState((prev) => {
      const checkouts = [...(prev.checkouts || [])];
      if (!checkouts[idx]) return prev;
      const curRot = checkouts[idx].rotation || 0;
      checkouts[idx] = {
        ...checkouts[idx],
        rotation: (curRot + 90) % 360,
      };
      return { ...prev, checkouts };
    });
  };

  const toggleSide = (idx: number) => {
    onUpdateState((prev) => {
      const checkouts = [...(prev.checkouts || [])];
      if (!checkouts[idx]) return prev;
      const curSide = checkouts[idx].scannerSide || 'derecha';
      checkouts[idx] = {
        ...checkouts[idx],
        scannerSide: curSide === 'derecha' ? 'izquierda' : 'derecha',
      };
      return { ...prev, checkouts };
    });
  };

  const activeLen = selectedCheckout ? selectedCheckout.length : newLength;
  const activeSide = selectedCheckout ? (selectedCheckout.scannerSide || 'derecha') : newSide;

  return (
    <div className="space-y-4">
      {/* Header & Add */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Check Outs / Cajas de Cobro</h3>
            <p className="text-[11px] text-slate-400">Líneas de caja de 1.60m, 1.80m y 2.00m (Izquierda / Derecha)</p>
          </div>
        </div>

        {selectedCheckout && (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center justify-between">
            <span>Editando Caja #{selectedIdx! + 1} seleccionada</span>
            <span className="font-mono text-white">{selectedCheckout.length}m · {selectedCheckout.scannerSide}</span>
          </div>
        )}

        {/* Configuration */}
        <div className="space-y-2.5 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">
              Largo del Check Out {selectedCheckout ? '(Caja Seleccionada)' : '(Nuevo)'}:
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { l: 1.60, label: '1.60 m' },
                { l: 1.80, label: '1.80 m' },
                { l: 2.00, label: '2.00 m' },
              ].map(({ l, label }) => {
                const isSelected = Math.abs(activeLen - l) < 0.05;
                return (
                  <button
                    key={l}
                    onClick={() => handleSelectLength(l)}
                    className={`py-2 px-1 rounded-lg font-bold text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">
              Lado del Cajero / Salida:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { side: 'derecha' as const, label: '👉 Cajero Derecha' },
                { side: 'izquierda' as const, label: '👈 Cajero Izquierda' },
              ].map((s) => {
                const isSelected = activeSide === s.side;
                return (
                  <button
                    key={s.side}
                    onClick={() => handleSelectSide(s.side)}
                    className={`py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={addCheckout}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Línea de Caja</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Cajas en el Salón ({state.checkouts?.length || 0})
        </span>

        {(!state.checkouts || state.checkouts.length === 0) ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-xs">
            No hay cajas registradoras agregadas aún. Haz clic en "Agregar Línea de Caja" para colocar una.
          </div>
        ) : (
          state.checkouts.map((c, idx) => {
            const isSel = selection.type === 'checkout' && selection.idx === idx;
            const curSide = c.scannerSide || 'derecha';
            return (
              <div
                key={c.id || idx}
                onClick={() => onSelect({ type: 'checkout', idx })}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      C#{idx + 1}
                    </span>
                    <strong className="text-slate-100 text-xs">
                      Check Out {c.length.toFixed(2)}m
                    </strong>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold">
                      {curSide === 'derecha' ? '👉 Derecha' : '👈 Izquierda'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSide(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-emerald-400 text-slate-400 transition-colors"
                      title="Alternar Lado Cajero (Izquierda / Derecha)"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateCheckout(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-emerald-400 text-slate-400 transition-colors"
                      title="Rotar 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCheckout(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-rose-400 text-slate-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Length Selector on Card */}
                <div className="mb-2">
                  <span className="text-[10px] text-slate-400 block mb-1">Largo de la Caja:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[1.60, 1.80, 2.00].map((len) => {
                      const active = Math.abs(c.length - len) < 0.05;
                      return (
                        <button
                          key={len}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCheckoutLength(idx, len);
                          }}
                          className={`py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {len.toFixed(2)}m
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Side Selector on Card */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Lado del Cajero:</span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCheckoutSide(idx, 'derecha');
                      }}
                      className={`py-1 px-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        curSide === 'derecha'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span>👉 Derecha</span>
                      {curSide === 'derecha' && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCheckoutSide(idx, 'izquierda');
                      }}
                      className={`py-1 px-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        curSide === 'izquierda'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span>👈 Izquierda</span>
                      {curSide === 'izquierda' && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-400 flex justify-between items-center pt-1.5 border-t border-slate-800/60">
                  <span>Pos: ({c.x.toFixed(1)}m, {c.z.toFixed(1)}m)</span>
                  <span>Rotación: {c.rotation}°</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
