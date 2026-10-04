import { AppState } from '../types';

export function generateClient3DHtml(state: AppState): string {
  const meta = state.meta || {
    cliente: 'Cliente',
    nroPlano: '001',
    fecha: new Date().toISOString().slice(0, 10),
    whatsapp: '',
  };
  const isSalon = state.activeSection === 'salon';
  const serializedState = JSON.stringify(state);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.cliente || 'Proyecto'} - Plano ${meta.nroPlano || '01'} | Vista 3D Cliente</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #090d16;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
    }
    #canvas-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #canvas-3d {
      display: block;
      width: 100%;
      height: 100%;
    }
    #canvas-dimensions {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      width: 100%;
      height: 100%;
      z-index: 10;
      transition: opacity 0.2s ease;
    }

    /* Minimalist Top Header Badge */
    .top-header {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 20;
      pointer-events: none;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(51, 65, 85, 0.7);
      border-radius: 12px;
      padding: 8px 14px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      pointer-events: auto;
    }
    .client-icon {
      font-size: 16px;
    }
    .client-title {
      font-size: 13px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.01em;
    }
    .client-sub {
      font-size: 10px;
      color: #94a3b8;
    }
    .readonly-tag {
      background: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(14, 165, 233, 0.4);
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Floating View Transitions HUD Toolbar */
    .hud-controls {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .hud-panel {
      background: rgba(15, 23, 42, 0.90);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(51, 65, 85, 0.8);
      border-radius: 12px;
      padding: 6px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .hud-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      padding: 4px 8px 2px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.4);
      margin-bottom: 2px;
    }
    .hud-btn {
      background: rgba(30, 41, 59, 0.75);
      color: #cbd5e1;
      border: 1px solid rgba(51, 65, 85, 0.5);
      border-radius: 8px;
      padding: 7px 11px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
      text-align: left;
      white-space: nowrap;
    }
    .hud-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      color: #ffffff;
      transform: translateY(-1px);
    }
    .hud-btn.active {
      background: #0284c7;
      color: #ffffff;
      border-color: #38bdf8;
      box-shadow: 0 0 12px rgba(2, 132, 199, 0.4);
    }
    .hud-btn.toggle-cotas-active {
      background: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      color: #34d399;
    }
    .hud-btn.toggle-cotas-hidden {
      background: rgba(100, 116, 139, 0.2);
      border-color: rgba(100, 116, 139, 0.4);
      color: #94a3b8;
    }

    /* Walk mode notification tip */
    .walk-notice {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(12px);
      border: 1px solid #0284c7;
      border-radius: 9999px;
      padding: 8px 18px;
      font-size: 11px;
      font-weight: 600;
      color: #7dd3fc;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      display: none;
      z-index: 20;
      pointer-events: none;
      animation: pulseNotice 2s infinite ease-in-out;
    }
    @keyframes pulseNotice {
      0%, 100% { opacity: 0.95; transform: translateX(-50%) scale(1); }
      50% { opacity: 1; transform: translateX(-50%) scale(1.02); }
    }

    /* Minimal Bottom Cursor Navigation Hint */
    .bottom-hint {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 10px;
      padding: 6px 12px;
      font-size: 10px;
      color: #94a3b8;
      z-index: 20;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .bottom-hint span strong { color: #f1f5f9; }

    /* Inspection Tooltip */
    #tooltip {
      position: absolute;
      pointer-events: none;
      background: rgba(15, 23, 42, 0.96);
      border: 1px solid #38bdf8;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: bold;
      color: #ffffff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65);
      display: none;
      z-index: 100;
      white-space: nowrap;
    }
  </style>
  <!-- Three.js and OrbitControls from reliable matching CDN -->
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
  <div id="canvas-container">
    <canvas id="canvas-3d"></canvas>
    <canvas id="canvas-dimensions"></canvas>
  </div>

  <div id="tooltip"></div>

  <!-- Minimal Header Badge -->
  <div class="top-header">
    <div class="header-badge">
      <span class="client-icon">🏪</span>
      <div>
        <div class="client-title">${meta.cliente || 'Proyecto'} · Plano N° ${meta.nroPlano || '01'}</div>
        <div class="client-sub">${state.warehouse?.width || 12}m x ${state.warehouse?.depth || 10}m (${((state.warehouse?.width || 12) * (state.warehouse?.depth || 10)).toFixed(1)} m²) · ${meta.fecha || ''}</div>
      </div>
      <span class="readonly-tag">Vista 3D Recorrible</span>
    </div>
  </div>

  <!-- Floating HUD View and Cota Controls -->
  <div class="hud-controls">
    <div class="hud-panel">
      <div class="hud-title">Vistas de Cámara</div>
      <button class="hud-btn active" id="btn-iso" onclick="setPresetView('iso')">
        <span>📐</span> Isométrica 3D
      </button>
      <button class="hud-btn" id="btn-top" onclick="setPresetView('top')">
        <span>👁️</span> Vista Planta 2D
      </button>
      <button class="hud-btn" id="btn-front" onclick="setPresetView('front')">
        <span>🏢</span> Vista Frontal
      </button>
      <button class="hud-btn" id="btn-walk" onclick="toggleWalkMode()">
        <span>🚶</span> Modo Paseo (Caminar)
      </button>
      <button class="hud-btn" onclick="resetProjectCamera()">
        <span>🎯</span> Centrar Proyecto
      </button>
    </div>

    <!-- Cotas Toggle Button -->
    <div class="hud-panel">
      <div class="hud-title">Medidas y Cotas</div>
      <button class="hud-btn toggle-cotas-active" id="btn-toggle-cotas" onclick="toggleDimensions()">
        <span id="cotas-icon">📏</span> <span id="cotas-label">Ocultar Cotas</span>
      </button>
    </div>
  </div>

  <div class="walk-notice" id="walk-notice">
    🚶 <strong>Modo Paseo Activo:</strong> Haz clic con el cursor en cualquier pasillo del piso para caminar hacia allí a nivel de ojos.
  </div>

  <div class="bottom-hint">
    <span>🖱️ <strong>Girar 360°:</strong> Arrastrar botón izquierdo</span>
    <span>↔️ <strong>Desplazar:</strong> Botón derecho</span>
    <span>🔍 <strong>Zoom:</strong> Rueda</span>
  </div>

  <script>
    // ── Built-in Geometric Calculation Helpers (Self-Contained) ──
    function realGondolaParedLineWidth(line) {
      const sum = (line && line.modules ? line.modules : []).reduce(function(acc, m) { return acc + (m.bl || 0); }, 0);
      return sum + 0.04;
    }

    function getGondolaParedLineBounds(line, defaultDepth) {
      const dDef = defaultDepth || 0.47;
      const W = realGondolaParedLineWidth(line);
      const D = (line && line.modules ? line.modules : []).reduce(function(maxD, m) { return Math.max(maxD, m.depth || dDef); }, dDef);
      const r = (((line && line.rotation) || 0) % 360 + 360) % 360;
      return (r === 0 || r === 180)
        ? { x0: line.xOff, x1: line.xOff + W, z0: line.zOff, z1: line.zOff + D }
        : { x0: line.xOff, x1: line.xOff + D, z0: line.zOff, z1: line.zOff + W };
    }

    function realGondolaCentralLineWidth(line) {
      const sum = (line && line.modules ? line.modules : []).reduce(function(acc, m) { return acc + (m.bl || 0); }, 0);
      return sum + 0.04;
    }

    function getGondolaCentralLineBounds(line, defaultDepth) {
      const dDef = defaultDepth || 0.47;
      const W = realGondolaCentralLineWidth(line);
      const maxDA = (line && line.modules ? line.modules : []).reduce(function(max, m) { return Math.max(max, m.depthA || dDef); }, dDef);
      const maxDB = (line && line.modules ? line.modules : []).reduce(function(max, m) { return Math.max(max, m.depthB || dDef); }, dDef);
      const totalD = maxDA + maxDB;
      const r = (((line && line.rotation) || 0) % 360 + 360) % 360;
      return (r === 0 || r === 180)
        ? { x0: line.xOff, x1: line.xOff + W, z0: line.zOff, z1: line.zOff + totalD }
        : { x0: line.xOff, x1: line.xOff + totalD, z0: line.zOff, z1: line.zOff + W };
    }

    function getDefaultCentralGondolaShelves(height) {
      const h = Number(height) || 1.6;
      if (h <= 1.35) return 3;
      if (h <= 1.85) return 4;
      return 5;
    }

    function getPunteraBounds(p) {
      const pW = p.width || 0.9;
      const pD = p.depth || 0.45;
      const isRot = p.rotation === 90 || p.rotation === 270;
      const w = isRot ? pD : pW;
      const d = isRot ? pW : pD;
      return { x0: p.x, x1: p.x + w, z0: p.z, z1: p.z + d, h: p.height || 1.6 };
    }

    function getHeladeraBounds(h) {
      const isRot = h.rotation === 90 || h.rotation === 270;
      const w = isRot ? h.depth : h.width;
      const d = isRot ? h.width : h.depth;
      return { x0: h.x, x1: h.x + w, z0: h.z, z1: h.z + d, h: h.height || 2.0 };
    }

    function getCheckoutBounds(c) {
      const isRot = c.rotation === 90 || c.rotation === 270;
      const w = isRot ? c.width : c.length;
      const d = isRot ? c.length : c.width;
      return { x0: c.x, x1: c.x + w, z0: c.z, z1: c.z + d, h: c.height || 0.88 };
    }

    function getDoorBounds(door) {
      const isRot = door.rotation === 90 || door.rotation === 270;
      const dThick = 0.25;
      const w = isRot ? dThick : door.width;
      const d = isRot ? door.width : dThick;
      return { x0: door.x, x1: door.x + w, z0: door.z, z1: door.z + d, h: door.height || 2.4 };
    }

    function getObstacleBounds(obs, warehouseHeight) {
      const hDef = warehouseHeight || 4.0;
      const rot = obs.rotation || 0;
      if (obs.type === 'column') {
        return { x0: obs.x, x1: obs.x + obs.w, z0: obs.z, z1: obs.z + (obs.d || obs.w), h: hDef };
      }
      const fw = obs.w;
      const fd = 0.18;
      if (rot === 0) {
        return { x0: obs.x, x1: obs.x + fw, z0: obs.z - fd / 2, z1: obs.z + fd / 2, h: obs.fh || 2.5 };
      } else {
        return { x0: obs.x - fd / 2, x1: obs.x + fd / 2, z0: obs.z, z1: obs.z + fw, h: obs.fh || 2.5 };
      }
    }

    function realMinirackLineWidth(line) {
      const sum = (line && line.modules ? line.modules : []).reduce(function(acc, m) { return acc + (m.bl || 0); }, 0);
      return sum + ((line && line.modules ? line.modules : []).length + 1) * 0.065;
    }

    function getMinirackLineBounds(line, depth) {
      const dDef = depth || 0.6;
      const W = realMinirackLineWidth(line);
      const D = dDef;
      const r = (((line && line.rotation) || 0) % 360 + 360) % 360;
      return (r === 0 || r === 180)
        ? { x0: line.xOff, x1: line.xOff + W, z0: line.zOff, z1: line.zOff + D }
        : { x0: line.xOff, x1: line.xOff + D, z0: line.zOff, z1: line.zOff + W };
    }

    function realHeavyRackLineWidth(line) {
      return (line && line.modules ? line.modules : []).reduce(function(acc, m) { return acc + (m.bl || 0); }, 0);
    }

    function getHeavyRackLineBounds(line, depth) {
      const dDef = depth || 1.1;
      const len = realHeavyRackLineWidth(line);
      const isRot = line.rotation === 90 || line.rotation === 270;
      const w = isRot ? dDef : len;
      const d = isRot ? len : dDef;
      return { x0: line.xOff, x1: line.xOff + w, z0: line.zOff, z1: line.zOff + d, h: line.height || 4.5 };
    }

    function realShelfLineWidth(line) {
      const sum = (line && line.modules ? line.modules : []).reduce(function(acc, m) { return acc + (m.bl || 0); }, 0);
      return sum + 0.04;
    }

    function getShelfLineBounds(line, depth) {
      const dDef = depth || 0.45;
      const W = realShelfLineWidth(line);
      const D = dDef;
      const r = (((line && line.rotation) || 0) % 360 + 360) % 360;
      return (r === 0 || r === 180)
        ? { x0: line.xOff, x1: line.xOff + W, z0: line.zOff, z1: line.zOff + D }
        : { x0: line.xOff, x1: line.xOff + D, z0: line.zOff, z1: line.zOff + W };
    }

    // ── Application Initialization ──
    const PROJECT_STATE = ${serializedState};
    const isSalon = PROJECT_STATE.activeSection === 'salon';

    const canvas3D = document.getElementById('canvas-3d');
    const dimCanvas = document.getElementById('canvas-dimensions');
    const tooltip = document.getElementById('tooltip');
    const walkNotice = document.getElementById('walk-notice');
    const btnToggleCotas = document.getElementById('btn-toggle-cotas');
    const cotasLabel = document.getElementById('cotas-label');

    let showDimensions = true;

    // Verify Three.js is available
    if (typeof THREE === 'undefined') {
      alert('Error al cargar Three.js. Verifique su conexión a Internet.');
    }

    // ── Three.js Scene Setup ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.008);

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas3D,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (renderer.shadowMap) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap || 1;
    }
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
    }

    // Safe OrbitControls initialization with fallback
    let controls;
    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, canvas3D);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI / 2 - 0.01;
      controls.minDistance = 0.8;
      controls.maxDistance = 140;
    } else {
      controls = {
        target: new THREE.Vector3(6, 1.2, 5),
        update: function() {},
        enableDamping: false
      };
    }

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.70);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ed, 1.4);
    sunLight.position.set(16, 26, 14);
    sunLight.castShadow = true;
    if (sunLight.shadow && sunLight.shadow.mapSize) {
      sunLight.shadow.mapSize.set(2048, 2048);
      sunLight.shadow.bias = -0.0004;
    }
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x94b8e8, 0.40);
    fillLight.position.set(-15, 20, -10);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x1e293b, 0.45);
    scene.add(hemiLight);

    // ── Procedural Canvas Textures ──
    function createPostTexture() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 512;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(0, 0, 128, 512);
      ctx.fillStyle = '#1a202c';
      for (let y = 20; y < 500; y += 32) {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(24, y, 14, 20, 4);
          ctx.roundRect(90, y, 14, 20, 4);
        } else {
          ctx.rect(24, y, 14, 20);
          ctx.rect(90, y, 14, 20);
        }
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }

    function createGondolaBackTexture() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      for (let y = 16; y < 256; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#94a3b8';
      for (let y = 16; y < 256; y += 24) {
        for (let x = 16; x < 256; x += 32) {
          ctx.fillRect(x - 1.5, y - 4, 3, 8);
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 4);
      return tex;
    }

    function createShelfTexture() {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 200; i++) {
        ctx.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      return tex;
    }

    const postTex = createPostTexture();
    const gondolaBackTex = createGondolaBackTexture();
    const shelfTex = createShelfTexture();

    // ── Material Palette (Exact Match to Visualizer) ──
    const mats = {
      gParedPost: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.25, roughness: 0.25 }),
      gParedBack: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.15, roughness: 0.35, map: gondolaBackTex }),
      gParedShelf: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.25, roughness: 0.25 }),
      gParedPriceTag: new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.15, roughness: 0.4 }),
      gParedBracket: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.3 }),
      gParedFoot: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.3 }),

      gCentPost: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.25, roughness: 0.25 }),
      gCentBack: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.15, roughness: 0.35, map: gondolaBackTex }),
      gCentShelf: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.25, roughness: 0.25 }),
      gCentPriceTagA: new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.15, roughness: 0.4 }),
      gCentPriceTagB: new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.15, roughness: 0.4 }),
      gCentBracket: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.3 }),
      gCentFoot: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.3 }),

      // Salón Fixtures
      refrigBodyBlack: new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.3, roughness: 0.25 }),
      refrigBodyWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.2, roughness: 0.3 }),
      refrigBodyInox: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 }),
      refrigLed: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.5 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.35, roughness: 0.08, metalness: 0.1 }),

      checkoutBody: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.35 }),
      checkoutTop: new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.3 }),
      checkoutBelt: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 }),
      checkoutScreen: new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.4 }),

      doorFrame: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.3 }),
      doorIndustrial: new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.4, roughness: 0.4 }),
      column: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.2, roughness: 0.6 }),
      colBase: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.5 }),
      opening: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.3, roughness: 0.4 }),
      openFloor: new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.1, roughness: 0.5 }),

      // Depósito Fixtures
      post: new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.75, roughness: 0.3, map: postTex }),
      brace: new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.65, roughness: 0.35 }),
      beam: new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.35, roughness: 0.3 }),
      shelf: new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.45, roughness: 0.5, map: shelfTex }),

      estPost: new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.55, roughness: 0.35 }),
      estShelf: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.45, roughness: 0.45, map: shelfTex }),
      estCorner: new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.7, roughness: 0.25 }),

      heavyPost: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.5, roughness: 0.35 }),
      heavyBeam: new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.45, roughness: 0.3 }),
      palletWood: new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.1, roughness: 0.8 }),
      palletBox: new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.05, roughness: 0.85 }),

      // Vibrant Supermarket Products
      prodBoxA: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
      prodBoxB: new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 }),
      prodBoxC: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 }),
      prodBoxD: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }),
      prodCan: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.25 }),
      prodBottle: new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.85, roughness: 0.1 }),
    };

    // Helper to build 3D mesh box
    function mkBox(w, h, d, mat, px, py, pz, meta) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px + w / 2, py + h / 2, pz + d / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (meta) mesh.userData = meta;
      return mesh;
    }

    // Helper to spawn realistic supermarket items on a shelf
    function addProductsToShelf(group, mW, mD, shelfY, offsetZ, isBackShelf) {
      const itemSpacing = 0.18;
      const numItems = Math.floor((mW - 0.08) / itemSpacing);
      const startX = 0.04;
      const matsList = [mats.prodBoxA, mats.prodBoxB, mats.prodBoxC, mats.prodBoxD, mats.prodCan, mats.prodBottle];

      for (let i = 0; i < numItems; i++) {
        const pick = (i * 7 + (isBackShelf ? 3 : 1)) % matsList.length;
        const mat = matsList[pick];
        const px = startX + i * itemSpacing;
        const py = shelfY + 0.025;
        const pz = offsetZ + (mD * 0.2);

        if (pick === 4) {
          group.add(mkBox(0.08, 0.12, 0.08, mat, px, py, pz));
          group.add(mkBox(0.08, 0.12, 0.08, mat, px, py, pz + 0.10));
        } else if (pick === 5) {
          group.add(mkBox(0.07, 0.18, 0.07, mat, px, py, pz));
        } else {
          const boxH = 0.16 + (i % 3) * 0.03;
          group.add(mkBox(0.12, boxH, 0.09, mat, px, py, pz));
        }
      }
    }

    // ── Floor & Perimeter Building ──
    const wh = PROJECT_STATE.warehouse || {};
    const W = wh.width || 12;
    const D = wh.depth || 10;
    const H = wh.height || 4;

    // Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(160, 160);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.55,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor active zone boundary
    const floorZone = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.12 })
    );
    floorZone.rotation.x = -Math.PI / 2;
    floorZone.position.set(W / 2, 0.003, D / 2);
    floorZone.receiveShadow = true;
    scene.add(floorZone);

    // Grid helper
    const grid = new THREE.GridHelper(Math.max(W, D) * 2, Math.max(W, D) * 2, 0x38bdf8, 0x1e3a5f);
    if (grid.material) {
      grid.material.opacity = 0.25;
      grid.material.transparent = true;
    }
    grid.position.set(W / 2, 0.005, D / 2);
    scene.add(grid);

    // Warehouse boundary edges
    const wireGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D));
    const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    wireframe.position.set(W / 2, H / 2, D / 2);
    scene.add(wireframe);

    // Subtle translucent walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, transparent: true, opacity: 0.20, roughness: 0.8 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.08), wallMat);
    backWall.position.set(W / 2, H / 2, 0);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, H, D), wallMat);
    leftWall.position.set(0, H / 2, D / 2);
    scene.add(leftWall);

    const interactiveObjects = [];

    // ── Build Furniture Fixtures ──

    // 1. Góndolas de Pared
    if (isSalon && PROJECT_STATE.gondolaPared && PROJECT_STATE.gondolaPared.lines) {
      PROJECT_STATE.gondolaPared.lines.forEach(function(gline, gli) {
        const gGroup = new THREE.Group();
        const colW = 0.04;
        const colD = 0.06;
        const meta = { name: 'Góndola de Pared #' + (gli + 1), type: 'gondolaPared', idx: gli };
        const defaultD = (gline.modules && gline.modules[0] && gline.modules[0].depth) || 0.47;
        const lineW = realGondolaParedLineWidth(gline);
        const lineD = (gline.modules || []).reduce(function(maxD, m) { return Math.max(maxD, m.depth || defaultD); }, defaultD);
        const rot = (((gline.rotation || 0) % 360) + 360) % 360;

        if (rot === 0) {
          gGroup.position.set(gline.xOff, 0, gline.zOff);
          gGroup.rotation.y = 0;
        } else if (rot === 90) {
          gGroup.position.set(gline.xOff, 0, gline.zOff + lineW);
          gGroup.rotation.y = Math.PI / 2;
        } else if (rot === 180) {
          gGroup.position.set(gline.xOff + lineW, 0, gline.zOff + lineD);
          gGroup.rotation.y = Math.PI;
        } else if (rot === 270) {
          gGroup.position.set(gline.xOff + lineD, 0, gline.zOff);
          gGroup.rotation.y = -Math.PI / 2;
        }

        const buildUpright = function(g, x, postH, footD) {
          g.add(mkBox(colW, postH - 0.03, colD, mats.gParedPost, x - colW / 2, 0.03, 0, meta));
          g.add(mkBox(0.024, 0.03, 0.024, mats.gParedFoot, x - 0.012, 0, colD / 2 - 0.012, meta));
          g.add(mkBox(colW, 0.07, footD, mats.gParedFoot, x - colW / 2, 0.03, 0.01, meta));
          g.add(mkBox(0.024, 0.03, 0.024, mats.gParedFoot, x - 0.012, 0, footD - 0.04, meta));
        };

        let cumX = 0;
        buildUpright(gGroup, 0, 2.0, defaultD);

        (gline.modules || []).forEach(function(mod) {
          const mW = mod.bl;
          const mD = mod.depth || defaultD;
          const mH = 2.0;
          const sc = mod.sc || PROJECT_STATE.gondolaPared.shelfCount || 5;

          // Slotted back panel
          gGroup.add(mkBox(mW, mH - 0.10, 0.015, mats.gParedBack, cumX, 0.10, 0.005, meta));

          // Base shelf (open floor underneath)
          gGroup.add(mkBox(mW, 0.03, mD, mats.gParedShelf, cumX, 0.10, 0.01, meta));
          gGroup.add(mkBox(mW, 0.035, 0.008, mats.gParedPriceTag, cumX, 0.10, mD + 0.01, meta));
          addProductsToShelf(gGroup, mW, mD, 0.10, 0.01, false);

          // Aerial shelves
          const numAereos = Math.max(0, sc - 1);
          if (numAereos > 0) {
            const topY = mH - 0.025;
            const baseY = 0.10;
            for (let s = 1; s <= numAereos; s++) {
              const y = numAereos === 1 ? topY : baseY + s * ((topY - baseY) / numAereos);
              gGroup.add(mkBox(mW, 0.025, mD, mats.gParedShelf, cumX, y, 0.015, meta));
              gGroup.add(mkBox(mW, 0.025, 0.008, mats.gParedPriceTag, cumX, y, mD + 0.015, meta));
              gGroup.add(mkBox(0.005, 0.07, mD * 0.9, mats.gParedBracket, cumX + 0.005, y - 0.05, 0.015, meta));
              gGroup.add(mkBox(0.005, 0.07, mD * 0.9, mats.gParedBracket, cumX + mW - 0.01, y - 0.05, 0.015, meta));
              addProductsToShelf(gGroup, mW, mD, y, 0.015, false);
            }
          }

          cumX += mW;
          buildUpright(gGroup, cumX, 2.0, mD);
        });

        scene.add(gGroup);
        interactiveObjects.push(gGroup);
      });
    }

    // 2. Góndolas Centrales (Doble Faz)
    if (isSalon && PROJECT_STATE.gondolaCentral && PROJECT_STATE.gondolaCentral.lines) {
      PROJECT_STATE.gondolaCentral.lines.forEach(function(gcline, gcli) {
        const gGroup = new THREE.Group();
        const H = gcline.height || PROJECT_STATE.gondolaCentral.height || 1.6;
        const colW = 0.04;
        const colD = 0.06;
        const meta = { name: 'Góndola Central Doble Faz #' + (gcli + 1), type: 'gondolaCentral', idx: gcli };
        const da = (gcline.modules && gcline.modules[0] && gcline.modules[0].depthA) || 0.47;
        const db = (gcline.modules && gcline.modules[0] && gcline.modules[0].depthB) || 0.47;
        const totalD = da + db;
        const lineW = realGondolaCentralLineWidth(gcline);
        const rot = (((gcline.rotation || 0) % 360) + 360) % 360;

        if (rot === 0) {
          gGroup.position.set(gcline.xOff, 0, gcline.zOff);
          gGroup.rotation.y = 0;
        } else if (rot === 90) {
          gGroup.position.set(gcline.xOff, 0, gcline.zOff + lineW);
          gGroup.rotation.y = Math.PI / 2;
        } else if (rot === 180) {
          gGroup.position.set(gcline.xOff + lineW, 0, gcline.zOff + totalD);
          gGroup.rotation.y = Math.PI;
        } else if (rot === 270) {
          gGroup.position.set(gcline.xOff + totalD, 0, gcline.zOff);
          gGroup.rotation.y = -Math.PI / 2;
        }

        const buildGCUpright = function(g, x, postH, centerZ, dSideA, dSideB) {
          g.add(mkBox(colW, postH - 0.03, colD, mats.gCentPost, x - colW / 2, 0.03, centerZ - colD / 2, meta));
          g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, x - 0.012, 0, centerZ - 0.012, meta));
          g.add(mkBox(colW, 0.07, dSideA + dSideB, mats.gCentFoot, x - colW / 2, 0.03, centerZ - dSideB, meta));
          g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, x - 0.012, 0, centerZ + dSideA - 0.04, meta));
          g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, x - 0.012, 0, centerZ - dSideB + 0.016, meta));
        };

        let cumX = 0;
        buildGCUpright(gGroup, 0, H, db, da, db);

        (gcline.modules || []).forEach(function(mod) {
          const mW = mod.bl;
          const mH = mod.height || H;
          const sideA = mod.depthA || 0.47;
          const sideB = mod.depthB || 0.47;
          const defShelves = getDefaultCentralGondolaShelves(mH);
          const scA = mod.scA !== undefined && mod.scA > 0 ? mod.scA : defShelves;
          const scB = mod.scB !== undefined && mod.scB > 0 ? mod.scB : defShelves;
          const centerZ = sideB;

          // Central divider panel
          gGroup.add(mkBox(mW, mH - 0.10, 0.018, mats.gCentBack, cumX, 0.10, centerZ - 0.009, meta));

          // Side A (+Z)
          gGroup.add(mkBox(mW, 0.03, sideA, mats.gCentShelf, cumX, 0.10, centerZ, meta));
          gGroup.add(mkBox(mW, 0.035, 0.008, mats.gCentPriceTagA, cumX, 0.10, centerZ + sideA, meta));
          addProductsToShelf(gGroup, mW, sideA, 0.10, centerZ, false);

          const numAereosA = Math.max(0, scA - 1);
          if (numAereosA > 0) {
            const topYA = mH - 0.025;
            const baseYA = 0.10;
            for (let sa = 1; sa <= numAereosA; sa++) {
              const ya = numAereosA === 1 ? topYA : baseYA + sa * ((topYA - baseYA) / numAereosA);
              gGroup.add(mkBox(mW, 0.025, sideA, mats.gCentShelf, cumX, ya, centerZ, meta));
              gGroup.add(mkBox(mW, 0.025, 0.008, mats.gCentPriceTagA, cumX, ya, centerZ + sideA, meta));
              gGroup.add(mkBox(0.005, 0.07, sideA * 0.9, mats.gCentBracket, cumX + 0.005, ya - 0.05, centerZ + 0.01, meta));
              gGroup.add(mkBox(0.005, 0.07, sideA * 0.9, mats.gCentBracket, cumX + mW - 0.009, ya - 0.05, centerZ + 0.01, meta));
              addProductsToShelf(gGroup, mW, sideA, ya, centerZ, false);
            }
          }

          // Side B (-Z)
          gGroup.add(mkBox(mW, 0.03, sideB, mats.gCentShelf, cumX, 0.10, centerZ - sideB, meta));
          gGroup.add(mkBox(mW, 0.035, 0.008, mats.gCentPriceTagB, cumX, 0.10, centerZ - sideB - 0.008, meta));
          addProductsToShelf(gGroup, mW, sideB, 0.10, centerZ - sideB, true);

          const numAereosB = Math.max(0, scB - 1);
          if (numAereosB > 0) {
            const topYB = mH - 0.025;
            const baseYB = 0.10;
            for (let sb = 1; sb <= numAereosB; sb++) {
              const yb = numAereosB === 1 ? topYB : baseYB + sb * ((topYB - baseYB) / numAereosB);
              gGroup.add(mkBox(mW, 0.025, sideB, mats.gCentShelf, cumX, yb, centerZ - sideB, meta));
              gGroup.add(mkBox(mW, 0.025, 0.008, mats.gCentPriceTagB, cumX, yb, centerZ - sideB - 0.008, meta));
              gGroup.add(mkBox(0.005, 0.07, sideB * 0.9, mats.gCentBracket, cumX + 0.005, yb - 0.05, centerZ - sideB, meta));
              gGroup.add(mkBox(0.005, 0.07, sideB * 0.9, mats.gCentBracket, cumX + mW - 0.009, yb - 0.05, centerZ - sideB, meta));
              addProductsToShelf(gGroup, mW, sideB, yb, centerZ - sideB, true);
            }
          }

          cumX += mW;
          buildGCUpright(gGroup, cumX, mH, centerZ, sideA, sideB);
        });

        scene.add(gGroup);
        interactiveObjects.push(gGroup);
      });
    }

    // 3. Punteras de Góndola
    if (isSalon && PROJECT_STATE.punteras) {
      PROJECT_STATE.punteras.forEach(function(p, idx) {
        const g = new THREE.Group();
        const rot = (((p.rotation || 0) % 360) + 360) % 360;
        const pW = p.width || 0.9;
        const pD = p.depth || 0.45;
        const pH = p.height || 1.6;
        const sc = p.shelfCount || 4;
        const meta = { name: 'Puntera de Góndola #' + (idx + 1), type: 'puntera', idx: idx };

        if (rot === 0) {
          g.position.set(p.x, 0, p.z);
          g.rotation.y = 0;
        } else if (rot === 90) {
          g.position.set(p.x, 0, p.z + pW);
          g.rotation.y = Math.PI / 2;
        } else if (rot === 180) {
          g.position.set(p.x + pW, 0, p.z + pD);
          g.rotation.y = Math.PI;
        } else if (rot === 270) {
          g.position.set(p.x + pD, 0, p.z);
          g.rotation.y = -Math.PI / 2;
        }

        const colW = 0.04;
        const colD = 0.06;
        g.add(mkBox(colW, pH - 0.03, colD, mats.gCentPost, pW / 2 - colW / 2, 0.03, 0.01, meta));
        g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, pW / 2 - 0.012, 0, 0.02, meta));
        g.add(mkBox(colW, 0.07, pD, mats.gCentFoot, pW / 2 - colW / 2, 0.03, 0.01, meta));
        g.add(mkBox(0.024, 0.03, 0.024, mats.gCentFoot, pW / 2 - 0.012, 0, pD - 0.04, meta));

        g.add(mkBox(pW, pH - 0.10, 0.018, mats.gCentBack, 0, 0.10, 0.015, meta));
        g.add(mkBox(pW, 0.03, pD, mats.gCentShelf, 0, 0.10, 0.01, meta));
        g.add(mkBox(pW, 0.035, 0.008, mats.gCentPriceTagA, 0, 0.10, pD + 0.01, meta));
        addProductsToShelf(g, pW, pD, 0.10, 0.01, false);

        const numAereos = Math.max(0, sc - 1);
        if (numAereos > 0) {
          const topY = pH - 0.025;
          const baseY = 0.10;
          for (let s = 1; s <= numAereos; s++) {
            const sy = numAereos === 1 ? topY : baseY + s * ((topY - baseY) / numAereos);
            const sDepth = Math.max(0.28, pD - 0.03);
            g.add(mkBox(pW, 0.025, sDepth, mats.gCentShelf, 0, sy, 0.015, meta));
            g.add(mkBox(pW, 0.025, 0.008, mats.gCentPriceTagA, 0, sy, sDepth + 0.015, meta));
            g.add(mkBox(0.005, 0.07, sDepth * 0.9, mats.gCentBracket, 0.02, sy - 0.05, 0.015, meta));
            g.add(mkBox(0.005, 0.07, sDepth * 0.9, mats.gCentBracket, pW - 0.025, sy - 0.05, 0.015, meta));
            addProductsToShelf(g, pW, sDepth, sy, 0.015, false);
          }
        }

        scene.add(g);
        interactiveObjects.push(g);
      });
    }

    // 4. Heladeras Comerciales
    if (isSalon && PROJECT_STATE.heladeras) {
      PROJECT_STATE.heladeras.forEach(function(h, idx) {
        const g = new THREE.Group();
        const rot = (((h.rotation || 0) % 360) + 360) % 360;
        const hW = h.width || 1.8;
        const hD = h.depth || 0.85;
        const hH = h.height || 2.0;
        const meta = { name: 'Heladera Comercial #' + (idx + 1) + ' (' + (h.type || 'mural') + ')', type: 'heladera', idx: idx };

        if (rot === 0) {
          g.position.set(h.x, 0, h.z);
          g.rotation.y = 0;
        } else if (rot === 90) {
          g.position.set(h.x, 0, h.z + hW);
          g.rotation.y = Math.PI / 2;
        } else if (rot === 180) {
          g.position.set(h.x + hW, 0, h.z + hD);
          g.rotation.y = Math.PI;
        } else if (rot === 270) {
          g.position.set(h.x + hD, 0, h.z);
          g.rotation.y = -Math.PI / 2;
        }

        const bodyMat = h.color === 'negro' ? mats.refrigBodyBlack : h.color === 'inox' ? mats.refrigBodyInox : mats.refrigBodyWhite;

        if (h.type === 'mostrador') {
          g.add(mkBox(hW, 0.45, hD, bodyMat, 0, 0, 0, meta));
          g.add(mkBox(hW - 0.12, 0.12, 0.02, mats.colBase, 0.06, 0.04, hD - 0.015, meta));
          g.add(mkBox(hW - 0.06, 0.03, hD - 0.08, mats.refrigBodyInox, 0.03, 0.45, 0.04, meta));
          g.add(mkBox(hW - 0.08, 0.012, hD * 0.52, mats.glass, 0.04, 0.80, 0.08, meta));
          g.add(mkBox(hW - 0.12, 0.015, 0.02, mats.refrigLed, 0.06, 0.78, 0.12, meta));
          g.add(mkBox(hW - 0.06, hH - 0.48, 0.012, mats.glass, 0.03, 0.46, hD - 0.03, meta));
          g.add(mkBox(0.012, hH - 0.48, hD - 0.08, mats.glass, 0.02, 0.46, 0.04, meta));
          g.add(mkBox(0.012, hH - 0.48, hD - 0.08, mats.glass, hW - 0.032, 0.46, 0.04, meta));
          g.add(mkBox(hW, 0.035, 0.30, mats.checkoutTop, 0, hH - 0.035, 0.02, meta));
        } else {
          g.add(mkBox(hW, 0.28, hD, mats.refrigBodyBlack, 0, 0, 0, meta));
          g.add(mkBox(0.06, hH - 0.28, hD, bodyMat, 0, 0.28, 0, meta));
          g.add(mkBox(0.06, hH - 0.28, hD, bodyMat, hW - 0.06, 0.28, 0, meta));
          g.add(mkBox(hW, 0.20, hD, bodyMat, 0, hH - 0.20, 0, meta));
          g.add(mkBox(hW - 0.12, 0.15, 0.02, mats.refrigLed, 0.06, hH - 0.18, hD - 0.02, meta));
          g.add(mkBox(hW - 0.12, hH - 0.48, 0.04, bodyMat, 0.06, 0.28, 0, meta));

          const levels = 4;
          const gap = (hH - 0.54) / levels;
          for (let s = 1; s <= levels; s++) {
            const sy = 0.28 + s * gap;
            g.add(mkBox(hW - 0.14, 0.015, hD - 0.14, mats.shelf, 0.07, sy, 0.05, meta));
          }

          const doors = h.doorsCount || (hW >= 2.0 ? 3 : 2);
          const doorW = (hW - 0.12) / doors;
          for (let d = 0; d < doors; d++) {
            const dx = 0.06 + d * doorW;
            g.add(mkBox(doorW - 0.015, hH - 0.48, 0.012, mats.glass, dx + 0.007, 0.28, hD - 0.018, meta));
            g.add(mkBox(doorW, 0.025, 0.02, mats.doorFrame, dx, 0.28, hD - 0.02, meta));
            g.add(mkBox(doorW, 0.025, 0.02, mats.doorFrame, dx, hH - 0.22, hD - 0.02, meta));
            g.add(mkBox(0.02, 0.35, 0.025, mats.checkoutTop, dx + doorW - 0.035, hH / 2 - 0.15, hD, meta));
          }
        }

        scene.add(g);
        interactiveObjects.push(g);
      });
    }

    // 5. Cajas Check Out
    if (isSalon && PROJECT_STATE.checkouts) {
      PROJECT_STATE.checkouts.forEach(function(c, idx) {
        const g = new THREE.Group();
        const rot = (((c.rotation || 0) % 360) + 360) % 360;
        const cL = c.length || 1.8;
        const cW = c.width || 1.1;
        const cH = c.height || 0.88;
        const meta = { name: 'Caja Check Out #' + (idx + 1), type: 'checkout', idx: idx };

        if (rot === 0) {
          g.position.set(c.x, 0, c.z);
          g.rotation.y = 0;
        } else if (rot === 90) {
          g.position.set(c.x, 0, c.z + cL);
          g.rotation.y = Math.PI / 2;
        } else if (rot === 180) {
          g.position.set(c.x + cL, 0, c.z + cW);
          g.rotation.y = Math.PI;
        } else if (rot === 270) {
          g.position.set(c.x + cW, 0, c.z);
          g.rotation.y = -Math.PI / 2;
        }

        const isLeft = (c.scannerSide || 'derecha') === 'izquierda';
        const beltW = 0.58;
        const cashierW = Math.max(0.45, cW - beltW);
        const beltZ = isLeft ? cashierW : 0;
        const cashierZ = isLeft ? 0 : beltW;

        g.add(mkBox(cL, cH - 0.05, beltW, mats.checkoutBody, 0, 0, beltZ, meta));
        g.add(mkBox(cL, 0.05, beltW, mats.checkoutTop, 0, cH - 0.05, beltZ, meta));

        const beltLen = cL * 0.52;
        g.add(mkBox(beltLen, 0.015, beltW - 0.08, mats.checkoutBelt, 0.06, cH, beltZ + 0.04, meta));

        const guideRailZ = isLeft ? cW - 0.025 : 0.005;
        g.add(mkBox(cL, 0.08, 0.02, mats.refrigBodyInox, 0, cH, guideRailZ, meta));

        const scanX = 0.06 + beltLen + 0.02;
        const scanLen = Math.min(0.35, cL * 0.20);
        g.add(mkBox(scanLen, 0.018, beltW - 0.10, mats.glass, scanX, cH, beltZ + 0.05, meta));

        const bagX = scanX + scanLen + 0.04;
        const bagLen = Math.max(0.35, cL - bagX - 0.02);
        g.add(mkBox(bagLen, 0.025, beltW - 0.06, mats.refrigBodyInox, bagX, cH - 0.02, beltZ + 0.03, meta));
        g.add(mkBox(bagLen * 0.85, 0.06, 0.015, mats.checkoutTop, bagX + 0.03, cH, beltZ + beltW / 2 - 0.007, meta));

        const deskLen = cL * 0.50;
        const deskX = cL * 0.20;
        g.add(mkBox(deskLen, cH - 0.04, cashierW, mats.checkoutBody, deskX, 0, cashierZ, meta));
        g.add(mkBox(deskLen, 0.04, cashierW, mats.checkoutTop, deskX, cH - 0.04, cashierZ, meta));
        g.add(mkBox(0.42, 0.10, cashierW - 0.08, mats.colBase, deskX + deskLen * 0.30, cH - 0.14, cashierZ + 0.04, meta));

        const postX = deskX + deskLen * 0.70;
        const postZ = cashierZ + (isLeft ? cashierW - 0.12 : 0.12);
        g.add(mkBox(0.04, 0.45, 0.04, mats.refrigBodyInox, postX, cH, postZ, meta));
        g.add(mkBox(0.24, 0.18, 0.025, mats.checkoutScreen, postX - 0.10, cH + 0.28, postZ - 0.02, meta));

        scene.add(g);
        interactiveObjects.push(g);
      });
    }

    // 6. Depósito Fixtures (Miniracks, Heavy Racks, Estanterías)
    if (!isSalon) {
      if (PROJECT_STATE.lines) {
        PROJECT_STATE.lines.forEach(function(line, li) {
          const group = new THREE.Group();
          const d = PROJECT_STATE.depth || 0.6;
          const h = PROJECT_STATE.height || 2.5;
          const lineW = realMinirackLineWidth(line);
          const rot = (((line.rotation || 0) % 360) + 360) % 360;
          const meta = { name: 'Minirack Liviano #' + (li + 1), type: 'minirack', idx: li };

          if (rot === 0) { group.position.set(line.xOff, 0, line.zOff); }
          else if (rot === 90) { group.position.set(line.xOff, 0, line.zOff + lineW); group.rotation.y = Math.PI / 2; }
          else if (rot === 180) { group.position.set(line.xOff + lineW, 0, line.zOff + d); group.rotation.y = Math.PI; }
          else if (rot === 270) { group.position.set(line.xOff + d, 0, line.zOff); group.rotation.y = -Math.PI / 2; }

          let cumX = 0;
          (line.modules || []).forEach(function(mod) {
            const sc = mod.sc || PROJECT_STATE.shelfCount || 4;
            const gap = (h - 0.15) / sc;
            group.add(mkBox(0.065, h, 0.065, mats.post, cumX, 0, 0, meta));
            group.add(mkBox(0.065, h, 0.065, mats.post, cumX, 0, d - 0.065, meta));
            for (let i = 0; i < sc; i++) {
              const sh = 0.15 + i * gap;
              group.add(mkBox(mod.bl, 0.055, 0.055, mats.beam, cumX, sh, 0, meta));
              group.add(mkBox(mod.bl, 0.055, 0.055, mats.beam, cumX, sh, d - 0.055, meta));
              group.add(mkBox(mod.bl, 0.018, d, mats.shelf, cumX, sh + 0.055, 0, meta));
            }
            cumX += mod.bl;
          });
          group.add(mkBox(0.065, h, 0.065, mats.post, cumX, 0, 0, meta));
          group.add(mkBox(0.065, h, 0.065, mats.post, cumX, 0, d - 0.065, meta));
          scene.add(group);
          interactiveObjects.push(group);
        });
      }

      if (PROJECT_STATE.heavyRacks && PROJECT_STATE.heavyRacks.lines) {
        PROJECT_STATE.heavyRacks.lines.forEach(function(line, li) {
          const group = new THREE.Group();
          const h = line.height || PROJECT_STATE.heavyRacks.height || 4.5;
          const d = line.depth || PROJECT_STATE.heavyRacks.depth || 1.10;
          const lineW = realHeavyRackLineWidth(line);
          const rot = (((line.rotation || 0) % 360) + 360) % 360;
          const meta = { name: 'Rack Pesado para Pallets #' + (li + 1), type: 'heavyRack', idx: li };

          if (rot === 0) { group.position.set(line.xOff, 0, line.zOff); }
          else if (rot === 90) { group.position.set(line.xOff, 0, line.zOff + lineW); group.rotation.y = Math.PI / 2; }
          else if (rot === 180) { group.position.set(line.xOff + lineW, 0, line.zOff + d); group.rotation.y = Math.PI; }
          else if (rot === 270) { group.position.set(line.xOff + d, 0, line.zOff); group.rotation.y = -Math.PI / 2; }

          let cumX = 0;
          (line.modules || []).forEach(function(mod) {
            const levels = mod.levels || 3;
            const gap = (h - 0.3) / levels;
            group.add(mkBox(0.09, h, 0.09, mats.heavyPost, cumX, 0, 0, meta));
            group.add(mkBox(0.09, h, 0.09, mats.heavyPost, cumX, 0, d - 0.09, meta));

            for (let lvl = 0; lvl < levels; lvl++) {
              const beamY = 0.25 + lvl * gap;
              group.add(mkBox(mod.bl, 0.11, 0.055, mats.heavyBeam, cumX, beamY, 0, meta));
              group.add(mkBox(mod.bl, 0.11, 0.055, mats.heavyBeam, cumX, beamY, d - 0.055, meta));

              const palsInBay = mod.bl >= 3.0 ? 3 : 2;
              const palSpacing = mod.bl / palsInBay;
              for (let p = 0; p < palsInBay; p++) {
                const px = cumX + p * palSpacing + (palSpacing - 1.0) / 2;
                const py = beamY + 0.11;
                const pz = (d - 1.2) / 2;
                group.add(mkBox(1.0, 0.14, 1.2, mats.palletWood, px, py, pz, meta));
                group.add(mkBox(0.92, 0.85, 1.10, mats.palletBox, px + 0.04, py + 0.14, pz + 0.05, meta));
              }
            }
            cumX += mod.bl;
          });
          group.add(mkBox(0.09, h, 0.09, mats.heavyPost, cumX, 0, 0, meta));
          group.add(mkBox(0.09, h, 0.09, mats.heavyPost, cumX, 0, d - 0.09, meta));
          scene.add(group);
          interactiveObjects.push(group);
        });
      }
    }

    // 7. Obstacles (Columns / Openings)
    if (PROJECT_STATE.obstacles) {
      PROJECT_STATE.obstacles.forEach(function(obs, oi) {
        const group = new THREE.Group();
        const meta = { name: obs.type === 'column' ? ('Columna Estructural #' + (oi + 1)) : ('Abertura de Paso #' + (oi + 1)), type: 'obstacle', idx: oi };
        if (obs.type === 'column') {
          const dVal = obs.d || obs.w;
          group.add(mkBox(obs.w, H, dVal, mats.column, obs.x, 0, obs.z, meta));
          group.add(mkBox(obs.w + 0.12, 0.1, dVal + 0.12, mats.colBase, obs.x - 0.06, 0, obs.z - 0.06, meta));
        } else {
          const fw = obs.w;
          const fh = obs.fh || 2.5;
          const ft = 0.12;
          group.add(mkBox(ft, fh, ft, mats.opening, obs.x, 0, obs.z, meta));
          group.add(mkBox(ft, fh, ft, mats.opening, obs.x + fw - ft, 0, obs.z, meta));
          group.add(mkBox(fw, ft, ft, mats.opening, obs.x, fh - ft, obs.z, meta));
          group.add(mkBox(fw, 0.015, 0.18, mats.openFloor, obs.x, 0, obs.z - 0.09, meta));
        }
        scene.add(group);
        interactiveObjects.push(group);
      });
    }

    // 8. Doors
    if (PROJECT_STATE.doors) {
      PROJECT_STATE.doors.forEach(function(door, idx) {
        const group = new THREE.Group();
        const rot = (((door.rotation || 0) % 360) + 360) % 360;
        const dW = door.width || (door.section === 'deposito' ? 3.0 : 2.0);
        const dH = door.height || (door.section === 'deposito' ? 3.5 : 2.4);
        const meta = { name: 'Acceso / Portón #' + (idx + 1), type: 'door', idx: idx };

        if (rot === 0) { group.position.set(door.x, 0, door.z); }
        else if (rot === 90) { group.position.set(door.x, 0, door.z + dW); group.rotation.y = Math.PI / 2; }
        else if (rot === 180) { group.position.set(door.x + dW, 0, door.z + 0.25); group.rotation.y = Math.PI; }
        else if (rot === 270) { group.position.set(door.x + 0.25, 0, door.z); group.rotation.y = -Math.PI / 2; }

        group.add(mkBox(0.08, dH, 0.08, mats.doorFrame, 0, 0, 0, meta));
        group.add(mkBox(0.08, dH, 0.08, mats.doorFrame, dW - 0.08, 0, 0, meta));
        group.add(mkBox(dW, 0.10, 0.08, mats.doorFrame, 0, dH - 0.10, 0, meta));
        const leafW = (dW - 0.16) / 2;
        group.add(mkBox(leafW - 0.01, dH - 0.12, 0.015, mats.glass, 0.08, 0.01, 0.03, meta));
        group.add(mkBox(leafW - 0.01, dH - 0.12, 0.015, mats.glass, 0.08 + leafW + 0.01, 0.01, 0.03, meta));

        scene.add(group);
        interactiveObjects.push(group);
      });
    }

    // ── 2D Subtle Architectural Dimensions (Cotas) ──
    const ctx = dimCanvas.getContext('2d');

    function project3Dto2D(x, y, z) {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * dimCanvas.width,
        y: (-v.y * 0.5 + 0.5) * dimCanvas.height,
        visible: v.z < 1.0,
      };
    }

    function drawSubtleCota(p1, p2, text, color) {
      if (!p1.visible && !p2.visible) return;
      const strokeCol = color || '#38bdf8';

      ctx.save();
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.85;

      // Guide line
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Architectural 45° tick marks
      const tick = 4;
      ctx.beginPath();
      ctx.moveTo(p1.x - tick, p1.y - tick);
      ctx.lineTo(p1.x + tick, p1.y + tick);
      ctx.moveTo(p2.x - tick, p2.y - tick);
      ctx.lineTo(p2.x + tick, p2.y + tick);
      ctx.stroke();

      // Measurement pill in center
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2 - 12;

      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      const tw = ctx.measureText(text).width + 12;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(mx - tw / 2, my - 9, tw, 18, 5);
      } else {
        ctx.rect(mx - tw / 2, my - 9, tw, 18);
      }
      ctx.fill();

      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, mx, my);
      ctx.restore();
    }

    function renderDimensions() {
      if (dimCanvas.width !== window.innerWidth || dimCanvas.height !== window.innerHeight) {
        dimCanvas.width = window.innerWidth;
        dimCanvas.height = window.innerHeight;
      }

      ctx.clearRect(0, 0, dimCanvas.width, dimCanvas.height);
      if (!showDimensions) return;

      if (isSalon) {
        // Góndolas Pared cotas
        (PROJECT_STATE.gondolaPared && PROJECT_STATE.gondolaPared.lines ? PROJECT_STATE.gondolaPared.lines : []).forEach(function(gline) {
          const b = getGondolaParedLineBounds(gline, PROJECT_STATE.gondolaPared.depth || 0.47);
          const pA = project3Dto2D(b.x0, 0.05, b.z0);
          const pB = project3Dto2D(b.x1, 0.05, b.z0);
          drawSubtleCota(pA, pB, realGondolaParedLineWidth(gline).toFixed(2) + ' m (G. Pared)', '#f43f5e');
        });

        // Góndolas Centrales cotas
        const centralBounds = [];
        (PROJECT_STATE.gondolaCentral && PROJECT_STATE.gondolaCentral.lines ? PROJECT_STATE.gondolaCentral.lines : []).forEach(function(gcline) {
          const b = getGondolaCentralLineBounds(gcline, PROJECT_STATE.gondolaCentral.depth || 0.94);
          centralBounds.push(b);
          const pA = project3Dto2D(b.x0, 0.05, b.z0);
          const pB = project3Dto2D(b.x1, 0.05, b.z0);
          drawSubtleCota(pA, pB, realGondolaCentralLineWidth(gcline).toFixed(2) + ' m (G. Central)', '#ec4899');
        });

        // Pasillo corridor clearance between parallel central gondolas
        for (let i = 0; i < centralBounds.length; i++) {
          for (let j = i + 1; j < centralBounds.length; j++) {
            const b1 = centralBounds[i];
            const b2 = centralBounds[j];
            const overlapX0 = Math.max(b1.x0, b2.x0);
            const overlapX1 = Math.min(b1.x1, b2.x1);
            if (overlapX1 - overlapX0 > 0.6) {
              const gapZ = Math.min(Math.abs(b2.z0 - b1.z1), Math.abs(b1.z0 - b2.z1));
              if (gapZ > 0.5 && gapZ < 6.0) {
                const midX = (overlapX0 + overlapX1) / 2;
                const p1 = project3Dto2D(midX, 0.04, Math.min(b1.z1, b2.z1));
                const p2 = project3Dto2D(midX, 0.04, Math.max(b1.z0, b2.z0));
                drawSubtleCota(p1, p2, gapZ.toFixed(2) + ' m Pasillo', '#38bdf8');
              }
            }
          }
        }

        // Punteras cotas
        (PROJECT_STATE.punteras || []).forEach(function(p) {
          const b = getPunteraBounds(p);
          const pA = project3Dto2D(b.x0, 0.05, b.z0);
          const pB = project3Dto2D(b.x1, 0.05, b.z0);
          drawSubtleCota(pA, pB, (p.width || 0.9).toFixed(2) + ' m Puntera', '#f59e0b');
        });

        // Heladeras cotas
        (PROJECT_STATE.heladeras || []).forEach(function(h) {
          const b = getHeladeraBounds(h);
          const pA = project3Dto2D(b.x0, 0.05, b.z0);
          const pB = project3Dto2D(b.x1, 0.05, b.z0);
          const lbl = h.type === 'mostrador' ? 'Mostrador Vitrina' : 'Heladera';
          drawSubtleCota(pA, pB, (h.width || 1.8).toFixed(2) + ' m (' + lbl + ')', '#06b6d4');
        });

        // Check Outs cotas
        (PROJECT_STATE.checkouts || []).forEach(function(c) {
          const b = getCheckoutBounds(c);
          const pA = project3Dto2D(b.x0, 0.05, b.z0);
          const pB = project3Dto2D(b.x1, 0.05, b.z0);
          drawSubtleCota(pA, pB, (c.length || 1.8).toFixed(2) + ' m Check Out', '#10b981');
        });
      } else {
        // Depósito cotas
        (PROJECT_STATE.lines || []).forEach(function(line) {
          const b = getMinirackLineBounds(line, PROJECT_STATE.depth || 0.6);
          const pA = project3Dto2D(b.x0, 0.05, b.z0);
          const pB = project3Dto2D(b.x1, 0.05, b.z0);
          drawSubtleCota(pA, pB, realMinirackLineWidth(line).toFixed(2) + ' m (Minirack)', '#f97316');
        });

        (PROJECT_STATE.heavyRacks && PROJECT_STATE.heavyRacks.lines ? PROJECT_STATE.heavyRacks.lines : []).forEach(function(hrl) {
          const b = getHeavyRackLineBounds(hrl, PROJECT_STATE.heavyRacks.depth || 1.10);
          const pA = project3Dto2D(b.x0, 0.05, b.z0);
          const pB = project3Dto2D(b.x1, 0.05, b.z0);
          drawSubtleCota(pA, pB, realHeavyRackLineWidth(hrl).toFixed(2) + ' m (Rack Pesado)', '#ea580c');
        });
      }
    }

    // Toggle Cotas on/off with button
    function toggleDimensions() {
      showDimensions = !showDimensions;
      if (showDimensions) {
        btnToggleCotas.className = 'hud-btn toggle-cotas-active';
        cotasLabel.textContent = 'Ocultar Cotas';
        dimCanvas.style.opacity = '1';
      } else {
        btnToggleCotas.className = 'hud-btn toggle-cotas-hidden';
        cotasLabel.textContent = 'Mostrar Cotas';
        dimCanvas.style.opacity = '0';
      }
    }

    // ── Camera Presets & Navigation ──
    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();
    let isTransitioning = false;

    function smoothTransitionTo(camPos, lookAt) {
      targetCamPos.copy(camPos);
      targetLookAt.copy(lookAt);
      isTransitioning = true;
    }

    function setPresetView(preset) {
      document.querySelectorAll('.hud-panel .hud-btn').forEach(function(b) {
        if (b.id && b.id.indexOf('btn-') === 0 && b.id !== 'btn-toggle-cotas') b.classList.remove('active');
      });
      isWalkMode = false;
      walkNotice.style.display = 'none';

      const cx = W / 2;
      const cz = D / 2;

      if (preset === 'iso') {
        const btn = document.getElementById('btn-iso');
        if (btn) btn.classList.add('active');
        smoothTransitionTo(new THREE.Vector3(cx + W * 0.7, Math.max(W, D) * 0.75, cz + D * 0.8), new THREE.Vector3(cx, 1.2, cz));
      } else if (preset === 'top') {
        const btn = document.getElementById('btn-top');
        if (btn) btn.classList.add('active');
        smoothTransitionTo(new THREE.Vector3(cx, Math.max(W, D) * 1.35, cz + 0.001), new THREE.Vector3(cx, 0, cz));
      } else if (preset === 'front') {
        const btn = document.getElementById('btn-front');
        if (btn) btn.classList.add('active');
        smoothTransitionTo(new THREE.Vector3(cx, 2.5, D + 6), new THREE.Vector3(cx, 1.5, cz));
      }
    }

    function resetProjectCamera() {
      setPresetView('iso');
    }

    let isWalkMode = false;
    function toggleWalkMode() {
      isWalkMode = !isWalkMode;
      const btn = document.getElementById('btn-walk');
      if (isWalkMode) {
        document.querySelectorAll('.hud-panel .hud-btn').forEach(function(b) {
          if (b.id && b.id.indexOf('btn-') === 0 && b.id !== 'btn-toggle-cotas') b.classList.remove('active');
        });
        if (btn) btn.classList.add('active');
        walkNotice.style.display = 'block';
        smoothTransitionTo(new THREE.Vector3(2.5, 1.65, 3.5), new THREE.Vector3(2.5, 1.65, 8.0));
      } else {
        if (btn) btn.classList.remove('active');
        walkNotice.style.display = 'none';
        setPresetView('iso');
      }
    }

    // Floor click cursor walkthrough
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    window.addEventListener('click', function(e) {
      if (!isWalkMode) return;
      if (e.target.closest && (e.target.closest('.top-header') || e.target.closest('.hud-controls') || e.target.closest('.bottom-hint'))) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(floorPlane, hit)) {
        const targetX = Math.max(0.6, Math.min(W - 0.6, hit.x));
        const targetZ = Math.max(0.6, Math.min(D - 0.6, hit.z));

        const currentForward = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
        smoothTransitionTo(
          new THREE.Vector3(targetX, 1.65, targetZ),
          new THREE.Vector3(targetX + currentForward.x * 4, 1.65, targetZ + currentForward.z * 4)
        );
      }
    });

    // Hover inspection tooltip
    window.addEventListener('mousemove', function(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const allMeshes = [];
      interactiveObjects.forEach(function(g) {
        g.traverse(function(child) { if (child.isMesh && child.userData && child.userData.name) allMeshes.push(child); });
      });

      const hits = raycaster.intersectObjects(allMeshes);
      if (hits.length > 0 && hits[0].object.userData.name) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY + 14) + 'px';
        tooltip.innerHTML = '🔍 ' + hits[0].object.userData.name;
      } else {
        tooltip.style.display = 'none';
      }
    });

    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      dimCanvas.width = window.innerWidth;
      dimCanvas.height = window.innerHeight;
      renderDimensions();
    });

    // Initial camera placement
    const cx = W / 2;
    const cz = D / 2;
    camera.position.set(cx + W * 0.7, Math.max(W, D) * 0.75, cz + D * 0.8);
    controls.target.set(cx, 1.2, cz);
    controls.update();

    // ── Main Animation Render Loop ──
    function animate() {
      requestAnimationFrame(animate);

      if (isTransitioning) {
        camera.position.lerp(targetCamPos, 0.08);
        controls.target.lerp(targetLookAt, 0.08);
        if (camera.position.distanceTo(targetCamPos) < 0.05 && controls.target.distanceTo(targetLookAt) < 0.05) {
          camera.position.copy(targetCamPos);
          controls.target.copy(targetLookAt);
          isTransitioning = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      renderDimensions();
    }
    animate();
  </script>
</body>
</html>`;
}
