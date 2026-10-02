import React, { useState } from 'react';
import { AppState, MetaConfig } from '../types';
import { calculateSummary, realGondolaCentralLineWidth, realGondolaParedLineWidth, realMinirackLineWidth, realShelfLineWidth } from '../utils/calculations';
import { X, Save, Share2, FileText, CheckCircle2 } from 'lucide-react';

interface SaveModalProps {
  action: 'save' | 'designer' | 'share';
  state: AppState;
  onClose: () => void;
  onUpdateMeta: (meta: MetaConfig) => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  action,
  state,
  onClose,
  onUpdateMeta,
}) => {
  const [cliente, setCliente] = useState(state.meta.cliente || '');
  const [nroPlano, setNroPlano] = useState(state.meta.nroPlano || `PLANO-${new Date().getFullYear()}-01`);
  const [fecha, setFecha] = useState(state.meta.fecha || new Date().toISOString().slice(0, 10));
  const [whatsapp, setWhatsapp] = useState(state.meta.whatsapp || '');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const slugify = (text: string) => {
    return (text || 'rack')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleConfirm = () => {
    if (!cliente.trim()) {
      alert('Por favor, ingresá el nombre del cliente.');
      return;
    }

    const updatedMeta: MetaConfig = {
      cliente: cliente.trim(),
      nroPlano: nroPlano.trim(),
      fecha: fecha,
      whatsapp: whatsapp.trim(),
    };
    onUpdateMeta(updatedMeta);

    const fileName =
      action === 'designer'
        ? `${slugify(cliente)}-${slugify(nroPlano)}-MASTER-EDITABLE.html`
        : `${slugify(cliente)}-${slugify(nroPlano)}.html`;

    // Generate standalone full HTML bundle
    const summary = calculateSummary(state);
    const serializedState = JSON.stringify({ ...state, meta: updatedMeta });

    const isSalon = state.activeSection === 'salon';
    const workspaceTitle = isSalon ? 'Salón Comercial y Retail' : 'Depósito y Logística Industrial';

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cliente} - Plano ${nroPlano} | ${workspaceTitle}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;background:#090d16;color:#f1f5f9;padding:24px}
  .card{max-width:800px;margin:0 auto;background:#1e293b;border:1px solid #334155;border-radius:16px;padding:24px;box-shadow:0 20px 40px rgba(0,0,0,0.5)}
  h1{font-size:22px;color:#f8fafc;margin-bottom:4px}
  .sub{color:#94a3b8;font-size:13px;margin-bottom:20px;border-bottom:1px solid #334155;padding-bottom:12px}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px}
  .stat{background:#0f172a;padding:12px;border-radius:10px;border:1px solid #1e293b}
  .stat-lbl{font-size:11px;color:#64748b;margin-bottom:2px}
  .stat-val{font-size:18px;font-weight:700;color:#f8fafc}
  .hi{border-color:#f97316;background:#1c0800}
  .hi .stat-val{color:#f97316}
  .sec-title{font-size:13px;font-weight:700;color:#f97316;margin:16px 0 8px;text-transform:uppercase;letter-spacing:0.05em}
  ul{list-style:none;padding-left:0;font-size:12px;color:#cbd5e1;line-height:1.8}
  .badge{display:inline-block;padding:3px 8px;border-radius:6px;font-weight:700;font-size:11px;background:#334155}
</style>
</head>
<body>
<div class="card">
  <h1>${workspaceTitle} - Especificación Técnica 3D</h1>
  <div class="sub">Cliente: <strong>${cliente}</strong> &nbsp;·&nbsp; Plano: <strong>${nroPlano}</strong> &nbsp;·&nbsp; Fecha: <strong>${fecha}</strong></div>
  
  <div class="grid">
    ${isSalon ? `
      <div class="stat"><div class="stat-lbl">Bandejas Góndola Pared</div><div class="stat-val">${summary.gondolaParedBandejas}</div></div>
      <div class="stat"><div class="stat-lbl">Bandejas Góndola Central</div><div class="stat-val">${summary.gondolaCentralBandejas}</div></div>
      <div class="stat"><div class="stat-lbl">Punteras de Góndola</div><div class="stat-val">${summary.punterasCount} (${summary.punterasBandejas} bandejas)</div></div>
      <div class="stat"><div class="stat-lbl">Heladeras Comerciales</div><div class="stat-val">${summary.heladerasCount} uds.</div></div>
      <div class="stat"><div class="stat-lbl">Cajas Check Out</div><div class="stat-val">${summary.checkoutsCount} cajas</div></div>
      <div class="stat"><div class="stat-lbl">Puertas de Vidrio</div><div class="stat-val">${summary.puertasCount} uds.</div></div>
    ` : `
      <div class="stat"><div class="stat-lbl">Posiciones Pallets (Racks Pesados)</div><div class="stat-val">${summary.heavyRackPallets} pallets</div></div>
      <div class="stat"><div class="stat-lbl">Bastidores Racks Pesados</div><div class="stat-val">${summary.heavyRackBastidores}</div></div>
      <div class="stat"><div class="stat-lbl">Bastidores Minirack</div><div class="stat-val">${summary.minirackBastidores}</div></div>
      <div class="stat"><div class="stat-lbl">Paneles Minirack</div><div class="stat-val">${summary.minirackPaneles}</div></div>
      <div class="stat"><div class="stat-lbl">Ángulos Estantería</div><div class="stat-val">${summary.estanteriaAngulos}</div></div>
      <div class="stat"><div class="stat-lbl">Bandejas Estantería</div><div class="stat-val">${summary.estanteriaBandejas}</div></div>
    `}
    <div class="stat hi" style="grid-column:1/-1">
      <div class="stat-lbl">Carga Máxima de Almacenamiento / Exhibición Estimada</div>
      <div class="stat-val">${summary.cargaTotalKg.toLocaleString()} kg</div>
    </div>
  </div>

  ${isSalon ? `
    <div class="sec-title">Detalle de Góndolas de Pared</div>
    <ul>
      ${state.gondolaPared?.lines?.map((l, i) => `<li>• Línea ${i + 1}: ${l.modules.length} módulos (${l.modules.map(m => m.bl + 'm').join(' + ')}) = <strong>${realGondolaParedLineWidth(l).toFixed(2)}m</strong> total</li>`).join('') || '<li>Sin góndolas de pared</li>'}
    </ul>

    <div class="sec-title">Detalle de Góndolas Centrales (Doble Faz)</div>
    <ul>
      ${state.gondolaCentral?.lines?.map((l, i) => `<li>• Línea ${i + 1}: ${l.modules.length} módulos (${l.modules.map(m => m.bl + 'm').join(' + ')}) = <strong>${realGondolaCentralLineWidth(l).toFixed(2)}m</strong> total</li>`).join('') || '<li>Sin góndolas centrales</li>'}
    </ul>

    <div class="sec-title">Heladeras y Cajas Check Out</div>
    <ul>
      ${state.heladeras?.map((h, i) => `<li>• Heladera ${i + 1}: ${h.type} (${h.width}m x ${h.depth}m)</li>`).join('') || '<li>Sin heladeras</li>'}
      ${state.checkouts?.map((c, i) => `<li>• Check Out ${i + 1}: ${c.length}m (Lado cajero: ${c.scannerSide || 'derecha'})</li>`).join('') || '<li>Sin checkouts</li>'}
    </ul>
  ` : `
    <div class="sec-title">Detalle de Racks Pesados (Selectivos para Pallets)</div>
    <ul>
      ${state.heavyRacks?.lines?.map((l, i) => `<li>• Batería ${i + 1}: ${l.modules.length} módulos (${l.modules.map(m => m.bl + 'm').join(' + ')})</li>`).join('') || '<li>Sin racks pesados</li>'}
    </ul>

    <div class="sec-title">Detalle de Líneas Miniracks</div>
    <ul>
      ${state.lines?.map((l, i) => `<li>• Línea ${i + 1}: ${l.modules.length} módulos (${l.modules.map(m => m.bl + 'm').join(' + ')}) = <strong>${realMinirackLineWidth(l).toFixed(2)}m</strong> total</li>`).join('') || '<li>Sin miniracks</li>'}
    </ul>

    <div class="sec-title">Detalle de Líneas Estanterías Metálicas</div>
    <ul>
      ${state.shelfLines?.map((l, i) => `<li>• Línea ${i + 1}: ${l.modules.length} módulos (${l.modules.map(m => m.bl + 'm').join(' + ')}) = <strong>${realShelfLineWidth(l).toFixed(2)}m</strong> total</li>`).join('') || '<li>Sin estanterías</li>'}
    </ul>
  `}
</div>
<script>
  window.__APP_DATA__ = ${serializedState};
</script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1000);

    setDownloadSuccess(fileName);

    if (action === 'share' && whatsapp.trim()) {
      const cleanNum = whatsapp.replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(
        `Hola ${cliente}, te comparto el plano de racks y góndolas N° ${nroPlano} preparado por Titufaris.`
      )}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {action === 'share' ? (
              <Share2 className="w-5 h-5 text-emerald-400" />
            ) : action === 'designer' ? (
              <FileText className="w-5 h-5 text-rose-400" />
            ) : (
              <Save className="w-5 h-5 text-sky-400" />
            )}
            <h2 className="font-extrabold text-base text-slate-100">
              {action === 'share'
                ? 'Compartir por WhatsApp'
                : action === 'designer'
                ? 'Guardar Archivo Maestro'
                : 'Guardar Archivo Cliente'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-600/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Descarga iniciada con éxito: <strong>{downloadSuccess}</strong></span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Nombre del Cliente / Empresa *</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej: Distribuidora Central S.A."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">N° de Plano</label>
              <input
                type="text"
                value={nroPlano}
                onChange={(e) => setNroPlano(e.target.value)}
                placeholder="Ej: 2026-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              WhatsApp del Cliente (con código país)
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ej: 5491112345678"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            {action === 'share' ? '📱 Descargar y Abrir WhatsApp' : '💾 Descargar Archivo'}
          </button>
        </div>
      </div>
    </div>
  );
};
