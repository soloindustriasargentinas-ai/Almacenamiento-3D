import React, { useState } from 'react';
import { AppState, MetaConfig } from '../types';
import { generateClient3DHtml } from '../utils/generateClient3DHtml';
import { generateBackupHtml } from '../utils/backupService';
import { X, Save, Share2, CheckCircle2, Box, Archive } from 'lucide-react';

export type SaveModalAction = 'client' | 'backup' | 'share' | 'save' | 'designer';

interface SaveModalProps {
  action: SaveModalAction;
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
  const [cliente, setCliente] = useState(state.meta?.cliente || '');
  const [nroPlano, setNroPlano] = useState(state.meta?.nroPlano || `PLANO-${new Date().getFullYear()}-01`);
  const [fecha, setFecha] = useState(state.meta?.fecha || new Date().toISOString().slice(0, 10));
  const [whatsapp, setWhatsapp] = useState(state.meta?.whatsapp || '');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const slugify = (text: string) => {
    return (text || 'rack')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const isClientView = action === 'client' || action === 'save' || action === 'share';
  const isBackup = action === 'backup' || action === 'designer';

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

    const mergedState: AppState = { ...state, meta: updatedMeta };

    let fileName = '';
    let htmlContent = '';

    if (isBackup) {
      fileName = `${slugify(cliente)}-${slugify(nroPlano)}-BACKUP.html`;
      htmlContent = generateBackupHtml(mergedState);
    } else {
      // Client 3D standalone interactive walkthrough viewer
      fileName = `${slugify(cliente)}-${slugify(nroPlano)}-VISTA-3D-CLIENTE.html`;
      htmlContent = generateClient3DHtml(mergedState);
    }

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
        `Hola ${cliente}, te comparto la vista 3D interactiva del proyecto N° ${nroPlano} preparado por Titufaris. Puedes abrir el archivo descargado en cualquier navegador para recorrer el salón en 3D.`
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
            ) : isBackup ? (
              <Archive className="w-5 h-5 text-emerald-400" />
            ) : (
              <Box className="w-5 h-5 text-sky-400" />
            )}
            <h2 className="font-extrabold text-base text-slate-100">
              {action === 'share'
                ? 'Compartir Vista 3D por WhatsApp'
                : isBackup
                ? 'Exportar Backup del Proyecto (.html)'
                : 'Generar Vista 3D Cliente (.html)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isClientView ? (
          <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl text-sky-300 text-xs leading-relaxed">
            🌐 <strong>Vista 3D Recorrible para Cliente:</strong> Entrega un archivo HTML con el proyecto 3D interactivo, recorrible con el cursor del mouse en 360° y modo paseo, <em>sin posibilidad de que el cliente modifique ni altere nada</em>.
          </div>
        ) : (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs leading-relaxed">
            💾 <strong>Copia de Seguridad (Backup):</strong> Descarga un archivo HTML con toda la información técnica y geométrica del proyecto. Podrás subirlo nuevamente para restaurar y continuar editándolo.
          </div>
        )}

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
              placeholder="Ej: Supermercado Central S.A."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isBackup
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
            }`}
          >
            {action === 'share'
              ? '📱 Descargar y Abrir WhatsApp'
              : isBackup
              ? '💾 Descargar Backup HTML'
              : '🌐 Descargar Vista 3D Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

