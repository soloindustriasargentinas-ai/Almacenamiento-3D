export type ViewMode = 'standard' | 'realistic' | 'wireframe';

export type WorkspaceSection = 'salon' | 'deposito';

export type ActiveTab = 
  // Salón tabs
  | 'salon-espacio'
  | 'gondola-pared' 
  | 'gondola-central' 
  | 'punteras'
  | 'heladeras'
  | 'checkouts'
  | 'salon-puertas'
  | 'salon-obstaculos'
  // Depósito tabs
  | 'deposito-espacio'
  | 'racks-livianos'
  | 'racks-pesados'
  | 'estanterias'
  | 'deposito-puertas'
  | 'deposito-obstaculos'
  // Shared / Legacy
  | 'miniracks'
  | 'deposito'
  | 'obstaculos'
  | 'vista';

// ── Miniracks (Racks Livianos) ──
export interface MinirackModule {
  bl: number; // beam length in meters: 1.2, 1.5, 1.8
  sc: number; // shelf count
}

export interface MinirackLine {
  xOff: number;
  zOff: number;
  rotation: number; // 0, 90, 180, 270
  modules: MinirackModule[];
}

// ── Racks Pesados (Selectivos para Pallets) ──
export interface HeavyRackModule {
  bl: number; // 2.30 (2 pallets), 2.70 (3 pallets), 3.30 (3-4 pallets)
  levels: number; // 2 to 6 levels
  capPerLevel?: number; // kg: 1500, 2000, 3000
  withPallets?: boolean;
}

export interface HeavyRackLine {
  xOff: number;
  zOff: number;
  rotation: number; // 0, 90, 180, 270
  height: number; // 3.0, 4.0, 5.0, 6.0
  depth: number; // 1.00, 1.10
  modules: HeavyRackModule[];
}

// ── Estanterías Metálicas ──
export interface ShelfModule {
  bl: number; // 0.9, 1.0, 1.2
  sc: number; // shelf levels
  cap?: number; // capacity per shelf in kg (default 100)
}

export interface ShelfLine {
  xOff: number;
  zOff: number;
  rotation: number; // 0, 90, 180, 270
  modules: ShelfModule[];
}

// ── Góndolas de Pared ──
export interface GondolaParedModule {
  bl: number; // 0.70, 0.90, 1.20 (1.0m no existe)
  sc: number; // shelf count
  height?: number; // 2.00m (fijo)
  depth?: number; // 0.38 or 0.47
}

export interface GondolaParedLine {
  xOff: number;
  zOff: number;
  rotation: number; // 0, 90, 180, 270
  height?: number; // 2.00m
  modules: GondolaParedModule[];
}

// ── Góndolas Centrales (Islas) ──
export interface GondolaCentralModule {
  bl: number; // 0.70, 0.90, 1.20 (1.0m no existe)
  height?: number; // 1.20, 1.60, 1.75, 2.00
  scA: number;
  scB: number;
  depthA?: number;
  depthB?: number;
}

export interface GondolaCentralLine {
  xOff: number;
  zOff: number;
  rotation: number; // 0 or 90
  height: number;
  modules: GondolaCentralModule[];
}

// ── Punteras de Góndola (Salón) ──
export interface PunteraGondola {
  id: number;
  x: number;
  z: number;
  rotation: number; // 0, 90, 180, 270
  width: number; // 0.90, 1.00, 1.20
  height: number; // 1.20, 1.60, 1.75, 2.00
  depth: number; // 0.38, 0.47
  shelfCount: number; // 3 to 6
  attachedCentralIdx?: number | null;
}

// ── Heladeras Comerciales (Salón) ──
export interface HeladeraComercial {
  id: number;
  x: number;
  z: number;
  rotation: number; // 0, 90, 180, 270
  type: 'mural_vidrio' | 'mural_abierto' | 'isla_congelados' | 'mostrador';
  width: number; // 1.20, 1.60, 1.80, 2.00, 2.40
  depth: number; // 0.85, 0.95, 1.00
  height: number; // 1.25, 2.00, 2.20
  color: 'blanco' | 'negro' | 'inox';
  doorsCount: number; // 2, 3, 4
  illuminated: boolean;
}

// ── Check Outs / Cajas de Cobro (Salón) ──
export interface CheckoutCounter {
  id: number;
  x: number;
  z: number;
  rotation: number; // 0, 90, 180, 270
  type: 'estandar' | 'pasante' | 'express';
  length: number; // 1.60, 1.80, 2.00
  width: number; // 1.00, 1.10
  height: number; // 0.88
  scannerSide: 'derecha' | 'izquierda';
  hasBelt: boolean;
}

// ── Puertas y Portones (Salón y Depósito) ──
export interface CommercialDoor {
  id: number;
  x: number;
  z: number;
  rotation: number; // 0, 90, 180, 270
  section: WorkspaceSection; // 'salon' | 'deposito'
  type: 'vidrio_doble' | 'automatica' | 'porton_industrial';
  width: number; // 1.20, 1.80, 2.40, 3.00, 4.00
  height: number; // 2.10, 2.40, 3.50, 4.50
}

// ── Obstáculos (Columnas y Aberturas) ──
export interface Obstacle {
  id: number;
  type: 'column' | 'opening';
  x: number;
  z: number;
  w: number;
  d?: number;
  fh?: number;
  rotation?: number;
}

// ── Warehouse & Espacio ──
export interface WarehouseConfig {
  enabled: boolean;
  width: number;
  depth: number;
  height: number;
  wallColor: string;
  wallOpacity: number;
  floorType?: 'hormigon' | 'porcelanato' | 'epoxi' | 'rejilla';
}

export interface MetaConfig {
  cliente: string;
  nroPlano: string;
  fecha: string;
  whatsapp: string;
}

export interface SelectionState {
  type: 
    | 'minirack' 
    | 'estanteria' 
    | 'gondolaPared' 
    | 'gondolaCentral' 
    | 'puntera' 
    | 'heladera' 
    | 'checkout' 
    | 'door' 
    | 'heavyRack' 
    | 'obstacle' 
    | null;
  idx: number | null;
}

export interface AppState {
  // Active Workspace: Salón o Depósito
  activeSection: WorkspaceSection;

  // ── Salón Elements ──
  gondolaPared: {
    height: number;
    depth: number;
    shelfCount: number;
    moduleLength: number;
    lines: GondolaParedLine[];
  };

  gondolaCentral: {
    height: number;
    depth: number;
    shelfCount: number;
    moduleLength: number;
    lines: GondolaCentralLine[];
  };

  punteras: PunteraGondola[];
  heladeras: HeladeraComercial[];
  checkouts: CheckoutCounter[];

  // ── Depósito Elements ──
  // Miniracks (Racks Livianos)
  height: number;
  depth: number;
  shelfCount: number;
  lines: MinirackLine[];

  // Racks Pesados (Selectivos para pallets)
  heavyRacks: {
    height: number;
    depth: number;
    defaultLevels: number;
    lines: HeavyRackLine[];
  };

  // Estanterías Metálicas
  shelfHeight: number;
  shelfDepth: number;
  shelfLevels: number;
  shelfCapacity: number;
  shelfLines: ShelfLine[];

  // ── Puertas y Portones (Salón y Depósito) ──
  doors: CommercialDoor[];

  // ── Warehouse & Espacio ──
  warehouse: WarehouseConfig;
  obstacles: Obstacle[];

  // ── View & UI Options ──
  viewMode: ViewMode;
  lightIntensity: number;
  showDims: boolean;
  showShelfDims: boolean;
  showShadows: boolean;
  showGrid: boolean;
  
  // ── Metadata ──
  meta: MetaConfig;
}

export interface Bounds3D {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  h?: number;
}

export interface ColliderItem {
  type: 
    | 'minirack' 
    | 'estanteria' 
    | 'gondolaPared' 
    | 'gondolaCentral' 
    | 'puntera' 
    | 'heladera' 
    | 'checkout' 
    | 'door' 
    | 'heavyRack' 
    | 'obstacle';
  idx: number;
  bounds: Bounds3D;
}
