import React, { useState } from 'react';
import { AppState, CheckoutCounter, SelectionState } from '../../types';
import { findOpenPlacementSpot } from '../../utils/calculations';
import { CreditCard, Plus, RotateCw, Trash2, ArrowLeftRight } from 'lucide-react';

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
  const [newLength, setNewLength] = useState<number>(2.20);
  const [newWidth, setNewWidth] = useState<number>(1.10);
  const [newSide, setNewSide] = useState<'derecha' | 'izquierda'>('derecha');

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

  return (
    <div className="space-y-4">
      {/* Header & Add */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Check Outs / Líneas de Caja</h3>
            <p className="text-[11px] text-slate-400">Puestos de cobro con cinta y rampa para clientes</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-2.5 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Largo del Check Out:</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { l: 1.80, label: '1.80m (Compacto)' },
                { l: 2.20, label: '2.20m (Estándar)' },
                { l: 2.60, label: '2.60m (Hiper)' },
              ].map(({ l, label }) => (
                <button
                  key={l}
                  onClick={() => setNewLength(l)}
                  className={`py-1.5 px-1 rounded font-bold text-center transition-all ${
                    newLength === l
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Lado del Cajero / Escáner:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { side: 'derecha' as const, label: 'Salida Derecha' },
                { side: 'izquierda' as const, label: 'Salida Izquierda' },
              ].map((s) => (
                <button
                  key={s.side}
                  onClick={() => setNewSide(s.side)}
                  className={`py-1.5 rounded font-bold transition-all ${
                    newSide === s.side
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
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
            return (
              <div
                key={c.id || idx}
                onClick={() => onSelect({ type: 'checkout', idx })}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-emerald-950/30 border-emerald-500/80 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      C#{idx + 1}
                    </span>
                    <strong className="text-slate-200">
                      Check Out {c.length}m (Lado {c.scannerSide})
                    </strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSide(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-emerald-400 text-slate-400"
                      title="Invertir Lado Cajero"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateCheckout(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-emerald-400 text-slate-400"
                      title="Rotar 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCheckout(idx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-rose-400 text-slate-400"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Pos: ({c.x.toFixed(1)}m, {c.z.toFixed(1)}m) · Rot: {c.rotation}°</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {c.length.toFixed(2)}m × {c.width.toFixed(2)}m
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
