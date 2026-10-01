import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  Building2, 
  Users, 
  FolderKanban, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  LogIn, 
  Eye, 
  Cpu, 
  Boxes, 
  Check,
  Store,
  ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onGoToAdmin: () => void;
  onGoTo3D: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToAdmin, onGoTo3D }) => {
  const { user, profile, signInWithGoogle, signInAsGuest, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      setShowLoginModal(false);
      onGoToAdmin();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInAsGuest(
        guestEmail || 'usuario@industrias.com', 
        guestName || 'Operador Comercial'
      );
      setShowLoginModal(false);
      onGoToAdmin();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickGuest = async () => {
    setIsSubmitting(true);
    try {
      await signInAsGuest('invitado@industria.com', 'Operador Invitado');
      setShowLoginModal(false);
      onGoToAdmin();
    } catch (e) {
      console.error(e);
      setShowLoginModal(false);
      onGoTo3D();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                Rack3D Pro Studio
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/60">
                Cloud v2.5
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Características</a>
            <a href="#gondolas" className="hover:text-blue-400 transition-colors">Góndolas & Racks</a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">Suscripciones</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToAdmin}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Mi Panel Admin</span>
                </button>
                <button
                  onClick={onGoTo3D}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Visualizador 3D</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-blue-400" />
                  <span>Ingresar</span>
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all"
                >
                  Prueba Gratis
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-700/60 text-blue-300 text-xs font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>1 Única Suscripción Unificada: Acceso Total a Salón y Depósito</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Diseña Locales y Almacenes en <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-blue-400 bg-clip-text text-transparent">3D Interactivo</span>
            </h1>

            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              La plataforma ahora se divide en <strong>2 secciones especializadas</strong> con menús de comando adaptados: <strong>Salón Comercial</strong> (góndolas, punteras, heladeras, check outs) y <strong>Depósito Industrial</strong> (racks pesados para pallets, miniracks, estanterías, portones).
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/70 border border-rose-700/60 text-rose-200 text-xs font-semibold">
                <Store className="w-4 h-4 text-rose-400" />
                <span>Salón: Góndolas Pared y Central, Punteras, Heladeras, Check Outs</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-950/70 border border-blue-700/60 text-blue-200 text-xs font-semibold">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Depósito: Racks Pesados, Racks Livianos, Estanterías, Portones</span>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  if (user) onGoToAdmin();
                  else setShowLoginModal(true);
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Acceder al Panel Admin</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onGoTo3D}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-5 h-5 text-emerald-400" />
                <span>Explorar Visualizador 3D</span>
              </button>
            </div>

            {/* Quick Badges */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Límites estrictos de depósito</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Anticolisión física 3D</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Alturas por módulo</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Base de Clientes & Proyectos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-16 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Herramientas de Diseño de Precisión Industrial
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Separamos la gestión comercial en un panel administrativo y mantenemos el visualizador 3D a pantalla completa para máximo rendimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-blue-700/60 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Panel Admin Comercial</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Administra tus proyectos de almacenes, asocia planos a clientes comerciales, duplica configuraciones y descarga cotizaciones técnicas.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span> Base de datos sincronizada en la nube
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span> Métricas de superficie m² y bandejas
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-amber-700/60 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Visualizador 3D en Pantalla Completa</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Entorno 3D con Three.js optimizado, renderizado realista, modos de vista perspectiva/planta/frontal y transiciones fluidas de cámara.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> Arrastre con fijación a límites
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> Sin superposición de productos
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-emerald-700/60 transition-colors shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cartera de Clientes</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Registra los datos de contacto, direcciones de obra y especificaciones de cada cliente para generar propuestas personalizadas con un clic.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Historial de proyectos por cliente
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Acceso rápido directo a WhatsApp
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Racks & Gondolas Section */}
      <section id="gondolas" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Líneas de Equipamiento Disponibles
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Configura módulos individuales o líneas continuas compartiendo columnas de apoyo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Salón 1: Góndolas Pared y Centrales */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-rose-900/40 hover:border-rose-700/60 transition-colors">
              <div className="text-rose-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" /> Salón Comercial
              </div>
              <div className="text-white font-semibold text-base mb-1">Góndolas de Pared & Centrales</div>
              <p className="text-xs text-slate-400 mb-3">Simple faz perimetral y doble faz isla con bandejas regulables y fondo perforado.</p>
              <span className="text-[11px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">Supermercados & Retail</span>
            </div>

            {/* Salón 2: Punteras, Heladeras y Check Outs */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-pink-900/40 hover:border-pink-700/60 transition-colors">
              <div className="text-pink-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" /> Salón Comercial
              </div>
              <div className="text-white font-semibold text-base mb-1">Punteras, Heladeras & Check Outs</div>
              <p className="text-xs text-slate-400 mb-3">Cabeceras de pasillo, vitrinas e islas refrigeradas comerciales y puestos de cobro registradores.</p>
              <span className="text-[11px] font-mono bg-pink-950 text-pink-300 px-2 py-0.5 rounded border border-pink-800">Puntos de Venta</span>
            </div>

            {/* Depósito 1: Racks Pesados */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-orange-900/40 hover:border-orange-700/60 transition-colors">
              <div className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Depósito Industrial
              </div>
              <div className="text-white font-semibold text-base mb-1">Racks Pesados Selectivos</div>
              <p className="text-xs text-slate-400 mb-3">Almacenamiento de pallets pesados (2.30m, 2.70m, 3.30m) con múltiples niveles y capacidad de toneladas.</p>
              <span className="text-[11px] font-mono bg-orange-950 text-orange-300 px-2 py-0.5 rounded border border-orange-800">Logística & Pallets</span>
            </div>

            {/* Depósito 2: Racks Livianos / Miniracks */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-blue-900/40 hover:border-blue-700/60 transition-colors">
              <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Depósito Industrial
              </div>
              <div className="text-white font-semibold text-base mb-1">Racks Livianos (Miniracks)</div>
              <p className="text-xs text-slate-400 mb-3">Módulos de 1.20m, 1.50m y 1.80m para cajas, piezas medianas y preparación de pedidos.</p>
              <span className="text-[11px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">Media Carga</span>
            </div>

            {/* Depósito 3: Estanterías Metálicas */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-900/40 hover:border-cyan-700/60 transition-colors">
              <div className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Depósito Industrial
              </div>
              <div className="text-white font-semibold text-base mb-1">Estanterías de Picking</div>
              <p className="text-xs text-slate-400 mb-3">Bandejas metálicas de 0.90m, 1.00m y 1.20m para archivo, repuestos y pañol industrial.</p>
              <span className="text-[11px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">Picking Manual</span>
            </div>

            {/* Compartido: Estructuras, Puertas y Obstáculos */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-indigo-900/40 hover:border-indigo-700/60 transition-colors">
              <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Salón & Depósito
              </div>
              <div className="text-white font-semibold text-base mb-1">Puertas, Portones & Columnas</div>
              <p className="text-xs text-slate-400 mb-3">Puertas de vidrio comercial, portones seccionales de carga, columnas estructurales y cálculo de límites.</p>
              <span className="text-[11px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">Infraestructura</span>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section id="pricing" className="py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">Planes & Acceso</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Suscripción Gratuita Habilitada
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Aprovecha el período de lanzamiento con acceso ilimitado a todas las herramientas sin costo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="relative bg-gradient-to-b from-blue-900/30 to-slate-900 border-2 border-blue-500 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                Plan Activo Recomendado
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Plan Gratuito Total</h3>
                <p className="text-slate-400 text-xs mt-1">Ideal para diseñadores, distribuidores y comercios.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-slate-400 text-sm">/ mes</span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span><strong>1 Única Suscripción:</strong> Acceso total a <strong>Salón</strong> y a <strong>Depósito</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span><strong>Salón Comercial:</strong> Góndolas pared/isla, punteras, heladeras, check outs</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span><strong>Depósito Industrial:</strong> Racks pesados pallets, miniracks, estanterías, portones</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Proyectos 3D y cartera de clientes <strong>ilimitados</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Exportación de cotizaciones y fichas técnicas</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => {
                    if (user) onGoToAdmin();
                    else setShowLoginModal(true);
                  }}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all text-center cursor-pointer"
                >
                  {user ? 'Ir a mi Panel de Control' : 'Activar Suscripción Gratuita'}
                </button>
              </div>
            </div>

            {/* Enterprise Plan Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Plan Enterprise Pro</h3>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Próximamente
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">Para grandes fabricantes e integradores comerciales.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">Consultar</span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Check className="w-5 h-5 text-slate-500 shrink-0" />
                    <span>Todo lo del Plan Gratuito</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Check className="w-5 h-5 text-slate-500 shrink-0" />
                    <span>Dominio público propio (ej: midominio.com)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Check className="w-5 h-5 text-slate-500 shrink-0" />
                    <span>Integración directa con ERP / SAP</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Check className="w-5 h-5 text-slate-500 shrink-0" />
                    <span>Render fotorrealista 4K con Ray Tracing</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl bg-slate-800 text-slate-500 font-semibold text-sm cursor-not-allowed"
                >
                  Disponible Próximamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>Rack3D Pro Studio &copy; {new Date().getFullYear()} — Plataforma de diseño y cálculo de equipamiento industrial y comercial.</p>
      </footer>

      {/* Login / Register Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Iniciar Sesión</h3>
              <p className="text-xs text-slate-400 mt-1">
                Accede a tu panel para gestionar tus clientes y proyectos en la nube
              </p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            {/* Quick 1-click access without Google */}
            <button
              onClick={handleQuickGuest}
              disabled={isSubmitting}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡ Acceso Rápido Demo (Sin cuenta Google)</span>
            </button>

            <button
              onClick={() => {
                setShowLoginModal(false);
                onGoTo3D();
              }}
              className="w-full mt-2 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Abrir solo Visualizador 3D Libre</span>
            </button>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-xs text-slate-500 uppercase">
                O personalizar operador
              </span>
            </div>

            {/* Quick Guest Form */}
            <form onSubmit={handleGuestLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre o Empresa</label>
                <input
                  type="text"
                  placeholder="Ej: Solo Industrias Argentinas"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Profesional</label>
                <input
                  type="email"
                  placeholder="ejemplo@industria.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>Acceder como Operador / Demo</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
