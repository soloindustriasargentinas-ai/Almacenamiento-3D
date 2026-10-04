import { AppState, MetaConfig } from '../types';
import { calculateSummary } from './calculations';

export function generateBackupHtml(state: AppState): string {
  const meta: MetaConfig = state.meta || {
    cliente: 'Proyecto',
    nroPlano: '001',
    fecha: new Date().toISOString().slice(0, 10),
    whatsapp: '',
  };
  const summary = calculateSummary(state);
  const isSalon = state.activeSection === 'salon';
  const workspaceTitle = isSalon ? 'Salón Comercial y Retail' : 'Depósito y Logística';
  const serializedState = JSON.stringify(state, null, 2);
  const b64Payload = btoa(unescape(encodeURIComponent(JSON.stringify(state))));

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Backup - ${meta.cliente || 'Proyecto'} | Plano ${meta.nroPlano || '01'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .badge-backup {
      background: #065f46;
      color: #34d399;
      border: 1px solid #10b981;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-block;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .meta-sub {
      color: #94a3b8;
      font-size: 13px;
    }
    .alert-box {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #6ee7b7;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px;
    }
    .card-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .card-val {
      font-size: 20px;
      font-weight: 800;
      color: #f8fafc;
      margin-top: 4px;
    }
    .sec-title {
      font-size: 14px;
      font-weight: 800;
      color: #f8fafc;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 20px 0 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    pre {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 16px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: #93c5fd;
      max-height: 220px;
      overflow-y: auto;
    }
    .actions-bar {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }
    .btn-restore {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s ease;
    }
    .btn-restore:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="badge-backup">Copia de Seguridad Oficial (Backup)</span>
        <h1>${meta.cliente || 'Proyecto'} - ${meta.nroPlano || '01'}</h1>
        <div class="meta-sub">
          Tipo: <strong>${workspaceTitle}</strong> · Fecha de Exportación: <strong>${new Date().toLocaleDateString('es-AR')}</strong>
        </div>
      </div>
      <div>
        <button class="btn-restore" onclick="copyRawJson()">
          📋 Copiar JSON al Portapapeles
        </button>
      </div>
    </div>

    <div class="alert-box">
      💾 <strong>Archivo de Backup Recuperable:</strong> Este archivo HTML contiene todos los datos y configuraciones geométricas de su proyecto. Puede subirlo directamente en la aplicación web mediante el botón <strong>"📥 Importar Backup"</strong> para restaurarlo y continuar editándolo en cualquier momento.
    </div>

    <div class="sec-title">📊 Resumen Métrico del Proyecto</div>
    <div class="grid">
      <div class="card">
        <div class="card-label">Área del Salón / Depósito</div>
        <div class="card-val">${(state.warehouse.width * state.warehouse.depth).toFixed(1)} m²</div>
      </div>
      <div class="card">
        <div class="card-label">Dimensiones (An x L x Al)</div>
        <div class="card-val">${state.warehouse.width} x ${state.warehouse.depth} x ${state.warehouse.height} m</div>
      </div>
      <div class="card">
        <div class="card-label">Capacidad de Carga</div>
        <div class="card-val">${summary.cargaTotalKg.toLocaleString()} kg</div>
      </div>
      <div class="card">
        <div class="card-label">Líneas de Góndolas / Racks</div>
        <div class="card-val">${(state.gondolaPared?.lines?.length || 0) + (state.gondolaCentral?.lines?.length || 0) + (state.lines?.length || 0)}</div>
      </div>
    </div>

    <div class="sec-title">📦 Código Fuente del Proyecto (Payload Integrado)</div>
    <pre id="json-view">${serializedState}</pre>

    <div class="actions-bar">
      <span>Supermercado 3D & Rack3D System · Backup Formato Universal HTML</span>
      <span>Versión del Esquema: 2.0</span>
    </div>
  </div>

  <!-- Raw Payload Scripts for Automated Restore -->
  <script id="rack3d-project-data" type="application/json">
${serializedState}
  </script>
  <script>
    window.__RACK3D_BACKUP__ = ${JSON.stringify(state)};
    window.__RACK3D_B64__ = "${b64Payload}";

    function copyRawJson() {
      navigator.clipboard.writeText(document.getElementById('rack3d-project-data').textContent.trim());
      alert('¡JSON del proyecto copiado al portapapeles!');
    }
  </script>
</body>
</html>`;
}

/**
 * Extracts and parses AppState from an uploaded backup HTML or JSON file.
 */
export function extractStateFromBackupFile(fileContent: string): AppState | null {
  try {
    // 1. Check if the file is direct JSON
    const trimmed = fileContent.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (isValidAppState(parsed)) {
        return parsed as AppState;
      }
    }

    // 2. Extract from <script id="rack3d-project-data" type="application/json">
    const scriptJsonRegex = /<script\s+id=["']rack3d-project-data["'][^>]*>([\s\S]*?)<\/script>/i;
    const matchJson = fileContent.match(scriptJsonRegex);
    if (matchJson && matchJson[1]) {
      const parsed = JSON.parse(matchJson[1].trim());
      if (isValidAppState(parsed)) {
        return parsed as AppState;
      }
    }

    // 3. Extract from window.__RACK3D_BACKUP__ = { ... }
    const windowBackupRegex = /window\.__RACK3D_BACKUP__\s*=\s*({[\s\S]*?});/i;
    const matchWindow = fileContent.match(windowBackupRegex);
    if (matchWindow && matchWindow[1]) {
      const parsed = JSON.parse(matchWindow[1].trim());
      if (isValidAppState(parsed)) {
        return parsed as AppState;
      }
    }

    // 4. Extract from window.__APP_DATA__ = { ... } (backward compatibility)
    const windowLegacyRegex = /window\.__APP_DATA__\s*=\s*({[\s\S]*?});/i;
    const matchLegacy = fileContent.match(windowLegacyRegex);
    if (matchLegacy && matchLegacy[1]) {
      const parsed = JSON.parse(matchLegacy[1].trim());
      if (isValidAppState(parsed)) {
        return parsed as AppState;
      }
    }

    return null;
  } catch (err) {
    console.error('Error parsing backup file:', err);
    return null;
  }
}

function isValidAppState(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.warehouse &&
    typeof obj.warehouse.width === 'number' &&
    typeof obj.warehouse.depth === 'number'
  );
}
