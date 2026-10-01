import React, { useState } from 'react';
import { AppState, CommercialDoor, SelectionState } from '../../types';
import { findOpenPlacementSpot } from '../../utils/calculations';
import { DoorOpen, DoorClosed, Plus, RotateCw, Trash2 } from 'lucide-react';

interface PuertasTabProps {
  state: AppState;
  selection: SelectionState;
  onSelect: (sel: SelectionState) => void;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const PuertasTab: React.FC<PuertasTabProps> = ({
  state,
  selection,
  onSelect,
  onUpdateState,
}) => {
  const isSalon = state.activeSection === 'salon';

  const [newWidth, setNewWidth] = useState<number>(isSalon ? 2.00 : 3.00);
  const [newHeight, setNewHeight] = useState<number>(isSalon ? 2.20 : 3.50);

  const addDoor = () => {
    onUpdateState((prev) => {
      const spot = findOpenPlacementSpot(prev, newWidth, 0.4);

      const item: CommercialDoor = {
        id: Date.now(),
        x: spot.x,
        z: spot.z,
        rotation: 0,
        section: prev.activeSection,
        type: isSalon ? 'vidrio_doble' : 'porton_industrial',
        width: newWidth,
        height: newHeight,
      };

      const doors = [...(prev.doors || []), item];
      return { ...prev, doors };
    });
  };

  const removeDoor = (idx: number) => {
    onUpdateState((prev) => {
      const doors = (prev.doors || []).filter((_, i) => i !== idx);
      return { ...prev, doors };
    });
    if (selection.type === 'door' && selection.idx === idx) {
      onSelect({ type: null, idx: null });
    }
  };

  const rotateDoor = (idx: number) => {
    onUpdateState((prev) => {
      const doors = [...(prev.doors || [])];
      if (!doors[idx]) return prev;
      const curRot = doors[idx].rotation || 0;
      doors[idx] = {
        ...doors[idx],
        rotation: (curRot + 90) % 360,
      };
      return { ...prev, doors };
    });
  };

  const relevantDoors = (state.doors || []).map((d, idx) => ({ door: d, originalIdx: idx }));

  return (
    <div className="space-y-4">
      {/* Header & Add */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            {isSalon ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">
              {isSalon ? 'Puertas de Acceso al Salón' : 'Portones de Carga y Descarga'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isSalon
                ? 'Puertas comerciales dobles de vidrio y acceso de clientes'
                : 'Portones seccionales industriales para maniobra y autoelevadores'}
            </p>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-2.5 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Ancho de Abertura:</label>
            <div className="grid grid-cols-3 gap-1">
              {(isSalon ? [1.60, 2.00, 2.40] : [2.50, 3.00, 4.00]).map((w) => (
                <button
                  key={w}
                  onClick={() => setNewWidth(w)}
                  className={`py-1.5 rounded font-bold transition-all ${
                    newWidth === w
                      ? 'bg-blue-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {w.toFixed(2)}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Altura Libre:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(isSalon ? [2.10, 2.40] : [3.50, 4.50]).map((h) => (
                <button
                  key={h}
                  onClick={() => setNewHeight(h)}
                  className={`py-1.5 rounded font-bold transition-all ${
                    newHeight === h
                      ? 'bg-blue-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {h.toFixed(2)}m
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={addDoor}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isSalon ? 'Agregar Puerta Comercial' : 'Agregar Portón Industrial'}</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Aberturas Instaladas ({relevantDoors.length})
        </span>

        {relevantDoors.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-xs">
            No hay puertas ni portones agregados aún. Haz clic en el botón superior para colocar una.
          </div>
        ) : (
          relevantDoors.map(({ door, originalIdx }) => {
            const isSel = selection.type === 'door' && selection.idx === originalIdx;
            return (
              <div
                key={door.id || originalIdx}
                onClick={() => onSelect({ type: 'door', idx: originalIdx })}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-blue-950/30 border-blue-500/80 shadow-md shadow-blue-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                      P#{originalIdx + 1}
                    </span>
                    <strong className="text-slate-200">
                      {door.section === 'salon' ? 'Puerta Vidriada' : 'Portón Industrial'} {door.width}m × {door.height}m
                    </strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateDoor(originalIdx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-blue-400 text-slate-400"
                      title="Rotar 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDoor(originalIdx);
                      }}
                      className="p-1 rounded bg-slate-800 hover:text-rose-400 text-slate-400"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Pos: ({door.x.toFixed(1)}m, {door.z.toFixed(1)}m) · Rot: {door.rotation}°</span>
                  <span className="capitalize text-blue-400 font-mono text-[10px]">
                    {door.section}
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
