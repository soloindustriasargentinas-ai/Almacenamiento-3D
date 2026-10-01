import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AppState } from '../types';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'trialing' | 'canceled';
  createdAt: string;
  updatedAt: string;
}

export interface DbClient {
  id: string;
  userId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  minirackCount: number;
  shelfCount: number;
  gondolaParedCount: number;
  gondolaCentralCount: number;
  warehouseArea: number;
  shelfLevelsTotal: number;
  punterasCount?: number;
  heladerasCount?: number;
  checkoutsCount?: number;
  heavyRackCount?: number;
  puertasCount?: number;
}

export interface DbProject {
  id: string;
  userId: string;
  clientId?: string;
  clientName?: string;
  name: string;
  description?: string;
  workspaceType?: 'salon' | 'deposito';
  warehouseState: string; // Serialized AppState
  stats: ProjectStats;
  createdAt: string;
  updatedAt: string;
}

// Local Storage Helpers for maximum resilience & instant offline availability
const LOCAL_PROJECTS_KEY = 'rack3d_saved_projects_v2';
const LOCAL_CLIENTS_KEY = 'rack3d_saved_clients_v2';

function getLocalProjects(): DbProject[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProjects(projs: DbProject[]) {
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projs));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function getLocalClients(): DbClient[] {
  try {
    const raw = localStorage.getItem(LOCAL_CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalClients(cls: DbClient[]) {
  try {
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(cls));
  } catch (e) {
    console.warn('LocalStorage save clients failed:', e);
  }
}

export function calculateProjectStats(state: AppState): ProjectStats {
  let minirackCount = 0;
  let minirackShelves = 0;
  for (const l of (state.lines || [])) {
    minirackCount += l.modules.length;
    for (const m of l.modules) minirackShelves += m.sc;
  }

  let heavyRackCount = 0;
  let heavyRackShelves = 0;
  for (const l of (state.heavyRacks?.lines || [])) {
    heavyRackCount += l.modules.length;
    for (const m of l.modules) heavyRackShelves += m.levels;
  }

  let shelfCount = 0;
  let shelfLevels = 0;
  for (const l of (state.shelfLines || [])) {
    shelfCount += l.modules.length;
    for (const m of l.modules) shelfLevels += m.sc;
  }

  let gondolaParedCount = 0;
  let gondolaParedShelves = 0;
  for (const l of (state.gondolaPared?.lines || [])) {
    gondolaParedCount += l.modules.length;
    for (const m of l.modules) gondolaParedShelves += m.sc;
  }

  let gondolaCentralCount = 0;
  let gondolaCentralShelves = 0;
  for (const l of (state.gondolaCentral?.lines || [])) {
    gondolaCentralCount += l.modules.length;
    for (const m of l.modules) gondolaCentralShelves += (m.scA + m.scB);
  }

  const punterasCount = state.punteras?.length || 0;
  const heladerasCount = state.heladeras?.length || 0;
  const checkoutsCount = state.checkouts?.length || 0;
  const puertasCount = state.doors?.length || 0;

  const warehouseArea = state.warehouse.enabled 
    ? Math.round(state.warehouse.width * state.warehouse.depth) 
    : 0;

  return {
    minirackCount,
    shelfCount,
    gondolaParedCount,
    gondolaCentralCount,
    warehouseArea,
    shelfLevelsTotal: minirackShelves + heavyRackShelves + shelfLevels + gondolaParedShelves + gondolaCentralShelves,
    punterasCount,
    heladerasCount,
    checkoutsCount,
    heavyRackCount,
    puertasCount,
  };
}

// User Profile Operations
export async function syncUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL?: string | null }): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const now = new Date().toISOString();
    if (snap.exists()) {
      return snap.data() as UserProfile;
    } else {
      const newProfile: UserProfile = {
        id: user.uid,
        email: user.email || 'usuario@industrias.com',
        displayName: user.displayName || 'Usuario Industrial',
        photoURL: user.photoURL || '',
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    console.warn('Could not sync user profile to firestore, returning local fallback:', err);
    return {
      id: user.uid,
      email: user.email || 'usuario@industrias.com',
      displayName: user.displayName || 'Usuario Industrial',
      subscriptionPlan: 'free',
      subscriptionStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function updateSubscription(userId: string, plan: 'free' | 'pro' | 'enterprise'): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      subscriptionPlan: plan,
      subscriptionStatus: 'active',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Subscription update failed:', err);
  }
}

// Client Operations
export async function getClients(userId?: string): Promise<DbClient[]> {
  const local = getLocalClients();
  if (!userId) return local;

  try {
    const q = query(collection(db, 'clients'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const clients: DbClient[] = [];
    querySnapshot.forEach((d) => {
      clients.push(d.data() as DbClient);
    });
    
    // Merge with local items that have same user
    const map = new Map<string, DbClient>();
    local.forEach((c) => { if (c.userId === userId) map.set(c.id, c); });
    clients.forEach((c) => map.set(c.id, c));
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    console.warn('Firestore clients list failed, returning local storage:', err);
    return local.filter((c) => !userId || c.userId === userId);
  }
}

export async function saveClient(client: Omit<DbClient, 'createdAt' | 'updatedAt'> & { createdAt?: string }): Promise<DbClient> {
  const now = new Date().toISOString();
  const id = client.id || `client_${Date.now()}`;
  const fullClient: DbClient = {
    ...client,
    id,
    createdAt: client.createdAt || now,
    updatedAt: now,
  };

  // Always save to local cache
  const local = getLocalClients().filter((c) => c.id !== id);
  local.unshift(fullClient);
  saveLocalClients(local);

  // Sync to Firestore if authenticated
  if (client.userId && client.userId !== 'local_user') {
    try {
      await setDoc(doc(db, 'clients', id), fullClient);
    } catch (err) {
      console.warn('Firestore client save failed (cached locally):', err);
    }
  }

  return fullClient;
}

export async function deleteClient(clientId: string): Promise<void> {
  const local = getLocalClients().filter((c) => c.id !== clientId);
  saveLocalClients(local);

  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (err) {
    console.warn('Firestore client delete failed:', err);
  }
}

// Project Operations
export async function getProjects(userId?: string): Promise<DbProject[]> {
  const local = getLocalProjects();
  if (!userId) return local;

  try {
    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const projects: DbProject[] = [];
    querySnapshot.forEach((d) => {
      projects.push(d.data() as DbProject);
    });

    // Merge with local items
    const map = new Map<string, DbProject>();
    local.forEach((p) => { if (p.userId === userId) map.set(p.id, p); });
    projects.forEach((p) => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    console.warn('Firestore projects list failed, returning local storage:', err);
    return local.filter((p) => !userId || p.userId === userId);
  }
}

export async function saveProject(
  userId: string, 
  projectName: string, 
  state: AppState, 
  projectId?: string, 
  clientId?: string, 
  clientName?: string,
  description?: string
): Promise<DbProject> {
  const now = new Date().toISOString();
  const id = projectId || `proj_${Date.now()}`;
  const stats = calculateProjectStats(state);
  const serialized = JSON.stringify(state);

  const fullProj: DbProject = {
    id,
    userId: userId || 'local_user',
    clientId: clientId || '',
    clientName: clientName || state.meta.cliente || 'Sin cliente asignado',
    name: projectName || 'Almacén 3D',
    description: description || '',
    workspaceType: state.activeSection || 'salon',
    warehouseState: serialized,
    stats,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Always update local storage first so user NEVER loses data
  const local = getLocalProjects().filter((p) => p.id !== id);
  local.unshift(fullProj);
  saveLocalProjects(local);

  // 2. Sync to Firestore in background / await if online
  if (userId && userId !== 'local_user') {
    try {
      await setDoc(doc(db, 'projects', id), fullProj);
    } catch (err) {
      console.warn('Firestore project save failed, saved locally:', err);
      // Return project anyway so user workflow NEVER blocks!
    }
  }

  return fullProj;
}

export async function deleteProject(projectId: string): Promise<void> {
  const local = getLocalProjects().filter((p) => p.id !== projectId);
  saveLocalProjects(local);

  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    console.warn('Firestore project delete failed:', err);
  }
}
