import React, { useEffect, useState } from 'react';
import { AisleMeasurement, NpcSimulationState, BottleneckPoint } from '../utils/cartWalkthrough';
import {
  Gamepad2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Camera,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  X,
  Gauge,
  Zap,
  MapPin,
  LogOut,
  ChevronRight,
  Navigation,
} from 'lucide-react';

export type CameraWalkthroughMode = 'third_person' | 'top_down' | 'first_person';

interface CartWalkthroughOverlayProps {
  active: boolean;
  cameraMode: CameraWalkthroughMode;
  onSetCameraMode: (mode: CameraWalkthroughMode) => void;
  aisle: AisleMeasurement;
  npcState: NpcSimulationState;
  onStartNpcTest: () => void;
  onResetPosition: () => void;
  onClose: () => void;
  blockedWarning: string | null;
  onClearBlockedWarning?: () => void;
  onMoveCommand: (action: 'forward' | 'backward' | 'left' | 'right' | 'stop') => void;
  bottlenecks: BottleneckPoint[];
  showBottlenecks: boolean;
  onToggleBottlenecks: () => void;
  isMoving: boolean;
  onTeleport?: (x: number, z: number, heading: number) => void;
  onQuickTeleport?: (preset: 'central1' | 'central2' | 'pared' | 'cajas' | 'entrada') => void;
  walkthroughSpeed: 'normal' | 'turbo';
  onSetWalkthroughSpeed: (speed: 'normal' | 'turbo') => void;
}

export const CartWalkthroughOverlay: React.FC<CartWalkthroughOverlayProps> = ({
  active,
  cameraMode,
  onSetCameraMode,
  aisle,
  npcState,
  onStartNpcTest,
  onResetPosition,
  onClose,
  blockedWarning,
  onClearBlockedWarning,
  onMoveCommand,
  bottlenecks,
  showBottlenecks,
  onToggleBottlenecks,
  isMoving,
  onTeleport,
  onQuickTeleport,
  walkthroughSpeed,
  onSetWalkthroughSpeed,
}) => {
  if (!active) return null;

  // Local state for smooth visual countdown (7s) on status banners
  const [legendVisible, setLegendVisible] = useState(false);

  useEffect(() => {
    if (npcState.result === 'approved' || npcState.result === 'failed' || blockedWarning) {
      setLegendVisible(true);
    } else {
      setLegendVisible(false);
    }
  }, [npcState.result, blockedWarning]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 font-sans select-none overflow-hidden flex">
      {/* ══════════════════════════════════════════════════════════════════
          1. LEFT GAMING & INSPECTION SIDEBAR (Replaces Standard Sidebar)
         ══════════════════════════════════════════════════════════════════ */}
      <aside className="w-80 sm:w-92 h-full bg-slate-950/95 backdrop-blur-xl border-r border-slate-800 shadow-2xl flex flex-col pointer-events-auto z-40 text-slate-200 shrink-0">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                <span>VISTA PASILLO GAME</span>
              </div>
              <div className="text-[10px] text-pink-300 font-medium">Auditoría y Simulación 3D</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700/60 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Volver al modo de diseño normal (Tecla Esc)"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
          {/* ── SECCIÓN 1: ACCIÓN PRINCIPAL - COMPROBAR PASILLO (CRUCE 2 PERSONAS) ── */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-3 rounded-2xl border border-pink-500/30 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-pink-300 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-pink-400" />
                <span>Prueba de Cruce</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Tecla: Espacio / C</span>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              Comprueba si 2 personas con carro pueden cruzarse en sentido contrario en este pasillo sin colisionar.
            </p>

            <button
              onClick={onStartNpcTest}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-pink-600/30 border border-pink-400/40 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer ring-1 ring-pink-300/30"
            >
              <ShieldCheck className="w-4 h-4 text-pink-200" />
              <span>Comprobar Pasillo (Cruce 2 personas)</span>
            </button>

            {/* Test status summary */}
            {npcState.active ? (
              <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/50 text-[11px] text-blue-200 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-semibold">{npcState.message || 'Comprobando cruce en vivo...'}</span>
              </div>
            ) : npcState.result === 'approved' ? (
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-[11px] text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">✅ Pasillo Aprobado ({aisle.freeWidth.toFixed(2)}m)</span>
              </div>
            ) : npcState.result === 'failed' ? (
              <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/60 text-[11px] text-rose-200 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">❌ Corregir Pasillo (Espacio insuficiente)</span>
              </div>
            ) : null}
          </div>

          {/* ── SECCIÓN 2: RADAR DE PASILLO EN VIVO ── */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-200 uppercase tracking-wide">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>Radar en Vivo</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  aisle.status === 'optimal'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : aisle.status === 'tight'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : aisle.status === 'pmr_only'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {aisle.status === 'optimal'
                  ? '🟢 Cruce Óptimo'
                  : aisle.status === 'tight'
                  ? '🟡 Paso 1 Carro'
                  : aisle.status === 'pmr_only'
                  ? '🟠 PMR Mínimo'
                  : '🔴 Bloqueado'}
              </span>
            </div>

            {/* Main digital gauge display */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Ancho Libre Pasillo</div>
                <div
                  className={`font-mono text-2xl font-black ${
                    aisle.freeWidth >= 1.20 ? 'text-emerald-400' : aisle.freeWidth >= 0.90 ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {aisle.freeWidth.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">m</span>
                </div>
              </div>

              <div className="text-right text-[11px]">
                <div className="text-slate-400">Gálibo Cruce:</div>
                <div className={aisle.canTwoCartsPass ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
                  {aisle.canTwoCartsPass ? '✓ Cruce Viable (≥1.20m)' : '✗ Estrecho (<1.20m)'}
                </div>
              </div>
            </div>

            {/* Flanking Distances Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400 truncate">{aisle.leftObstacle || 'Góndola Izq.'}</div>
                <div className="font-mono text-sm font-bold text-sky-400">{aisle.leftDist.toFixed(2)}m</div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400 truncate">{aisle.rightObstacle || 'Góndola Der.'}</div>
                <div className="font-mono text-sm font-bold text-sky-400">{aisle.rightDist.toFixed(2)}m</div>
              </div>
            </div>

            {/* Turning Radius Diagnostic */}
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Radio giro esquinas:</span>
              <span className="font-mono font-bold text-sky-300">
                {Math.max(0.65, aisle.freeWidth * 0.85).toFixed(2)} m {aisle.freeWidth >= 1.20 ? '(Óptimo 90°)' : '(Ajustado)'}
              </span>
            </div>
          </div>

          {/* ── SECCIÓN 3: AUDITORÍA GLOBAL DE PASILLOS ── */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-300 tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Auditoría de Pasillos</span>
              </span>
              <button
                onClick={onToggleBottlenecks}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md text-[10px] font-bold transition-colors cursor-pointer border border-amber-500/30"
              >
                {showBottlenecks ? 'Ocultar' : 'Escanear Salón'}
              </button>
            </div>

            {showBottlenecks ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {bottlenecks.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300 text-center font-medium">
                    ✓ No se detectaron cuellos de botella estrechos. ¡Pasillos conformes!
                  </div>
                ) : (
                  bottlenecks.map((b, bi) => (
                    <div
                      key={bi}
                      className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${
                        b.severity === 'critical'
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                          : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>Paso #{bi + 1}</span>
                          <span className="font-mono text-white text-[10px] px-1 bg-slate-900 rounded border border-slate-700">
                            {b.width} m
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300">{b.description}</div>
                      </div>

                      {onTeleport && (
                        <button
                          onClick={() => onTeleport(b.x, b.z, 0)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm cursor-pointer shrink-0 ml-2 active:scale-95"
                          title="Teletransportar el carro directamente a este paso"
                        >
                          Ir al Paso
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Audita automáticamente todo el salón y detecta cualquier paso menor a 1.20 m o que incumpla accesibilidad.
              </p>
            )}
          </div>

          {/* ── SECCIÓN 4: SELECTOR DE MODO DE CÁMARA ── */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Modo de Cámara</span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => onSetCameraMode('third_person')}
                className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  cameraMode === 'third_person'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-400'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Cámara 3D en Tercera Persona (detrás del carrito)"
              >
                <Camera className="w-4 h-4" />
                <span>3D</span>
              </button>
              <button
                onClick={() => onSetCameraMode('top_down')}
                className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  cameraMode === 'top_down'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40 border border-amber-400'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Cámara Cenital (Vista Superior del plano como videojuego táctico)"
              >
                <Layers className="w-4 h-4" />
                <span className="text-[11px]">Superior</span>
              </button>
              <button
                onClick={() => onSetCameraMode('first_person')}
                className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  cameraMode === 'first_person'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Cámara en Primera Persona (sobre el manillar del carrito)"
              >
                <Eye className="w-4 h-4" />
                <span>1ª Persona</span>
              </button>
            </div>
          </div>

          {/* ── SECCIÓN 5: TELETRANSPORTE RÁPIDO A PASILLOS ── */}
          {onQuickTeleport && (
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Ir Rápido a Pasillo</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  onClick={() => onQuickTeleport('central1')}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-medium transition-all text-left flex items-center justify-between cursor-pointer"
                >
                  <span>Pasillo Central 1</span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </button>
                <button
                  onClick={() => onQuickTeleport('central2')}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-medium transition-all text-left flex items-center justify-between cursor-pointer"
                >
                  <span>Pasillo Central 2</span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </button>
                <button
                  onClick={() => onQuickTeleport('pared')}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-medium transition-all text-left flex items-center justify-between cursor-pointer"
                >
                  <span>Pasillo Pared</span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </button>
                <button
                  onClick={() => onQuickTeleport('cajas')}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-medium transition-all text-left flex items-center justify-between cursor-pointer"
                >
                  <span>Cajas Checkout</span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            </div>
          )}

          {/* ── SECCIÓN 6: VELOCIDAD Y RESET ── */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>Velocidad</span>
              </span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => onSetWalkthroughSpeed('normal')}
                  className={`flex-1 py-1 rounded font-bold text-[10px] transition-colors cursor-pointer ${
                    walkthroughSpeed === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1.8 m/s
                </button>
                <button
                  onClick={() => onSetWalkthroughSpeed('turbo')}
                  className={`flex-1 py-1 rounded font-bold text-[10px] transition-colors cursor-pointer ${
                    walkthroughSpeed === 'turbo' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Turbo
                </button>
              </div>
            </div>

            <button
              onClick={onResetPosition}
              className="bg-slate-900/80 hover:bg-slate-800 p-2.5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white font-bold transition-all cursor-pointer"
              title="Volver a la posición inicial en pasillo abierto (Tecla R)"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
              <span className="text-[11px]">Reset Posición</span>
            </button>
          </div>

          {/* Guía de Teclas y Controles */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300">Controles & Conducción:</div>
            <div>• <strong className="text-pink-300">🖱️ Cursor del Mouse</strong>: Clic o arrastrar en el piso para mover el carrito</div>
            <div>• <strong className="text-white">W, A, S, D</strong> / <strong className="text-white">Flechas</strong>: Conducir</div>
            <div>• <strong className="text-white">Espacio / C</strong>: Comprobar cruce de 2 personas</div>
            <div>• <strong className="text-white">1, 2, 3 / V</strong>: Cambiar vista (3D / Superior / 1ª Persona)</div>
            <div>• <strong className="text-white">R</strong>: Resetear posición · <strong className="text-white">Esc</strong>: Salir</div>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
          2. MAIN 3D WORKSPACE HUD OVERLAY (TOP NOTIFICATIONS & ON-SCREEN CONTROLS)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-between p-4 pointer-events-none">
        {/* TOP CENTER: 7-Second Status Banners */}
        <div className="flex flex-col items-center gap-2 max-w-xl mx-auto w-full">
          {npcState.result === 'approved' ? (
            <div className="pointer-events-auto w-full bg-emerald-600/95 text-white p-3.5 rounded-2xl shadow-2xl backdrop-blur-md border-2 border-emerald-300 flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 shrink-0 text-emerald-100" />
                <div className="flex-1">
                  <div className="font-black text-sm tracking-wider uppercase text-emerald-100 flex items-center justify-between">
                    <span>✅ PASILLO APROBADO</span>
                    <span className="text-[10px] font-mono text-emerald-200">7s</span>
                  </div>
                  <div className="text-xs text-white font-medium mt-0.5">
                    Ancho libre verificado: <strong className="font-bold text-emerald-200">{aisle.freeWidth.toFixed(2)} m</strong>. Cruce bidireccional exitoso sin colisiones.
                  </div>
                </div>
                <button
                  onClick={onStartNpcTest}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                >
                  Recomprobar
                </button>
              </div>
              {/* 7-Second Visual Progress Line */}
              <div className="w-full h-1 bg-emerald-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-200 animate-[shrink_7s_linear_forwards]" style={{ animation: 'shrink 7s linear forwards' }} />
              </div>
            </div>
          ) : npcState.result === 'failed' ? (
            <div className="pointer-events-auto w-full bg-rose-600/95 text-white p-3.5 rounded-2xl shadow-2xl backdrop-blur-md border-2 border-rose-300 flex flex-col gap-2 animate-bounce">
              <div className="flex items-center gap-3">
                <XCircle className="w-7 h-7 shrink-0 text-rose-100" />
                <div className="flex-1">
                  <div className="font-black text-sm tracking-wider uppercase text-rose-100 flex items-center justify-between">
                    <span>❌ CORREGIR PASILLO</span>
                    <span className="text-[10px] font-mono text-rose-200">7s</span>
                  </div>
                  <div className="text-xs text-white font-medium mt-0.5">
                    Espacio insuficiente (<strong className="font-bold text-rose-200">{aisle.freeWidth.toFixed(2)} m</strong>). Se requiere mín. 1.20 m para cruce doble simultáneo. Separe las góndolas.
                  </div>
                </div>
                <button
                  onClick={onStartNpcTest}
                  className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                >
                  Reintentar
                </button>
              </div>
              {/* 7-Second Visual Progress Line */}
              <div className="w-full h-1 bg-rose-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-200 animate-[shrink_7s_linear_forwards]" style={{ animation: 'shrink 7s linear forwards' }} />
              </div>
            </div>
          ) : blockedWarning ? (
            <div className="pointer-events-auto w-full bg-amber-500/95 text-slate-950 p-3 rounded-2xl shadow-2xl backdrop-blur-md border-2 border-amber-300 flex flex-col gap-1.5 animate-pulse">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-6 h-6 shrink-0 text-amber-950" />
                <div className="flex-1">
                  <div className="font-black text-xs tracking-wider uppercase text-amber-950 flex items-center justify-between">
                    <span>ESPACIO BLOQUEADO</span>
                    <span className="text-[10px] font-mono text-amber-900">7s</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{blockedWarning}</div>
                </div>
                {onClearBlockedWarning && (
                  <button onClick={onClearBlockedWarning} className="text-amber-950 hover:text-black p-1 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* 7-Second Visual Progress Line */}
              <div className="w-full h-1 bg-amber-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-950 animate-[shrink_7s_linear_forwards]" style={{ animation: 'shrink 7s linear forwards' }} />
              </div>
            </div>
          ) : npcState.active ? (
            <div className="pointer-events-auto bg-blue-600/95 text-white px-5 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border border-blue-400 flex items-center gap-3 animate-pulse">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-300 animate-ping" />
              <div>
                <div className="font-extrabold text-xs uppercase tracking-wide">COMPROBANDO PASILLO EN VIVO...</div>
                <div className="text-xs font-medium text-blue-100">{npcState.message}</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* BOTTOM RIGHT: On-Screen Touch / Mouse Steering D-Pad */}
        <div className="self-end pointer-events-auto flex flex-col items-center gap-1 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-2xl">
          <button
            onMouseDown={() => onMoveCommand('forward')}
            onMouseUp={() => onMoveCommand('stop')}
            onTouchStart={() => onMoveCommand('forward')}
            onTouchEnd={() => onMoveCommand('stop')}
            className="w-11 h-11 bg-slate-800 hover:bg-pink-600 active:bg-pink-700 text-white rounded-xl flex items-center justify-center font-bold shadow-md transition-all cursor-pointer"
            title="Avanzar (W / Flecha Arriba)"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex gap-1">
            <button
              onMouseDown={() => onMoveCommand('left')}
              onMouseUp={() => onMoveCommand('stop')}
              onTouchStart={() => onMoveCommand('left')}
              onTouchEnd={() => onMoveCommand('stop')}
              className="w-11 h-11 bg-slate-800 hover:bg-pink-600 active:bg-pink-700 text-white rounded-xl flex items-center justify-center font-bold shadow-md transition-all cursor-pointer"
              title="Girar Izquierda (A / Flecha Izquierda)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onMouseDown={() => onMoveCommand('backward')}
              onMouseUp={() => onMoveCommand('stop')}
              onTouchStart={() => onMoveCommand('backward')}
              onTouchEnd={() => onMoveCommand('stop')}
              className="w-11 h-11 bg-slate-800 hover:bg-pink-600 active:bg-pink-700 text-white rounded-xl flex items-center justify-center font-bold shadow-md transition-all cursor-pointer"
              title="Retroceder (S / Flecha Abajo)"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onMouseDown={() => onMoveCommand('right')}
              onMouseUp={() => onMoveCommand('stop')}
              onTouchStart={() => onMoveCommand('right')}
              onTouchEnd={() => onMoveCommand('stop')}
              className="w-11 h-11 bg-slate-800 hover:bg-pink-600 active:bg-pink-700 text-white rounded-xl flex items-center justify-center font-bold shadow-md transition-all cursor-pointer"
              title="Girar Derecha (D / Flecha Derecha)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
