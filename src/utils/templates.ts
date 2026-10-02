import { AppState } from '../types';

export function createDefaultSalonState(): AppState {
  return {
    activeSection: 'salon',

    // Salón Components
    gondolaPared: {
      height: 2.0,
      depth: 0.47,
      shelfCount: 5,
      moduleLength: 1.0,
      lines: [
        {
          xOff: 1.0,
          zOff: 0.6,
          rotation: 0,
          modules: [
            { bl: 1.0, sc: 5, depth: 0.47 },
            { bl: 1.0, sc: 5, depth: 0.47 },
            { bl: 1.0, sc: 5, depth: 0.47 },
          ],
        },
      ],
    },

    gondolaCentral: {
      height: 1.6,
      depth: 0.47,
      shelfCount: 4,
      moduleLength: 1.0,
      lines: [
        {
          xOff: 2.5,
          zOff: 3.5,
          rotation: 0,
          height: 1.6,
          modules: [
            {
              bl: 1.0,
              height: 1.6,
              scA: 4,
              scB: 4,
              depthA: 0.47,
              depthB: 0.47,
            },
            {
              bl: 1.0,
              height: 1.6,
              scA: 4,
              scB: 4,
              depthA: 0.47,
              depthB: 0.47,
            },
          ],
        },
      ],
    },

    punteras: [
      {
        id: 201,
        x: 4.6,
        z: 3.5,
        rotation: 90,
        width: 0.94,
        height: 1.6,
        depth: 0.47,
        shelfCount: 4,
      },
    ],

    heladeras: [
      {
        id: 301,
        x: 6.5,
        z: 0.6,
        rotation: 0,
        type: 'mural_vidrio',
        width: 2.0,
        depth: 0.85,
        height: 2.0,
        color: 'negro',
        doorsCount: 3,
        illuminated: true,
      },
      {
        id: 302,
        x: 8.8,
        z: 0.6,
        rotation: 0,
        type: 'mostrador',
        width: 2.0,
        depth: 0.95,
        height: 1.25,
        color: 'inox',
        doorsCount: 3,
        illuminated: true,
      },
    ],

    checkouts: [
      {
        id: 401,
        x: 2.0,
        z: 6.8,
        rotation: 0,
        type: 'estandar',
        length: 1.8,
        width: 1.1,
        height: 0.88,
        scannerSide: 'derecha',
        hasBelt: true,
      },
      {
        id: 402,
        x: 4.5,
        z: 6.8,
        rotation: 0,
        type: 'estandar',
        length: 2.0,
        width: 1.1,
        height: 0.88,
        scannerSide: 'izquierda',
        hasBelt: true,
      },
    ],

    // Depósito Components (empty in Salón template)
    height: 2.4,
    depth: 0.6,
    shelfCount: 3,
    lines: [],

    heavyRacks: {
      height: 4.5,
      depth: 1.10,
      defaultLevels: 3,
      lines: [],
    },

    shelfHeight: 2.0,
    shelfDepth: 0.42,
    shelfLevels: 5,
    shelfCapacity: 100,
    shelfLines: [],

    // Puertas y Portones (Comercial glass door)
    doors: [
      {
        id: 501,
        x: 4.0,
        z: 9.8,
        rotation: 0,
        section: 'salon',
        type: 'vidrio_doble',
        width: 2.4,
        height: 2.3,
      },
    ],

    // Espacio Salón Comercial
    warehouse: {
      enabled: true,
      width: 13.0,
      depth: 10.0,
      height: 3.8,
      wallColor: '#1e293b',
      wallOpacity: 0.25,
      floorType: 'porcelanato',
    },

    obstacles: [
      { id: 101, type: 'column', x: 6.5, z: 4.5, w: 0.4, d: 0.4 },
    ],

    viewMode: 'standard',
    lightIntensity: 1.0,
    showDims: true,
    showShelfDims: false,
    showShadows: true,
    showGrid: true,

    meta: {
      cliente: '',
      nroPlano: '',
      fecha: new Date().toISOString().slice(0, 10),
      whatsapp: '',
    },
  };
}

export function createDefaultDepositoState(): AppState {
  return {
    activeSection: 'deposito',

    // Depósito Components
    // 1. Miniracks (Racks Livianos)
    height: 2.4,
    depth: 0.8,
    shelfCount: 4,
    lines: [
      {
        xOff: 1.0,
        zOff: 7.0,
        rotation: 0,
        modules: [
          { bl: 1.5, sc: 4 },
          { bl: 1.5, sc: 4 },
        ],
      },
    ],

    // 2. Racks Pesados (Selectivos para pallets)
    heavyRacks: {
      height: 5.0,
      depth: 1.10,
      defaultLevels: 3,
      lines: [
        {
          xOff: 1.0,
          zOff: 2.5,
          rotation: 0,
          height: 5.0,
          depth: 1.10,
          modules: [
            { bl: 2.70, levels: 3, capPerLevel: 2500, withPallets: true },
            { bl: 2.70, levels: 3, capPerLevel: 2500, withPallets: true },
            { bl: 2.70, levels: 3, capPerLevel: 2500, withPallets: true },
          ],
        },
      ],
    },

    // 3. Estanterías Metálicas
    shelfHeight: 2.4,
    shelfDepth: 0.42,
    shelfLevels: 5,
    shelfCapacity: 100,
    shelfLines: [
      {
        xOff: 1.0,
        zOff: 10.5,
        rotation: 0,
        modules: [
          { bl: 0.9, sc: 5 },
          { bl: 0.9, sc: 5 },
          { bl: 0.9, sc: 5 },
        ],
      },
    ],

    // Salón Components (empty in Depósito template)
    gondolaPared: {
      height: 2.0,
      depth: 0.47,
      shelfCount: 5,
      moduleLength: 1.0,
      lines: [],
    },

    gondolaCentral: {
      height: 1.6,
      depth: 0.47,
      shelfCount: 4,
      moduleLength: 1.0,
      lines: [],
    },

    punteras: [],
    heladeras: [],
    checkouts: [],

    // Portón Industrial de Carga y Descarga
    doors: [
      {
        id: 502,
        x: 1.5,
        z: 14.0,
        rotation: 0,
        section: 'deposito',
        type: 'porton_industrial',
        width: 3.8,
        height: 4.2,
      },
    ],

    // Espacio Nave Industrial
    warehouse: {
      enabled: true,
      width: 18.0,
      depth: 14.0,
      height: 6.0,
      wallColor: '#0f172a',
      wallOpacity: 0.35,
      floorType: 'hormigon',
    },

    obstacles: [
      { id: 102, type: 'column', x: 9.0, z: 6.0, w: 0.5, d: 0.5 },
      { id: 103, type: 'column', x: 9.0, z: 10.0, w: 0.5, d: 0.5 },
    ],

    viewMode: 'standard',
    lightIntensity: 1.0,
    showDims: true,
    showShelfDims: false,
    showShadows: true,
    showGrid: true,

    meta: {
      cliente: '',
      nroPlano: '',
      fecha: new Date().toISOString().slice(0, 10),
      whatsapp: '',
    },
  };
}
