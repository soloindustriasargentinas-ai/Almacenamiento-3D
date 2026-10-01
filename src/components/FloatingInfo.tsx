import React from 'react';
import { AppState, SelectionState } from '../types';
import {
  realGondolaCentralLineWidth,
  realGondolaParedLineWidth,
  realMinirackLineWidth,
  realShelfLineWidth,
} from '../utils/calculations';
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Trash2 } from 'lucide-react';

interface FloatingInfoProps {
  state: AppState;
  selection: SelectionState;
  onClose: () => void;
  onNudge: (dx: number, dz: number) => void;
  onRotate: () => void;
  onDelete: () => void;
  onSetGondolaCentralModuleHeight?: (lineIdx: number, modIdx: number, height: number) => void;
}

export const FloatingInfo: React.FC<FloatingInfoProps> = ({
  state,
  selection,
  onClose,
  onNudge,
  onRotate,
  onDelete,
  onSetGondolaCentralModuleHeight,
}) => {
  if (!selection.type || selection.idx === null) return null;

  let title = '';
  let subInfo = '';
  let colorBadge = 'border-amber-500 text-amber-400';
  let centralLineModules: { bl: number; height: number }[] | null = null;
  let curRot = 0;

  if (selection.type === 'minirack') {
    const line = state.lines[selection.idx];
    if (!line) return null;
    curRot = ((line.rotation || 0) % 360 + 360) % 360;
    title = `Minirack Línea ${selection.idx + 1}`;
    subInfo = `X: ${line.xOff.toFixed(1)}m · Z: ${line.zOff.toFixed(1)}m · Largo: ${realMinirackLineWidth(line).toFixed(2)}m · Giro: ${curRot}° · Alto: ${state.height}m`;
    colorBadge = 'border-amber-500 text-amber-400';
  } else if (selection.type === 'estanteria') {
    const line = state.shelfLines[selection.idx];
    if (!line) return null;
    curRot = ((line.rotation || 0) % 360 + 360) % 360;
    title = `Estantería Línea ${selection.idx + 1}`;
    subInfo = `X: ${line.xOff.toFixed(1)}m · Z: ${line.zOff.toFixed(1)}m · Largo: ${realShelfLineWidth(line).toFixed(2)}m · Giro: ${curRot}° · Alto: ${state.shelfHeight}m`;
    colorBadge = 'border-sky-500 text-sky-400';
  } else if (selection.type === 'gondolaPared') {
    const line = state.gondolaPared.lines[selection.idx];
    if (!line) return null;
    curRot = ((line.rotation || 0) % 360 + 360) % 360;
    const orientLabel =
      curRot === 0
        ? 'Pared Fondo (Estantes Sur)'
        : curRot === 90
        ? 'Pared Izq (Estantes Este)'
        : curRot === 180
        ? 'Pared Frente (Estantes Norte)'
        : 'Pared Der (Estantes Oeste)';
    title = `Góndola de Pared ${selection.idx + 1}`;
    subInfo = `X: ${line.xOff.toFixed(1)}m · Z: ${line.zOff.toFixed(1)}m · Largo: ${realGondolaParedLineWidth(line).toFixed(2)}m · ${orientLabel}`;
    colorBadge = 'border-rose-500 text-rose-400';
  } else if (selection.type === 'gondolaCentral') {
    const line = state.gondolaCentral.lines[selection.idx];
    if (!line) return null;
    curRot = ((line.rotation || 0) % 360 + 360) % 360;
    title = `Góndola Central ${selection.idx + 1} (Doble Faz)`;
    subInfo = `X: ${line.xOff.toFixed(1)}m · Z: ${line.zOff.toFixed(1)}m · Largo: ${realGondolaCentralLineWidth(line).toFixed(2)}m · Giro: ${curRot}°`;
    colorBadge = 'border-pink-500 text-pink-400';
    centralLineModules = line.modules.map((m) => ({
      bl: m.bl,
      height: m.height || line.height || 1.6,
    }));
  } else if (selection.type === 'obstacle') {
    const obs = state.obstacles[selection.idx];
    if (!obs) return null;
    curRot = ((obs.rotation || 0) % 360 + 360) % 360;
    title = obs.type === 'column' ? `▪ Columna ${selection.idx + 1}` : `⬡ Abertura / Hueco ${selection.idx + 1}`;
    subInfo = `X: ${obs.x.toFixed(1)}m · Z: ${obs.z.toFixed(1)}m · ${obs.type === 'column' ? `${obs.w}×${obs.d || obs.w}m` : `ancho ${obs.w}m`}`;
    colorBadge = 'border-cyan-500 text-cyan-400';
  } else if (selection.type === 'puntera') {
    const p = state.punteras?.[selection.idx];
    if (!p) return null;
    curRot = ((p.rotation || 0) % 360 + 360) % 360;
    title = `Puntera de Góndola ${selection.idx + 1}`;
    subInfo = `X: ${p.x.toFixed(1)}m · Z: ${p.z.toFixed(1)}m · Ancho: ${(p.width || 0.9).toFixed(2)}m · Alto: ${(p.height || 1.6).toFixed(2)}m · ${p.shelfCount || 4} estantes · Giro: ${curRot}°`;
    colorBadge = 'border-amber-500 text-amber-400';
  } else if (selection.type === 'heladera') {
    const h = state.heladeras?.[selection.idx];
    if (!h) return null;
    curRot = ((h.rotation || 0) % 360 + 360) % 360;
    const typeLabel = h.type === 'isla_congelados' ? 'Isla de Congelados' : h.type === 'mural_abierto' ? 'Mural Abierto' : 'Mural Vidrio Templado';
    title = `Heladera ${selection.idx + 1}: ${typeLabel}`;
    subInfo = `X: ${h.x.toFixed(1)}m · Z: ${h.z.toFixed(1)}m · ${h.width}m × ${h.depth}m × ${h.height}m · Color: ${h.color} · Giro: ${curRot}°`;
    colorBadge = 'border-cyan-500 text-cyan-400';
  } else if (selection.type === 'checkout') {
    const c = state.checkouts?.[selection.idx];
    if (!c) return null;
    curRot = ((c.rotation || 0) % 360 + 360) % 360;
    title = `Check Out / Caja ${selection.idx + 1}`;
    subInfo = `X: ${c.x.toFixed(1)}m · Z: ${c.z.toFixed(1)}m · Largo: ${c.length}m · Ancho: ${c.width}m · Escáner: ${c.scannerSide} · Giro: ${curRot}°`;
    colorBadge = 'border-emerald-500 text-emerald-400';
  } else if (selection.type === 'heavyRack') {
    const hr = state.heavyRacks?.lines?.[selection.idx];
    if (!hr) return null;
    curRot = ((hr.rotation || 0) % 360 + 360) % 360;
    const totalPallets = hr.modules.reduce((acc, m) => acc + (m.bl >= 3.0 ? 3 : 2) * (m.levels || 3), 0);
    title = `Rack Pesado Pallet Línea ${selection.idx + 1}`;
    subInfo = `X: ${hr.xOff.toFixed(1)}m · Z: ${hr.zOff.toFixed(1)}m · Alto: ${hr.height || state.heavyRacks.height}m · ${totalPallets} posiciones pallet · Giro: ${curRot}°`;
    colorBadge = 'border-orange-500 text-orange-400';
  } else if (selection.type === 'door') {
    const d = state.doors?.[selection.idx];
    if (!d) return null;
    curRot = ((d.rotation || 0) % 360 + 360) % 360;
    const isIndustrial = d.section === 'deposito' || d.type === 'porton_industrial';
    title = isIndustrial ? `Portón Industrial ${selection.idx + 1}` : `Puerta de Acceso ${selection.idx + 1}`;
    subInfo = `X: ${d.x.toFixed(1)}m · Z: ${d.z.toFixed(1)}m · Ancho: ${d.width}m · Alto: ${d.height}m · Giro: ${curRot}°`;
    colorBadge = 'border-blue-500 text-blue-400';
  }

  return (
    <div className="absolute top-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl min-w-[280px] max-w-sm text-xs">
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full bg-amber-400 animate-ping`} />
          <span className="font-extrabold text-sm text-slate-100">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 p-0.5 rounded"
          title="Deseleccionar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[11px] text-slate-400 font-medium mb-2.5">{subInfo}</div>

      {/* Góndola Central: Altura por módulo editable directamente */}
      {centralLineModules && selection.type === 'gondolaCentral' && (
        <div className="mb-3 p-2 bg-slate-950/70 rounded-xl border border-pink-900/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 block mb-1.5">
            Altura por Módulo Central:
          </span>
          <div className="space-y-1.5">
            {centralLineModules.map((m, mi) => (
              <div key={mi} className="flex items-center justify-between gap-1 text-[11px] bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-semibold">Mód {mi + 1} ({m.bl}m):</span>
                <div className="flex items-center gap-1">
                  {[1.2, 1.6, 1.75, 2.0].map((h) => {
                    const isSelected = m.height === h;
                    return (
                      <button
                        key={h}
                        onClick={() => onSetGondolaCentralModuleHeight?.(selection.idx!, mi, h)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-pink-500 text-slate-950 shadow-sm ring-1 ring-pink-300'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                        title={`Seleccionar altura de ${h}m para el módulo ${mi + 1}`}
                      >
                        {h}m
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Quick Nudge and Action Controls */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNudge(-0.1, 0)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60"
            title="Mover Izquierda (X-)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onNudge(0, -0.1)}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60"
              title="Mover Arriba (Z-)"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onNudge(0, 0.1)}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60"
              title="Mover Abajo (Z+)"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => onNudge(0.1, 0)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60"
            title="Mover Derecha (X+)"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onRotate}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700/60 flex items-center gap-1 font-semibold"
            title={`Girar 90° (actual: ${curRot}°, siguiente: ${(curRot + 90) % 360}°)`}
          >
            <RotateCw className="w-3.5 h-3.5" /> Rotar ({curRot}°)
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg border border-rose-800/40"
            title="Eliminar elemento seleccionado (Supr)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
