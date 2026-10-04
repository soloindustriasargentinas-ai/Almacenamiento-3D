import React from 'react';
import { AppState, SelectionState, CheckoutCounter } from '../types';
import {
  realGondolaCentralLineWidth,
  realGondolaParedLineWidth,
  realMinirackLineWidth,
  realShelfLineWidth,
} from '../utils/calculations';
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Trash2, Check, Copy } from 'lucide-react';

interface FloatingInfoProps {
  state: AppState;
  selection: SelectionState;
  onClose: () => void;
  onNudge: (dx: number, dz: number) => void;
  onRotate: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onSetGondolaCentralModuleHeight?: (lineIdx: number, modIdx: number, height: number) => void;
  onSetGondolaCentralLineHeight?: (lineIdx: number, height: number) => void;
  onUpdateCheckout?: (idx: number, patch: Partial<CheckoutCounter>) => void;
}

export const FloatingInfo: React.FC<FloatingInfoProps> = ({
  state,
  selection,
  onClose,
  onNudge,
  onRotate,
  onDelete,
  onDuplicate,
  onSetGondolaCentralModuleHeight,
  onSetGondolaCentralLineHeight,
  onUpdateCheckout,
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
    const typeLabel = h.type === 'mostrador' ? 'Heladera Mostrador Vitrina' : h.type === 'isla_congelados' ? 'Isla de Congelados' : h.type === 'mural_abierto' ? 'Mural Abierto' : 'Mural Vidrio Templado';
    title = `Heladera ${selection.idx + 1}: ${typeLabel}`;
    subInfo = `X: ${h.x.toFixed(1)}m · Z: ${h.z.toFixed(1)}m · ${h.width}m × ${h.depth}m × ${h.height}m · Color: ${h.color} · Giro: ${curRot}°`;
    colorBadge = 'border-cyan-500 text-cyan-400';
  } else if (selection.type === 'checkout') {
    const c = state.checkouts?.[selection.idx];
    if (!c) return null;
    curRot = ((c.rotation || 0) % 360 + 360) % 360;
    title = `Check Out / Caja ${selection.idx + 1}`;
    subInfo = `X: ${c.x.toFixed(1)}m · Z: ${c.z.toFixed(1)}m · Largo: ${c.length.toFixed(2)}m · Ancho: ${c.width.toFixed(2)}m · Cajero: ${c.scannerSide || 'derecha'} · Giro: ${curRot}°`;
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

      {/* Góndola Central: Altura de línea y por módulo editable directamente */}
      {centralLineModules && selection.type === 'gondolaCentral' && (
        <div className="mb-3 p-2.5 bg-slate-950/70 rounded-xl border border-pink-900/40 space-y-2">
          {/* Altura de toda la línea */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                Altura Toda la Línea:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {state.gondolaCentral.lines[selection.idx!]?.height || 1.6}m
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { h: 1.2, label: '1.20m', shelves: '3 est.' },
                { h: 1.6, label: '1.60m', shelves: '4 est.' },
                { h: 1.75, label: '1.75m', shelves: '4 est.' },
                { h: 2.0, label: '2.00m', shelves: '5 est.' },
              ].map((opt) => {
                const curH = state.gondolaCentral.lines[selection.idx!]?.height || 1.6;
                const isSelected = Math.abs(curH - opt.h) < 0.05;
                return (
                  <button
                    key={opt.h}
                    onClick={() => onSetGondolaCentralLineHeight?.(selection.idx!, opt.h)}
                    className={`py-1 px-1 rounded text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pink-500 text-slate-950 font-black shadow-sm ring-1 ring-pink-300'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-semibold'
                    }`}
                    title={`Fijar altura ${opt.h}m: ${opt.shelves} en ambos lados`}
                  >
                    <div className="text-[10px] leading-tight font-bold">{opt.label}</div>
                    <div className={`text-[8.5px] ${isSelected ? 'text-slate-950 font-black' : 'text-slate-400'}`}>
                      {opt.shelves}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Altura por Módulo Individual */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Altura por Módulo:
            </span>
            <div className="space-y-1">
              {centralLineModules.map((m, mi) => (
                <div key={mi} className="flex items-center justify-between gap-1 text-[10px] bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-semibold">Mód {mi + 1} ({m.bl}m):</span>
                  <div className="flex items-center gap-0.5">
                    {[
                      { h: 1.2, label: '1.2m', s: '3' },
                      { h: 1.6, label: '1.6m', s: '4' },
                      { h: 1.75, label: '1.75m', s: '4' },
                      { h: 2.0, label: '2.0m', s: '5' },
                    ].map((opt) => {
                      const isSelected = Math.abs(m.height - opt.h) < 0.05;
                      return (
                        <button
                          key={opt.h}
                          onClick={() => onSetGondolaCentralModuleHeight?.(selection.idx!, mi, opt.h)}
                          className={`px-1 py-0.5 rounded text-[9px] font-bold transition-all ${
                            isSelected
                              ? 'bg-pink-500 text-slate-950 shadow-sm ring-1 ring-pink-300 font-black'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                          }`}
                          title={`Fijar módulo ${mi + 1} a ${opt.h}m (${opt.s} estantes por lado)`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Check Out: Largo y Lado del Cajero editables directamente */}
      {selection.type === 'checkout' && state.checkouts?.[selection.idx] && (
        <div className="mb-3 p-2.5 bg-slate-950/70 rounded-xl border border-emerald-900/40 space-y-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Largo de la Caja:
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[1.60, 1.80, 2.00].map((len) => {
                const curLen = state.checkouts![selection.idx!].length;
                const isSelected = Math.abs(curLen - len) < 0.05;
                return (
                  <button
                    key={len}
                    onClick={() => onUpdateCheckout?.(selection.idx!, { length: len })}
                    className={`py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-300 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {len.toFixed(2)}m
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Lado del Cajero:
            </span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { side: 'derecha' as const, label: '👉 Derecha' },
                { side: 'izquierda' as const, label: '👈 Izquierda' },
              ].map((s) => {
                const curSide = state.checkouts![selection.idx!].scannerSide || 'derecha';
                const isSelected = curSide === s.side;
                return (
                  <button
                    key={s.side}
                    onClick={() => onUpdateCheckout?.(selection.idx!, { scannerSide: s.side })}
                    className={`py-1 px-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-300 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
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
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg border border-slate-700/60 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              title="Duplicar línea o elemento seleccionado completo"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicar
            </button>
          )}
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
