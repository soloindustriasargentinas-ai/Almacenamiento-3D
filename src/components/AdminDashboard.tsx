import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Users, 
  CreditCard, 
  User, 
  Plus, 
  Eye, 
  Trash2, 
  Copy, 
  Search, 
  LogOut, 
  Home, 
  Sparkles, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  Boxes, 
  Layers, 
  Building2, 
  Store,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Share2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  DbProject, 
  DbClient, 
  getProjects, 
  getClients, 
  saveProject, 
  saveClient, 
  deleteProject, 
  deleteClient,
  calculateProjectStats 
} from '../services/dbService';
import { AppState } from '../types';
import { createDefaultSalonState, createDefaultDepositoState } from '../utils/templates';

interface AdminDashboardProps {
  onOpenProjectIn3D: (project: DbProject) => void;
  onNewProjectIn3D: (name: string, clientId?: string, clientName?: string) => void;
  onGoToHome: () => void;
  currentState: AppState;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenProjectIn3D,
  onNewProjectIn3D,
  onGoToHome,
  currentState
}) => {
  const { user, profile, signOut, changeSubscription } = useAuth();

  const [activeTab, setActiveTab] = useState<'projects' | 'clients' | 'subscription' | 'profile'>('projects');
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [clients, setClients] = useState<DbClient[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClientId, setNewProjClientId] = useState('');
  const [newProjSection, setNewProjSection] = useState<'salon' | 'deposito'>('salon');
  const [projectFilter, setProjectFilter] = useState<'all' | 'salon' | 'deposito'>('all');
  const [isCreatingProj, setIsCreatingProj] = useState(false);

  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<DbClient | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  // Load Data
  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [projs, cls] = await Promise.all([
        getProjects(user.uid),
        getClients(user.uid)
      ]);
      setProjects(projs);
      setClients(cls);
    } catch (e) {
      console.error('Error fetching data from Firestore:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Project Actions
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const defaultName = newProjSection === 'salon' ? 'Salón Comercial Nuevo' : 'Depósito Industrial Nuevo';
    const name = newProjName.trim() || defaultName;
    setIsCreatingProj(true);

    const selectedClient = clients.find((c) => c.id === newProjClientId);
    const template = newProjSection === 'salon' ? createDefaultSalonState() : createDefaultDepositoState();
    
    const projState: AppState = {
      ...template,
      activeSection: newProjSection,
      meta: {
        ...template.meta,
        cliente: selectedClient ? selectedClient.name : name,
        nroPlano: `PL-${Date.now().toString().slice(-5)}`,
        fecha: new Date().toISOString().slice(0, 10),
      }
    };

    try {
      const created = await saveProject(
        user?.uid || 'local_user',
        name,
        projState,
        undefined,
        selectedClient?.id,
        selectedClient?.name
      );

      setShowNewProjModal(false);
      setNewProjName('');
      setNewProjClientId('');
      setIsCreatingProj(false);
      fetchData().catch(() => {});
      onOpenProjectIn3D(created);
    } catch (err) {
      console.warn('Fallback al crear proyecto:', err);
      const fallbackCreated: DbProject = {
        id: `proj_${Date.now()}`,
        userId: user?.uid || 'local_user',
        clientId: selectedClient?.id || '',
        clientName: selectedClient?.name || name,
        name,
        description: '',
        warehouseState: JSON.stringify(projState),
        stats: calculateProjectStats(projState),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setShowNewProjModal(false);
      setNewProjName('');
      setNewProjClientId('');
      setIsCreatingProj(false);
      onOpenProjectIn3D(fallbackCreated);
    }
  };

  const handleDuplicateProject = async (proj: DbProject) => {
    if (!user) return;
    try {
      const parsedState: AppState = JSON.parse(proj.warehouseState);
      await saveProject(
        user.uid,
        `${proj.name} (Copia)`,
        parsedState,
        undefined,
        proj.clientId,
        proj.clientName
      );
      fetchData();
    } catch (e) {
      console.error('Error duplicando proyecto:', e);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Client Actions
  const handleSaveClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim() || !user) return;

    await saveClient({
      id: editingClient?.id || `client_${Date.now()}`,
      userId: user.uid,
      name: clientForm.name.trim(),
      company: clientForm.company.trim(),
      email: clientForm.email.trim(),
      phone: clientForm.phone.trim(),
      address: clientForm.address.trim(),
      notes: clientForm.notes.trim(),
    });

    setShowNewClientModal(false);
    setEditingClient(null);
    setClientForm({ name: '', company: '', email: '', phone: '', address: '', notes: '' });
    fetchData();
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const openEditClient = (client: DbClient) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setShowNewClientModal(true);
  };

  // Filtered Items
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (projectFilter === 'all') return true;
    return (p.workspaceType || 'salon') === projectFilter;
  });

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Statistics
  const totalArea = projects.reduce((acc, p) => acc + (p.stats?.warehouseArea || 0), 0);
  const totalRacks = projects.reduce((acc, p) => acc + (p.stats?.minirackCount || 0) + (p.stats?.shelfCount || 0), 0);
  const totalGondolas = projects.reduce((acc, p) => acc + (p.stats?.gondolaParedCount || 0) + (p.stats?.gondolaCentralCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onGoToHome}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
              title="Ir al Inicio"
            >
              <Boxes className="w-6 h-6 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white">Panel de Administración</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {profile?.subscriptionPlan === 'free' ? 'Plan Gratuito Activo' : 'Plan Pro'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Gestor de Almacenes, Clientes & Cotizaciones 3D</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (projects.length > 0) {
                  onOpenProjectIn3D(projects[0]);
                } else {
                  setShowNewProjModal(true);
                }
              }}
              className="px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Abrir Visualizador 3D</span>
            </button>

            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Mis Proyectos ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mis Clientes ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'subscription'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Suscripción & Dominio</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Perfil & Configuración</span>
          </button>

          <div className="ml-auto">
            <button
              onClick={fetchData}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Recargar datos de Firestore"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* TAB 1: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <div className="text-slate-400 text-xs font-semibold">Total Proyectos</div>
                <div className="text-2xl font-extrabold text-white mt-1">{projects.length}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <div className="text-slate-400 text-xs font-semibold">Racks & Estanterías</div>
                <div className="text-2xl font-extrabold text-blue-400 mt-1">{totalRacks}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <div className="text-slate-400 text-xs font-semibold">Góndolas Comerciales</div>
                <div className="text-2xl font-extrabold text-pink-400 mt-1">{totalGondolas}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <div className="text-slate-400 text-xs font-semibold">Superficie Total</div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">{totalArea} m²</div>
              </div>
            </div>

            {/* Filter Tabs & Search & Add */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setProjectFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    projectFilter === 'all'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({projects.length})
                </button>
                <button
                  onClick={() => setProjectFilter('salon')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    projectFilter === 'salon'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Salones ({projects.filter((p) => (p.workspaceType || 'salon') === 'salon').length})</span>
                </button>
                <button
                  onClick={() => setProjectFilter('deposito')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    projectFilter === 'deposito'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-blue-300'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Depósitos ({projects.filter((p) => p.workspaceType === 'deposito').length})</span>
                </button>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar proyectos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => setShowNewProjModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Proyecto 3D</span>
                </button>
              </div>
            </div>

            {/* Project Grid */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-300">No hay proyectos encontrados</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {projectFilter === 'salon'
                    ? 'No hay salones comerciales guardados. Crea uno con góndolas, heladeras y check outs.'
                    : projectFilter === 'deposito'
                    ? 'No hay depósitos guardados. Crea uno con racks pesados, miniracks y estanterías.'
                    : 'Crea tu primer proyecto para diseñar salones o depósitos en 3D.'}
                </p>
                <button
                  onClick={() => setShowNewProjModal(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Crear Proyecto Ahora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((p) => {
                  const isProjSalon = (p.workspaceType || 'salon') === 'salon';
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex flex-col gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit border ${
                                isProjSalon
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                                  : 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                              }`}
                            >
                              {isProjSalon ? <Store className="w-3 h-3 text-rose-400" /> : <Building2 className="w-3 h-3 text-blue-400" />}
                              <span>{isProjSalon ? 'Salón Comercial' : 'Depósito Industrial'}</span>
                            </span>
                            <h4 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                              {p.name}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                            {p.stats?.warehouseArea || 0} m²
                          </span>
                        </div>

                      {p.clientName && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 mb-3 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span>{p.clientName}</span>
                        </div>
                      )}

                      {/* Equipment count badges */}
                      <div className="grid grid-cols-2 gap-2 my-3 text-[11px] text-slate-400">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500">Miniracks:</span>{' '}
                          <strong className="text-blue-300">{p.stats?.minirackCount || 0} mód.</strong>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500">Góndolas:</span>{' '}
                          <strong className="text-pink-300">
                            {(p.stats?.gondolaParedCount || 0) + (p.stats?.gondolaCentralCount || 0)} mód.
                          </strong>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-2">
                        <span>Actualizado: {new Date(p.updatedAt).toLocaleDateString()}</span>
                        <span>{p.stats?.shelfLevelsTotal || 0} bandejas</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenProjectIn3D(p)}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Abrir en 3D</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateProject(p)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Duplicar Proyecto"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteProject(p.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Eliminar Proyecto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLIENTS */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar clientes por nombre, empresa o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  setEditingClient(null);
                  setClientForm({ name: '', company: '', email: '', phone: '', address: '', notes: '' });
                  setShowNewClientModal(true);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Cliente</span>
              </button>
            </div>

            {filteredClients.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-300">No hay clientes registrados</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Agrega empresas o contactos para asociarlos a tus proyectos y cotizaciones.
                </p>
                <button
                  onClick={() => setShowNewClientModal(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Agregar Cliente
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((c) => {
                  const clientProjects = projects.filter((p) => p.clientId === c.id);
                  return (
                    <div
                      key={c.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-base">{c.name}</h4>
                            {c.company && (
                              <p className="text-xs font-semibold text-blue-400">{c.company}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                            {clientProjects.length} proy.
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-slate-300">
                          {c.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span className="truncate">{c.email}</span>
                            </div>
                          )}
                          {c.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span className="truncate">{c.address}</span>
                            </div>
                          )}
                        </div>

                        {c.notes && (
                          <p className="mt-3 text-xs text-slate-500 italic line-clamp-2 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            "{c.notes}"
                          </p>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setNewProjClientId(c.id);
                            setNewProjName(`Almacén - ${c.name}`);
                            setShowNewProjModal(true);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Nuevo Proyecto</span>
                        </button>

                        <button
                          onClick={() => openEditClient(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Editar Cliente"
                        >
                          <User className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteClient(c.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar Cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBSCRIPTION & DOMAIN */}
        {activeTab === 'subscription' && (
          <div className="max-w-4xl mx-auto w-full space-y-8">
            {/* Active Subscription Box */}
            <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Suscripción Unificada 100% Activa</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Plan Comercial: Salón + Depósito</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Una única suscripción permite el acceso irrestricto a ambas secciones (Salón Comercial y Depósito Industrial).
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-3xl font-extrabold text-white">$0</div>
                  <div className="text-xs text-emerald-400 font-semibold">Todo incluido para ambas secciones</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-200 border-t border-slate-800/80 pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Salón Comercial:</strong> Góndolas de pared y centrales, punteras, heladeras, check outs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Depósito Industrial:</strong> Racks pesados para pallets, miniracks, estanterías, portones</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Proyectos ilimitados tanto de locales comerciales como de depósitos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Visualizador 3D realista con límites físicos y anticolisión</span>
                </div>
              </div>
            </div>

            {/* Public Domain & Deployment Guide */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-400" />
                <span>Cómo subir la app a un dominio público personalizado</span>
              </h4>
              <p className="text-xs text-slate-400 mb-6">
                La aplicación ya se encuentra alojada en la nube y accesible desde cualquier navegador en la URL pública compartida. Para apuntar a tu propio dominio (ej: <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">racks.tuempresa.com</code>):
              </p>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">1. URL Pública Actual en AI Studio / Cloud Run:</strong>
                  <p className="text-slate-400 mb-2">
                    Tu app ya tiene un dominio público SSL generado automáticamente:
                  </p>
                  <a 
                    href="https://ais-pre-fke5jrni75olizcd7hjh44-418899072866.us-east1.run.app" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-400 hover:underline font-mono text-xs break-all"
                  >
                    https://ais-pre-fke5jrni75olizcd7hjh44-418899072866.us-east1.run.app
                  </a>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">2. Dominio propio mediante Firebase Hosting o Cloud DNS:</strong>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Ingresa a la consola de Firebase en tu proyecto.</li>
                    <li>Ve a <strong>Hosting &rarr; Conectar dominio personalizado</strong>.</li>
                    <li>Ingresa tu dominio (ej: <code className="text-white">configurador.tuempresa.com</code>).</li>
                    <li>Copia los registros DNS (tipo A o CNAME) y pégalos en tu proveedor de dominio (GoDaddy, Cloudflare, DonWeb, etc.).</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Información del Usuario</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Nombre de Usuario</span>
                <span className="font-semibold text-white">{profile?.displayName || 'Usuario Industrial'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Email Registrado</span>
                <span className="font-mono text-xs text-white">{profile?.email || user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">ID de Usuario (Firebase UID)</span>
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px]">{user?.uid}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <span className="text-slate-400">Tipo de Suscripción</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Plan Gratuito Activo
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={signOut}
                className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nuevo Proyecto */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewProjModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Crear Nuevo Proyecto 3D</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              {/* Selector de Sección */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Selecciona la Sección a Diseñar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setNewProjSection('salon')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      newProjSection === 'salon'
                        ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-400/50 shadow-md'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Store className="w-4 h-4 text-rose-400" />
                      <strong className="text-xs text-white">Salón Comercial</strong>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Góndolas pared/centrales, punteras, heladeras, check outs y puertas.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewProjSection('deposito')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      newProjSection === 'deposito'
                        ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-400/50 shadow-md'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <strong className="text-xs text-white">Depósito Industrial</strong>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Racks pesados pallets, miniracks, estanterías y portones.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  required
                  placeholder={newProjSection === 'salon' ? 'Ej: Supermercado Sucursal Centro' : 'Ej: Nave Logística Almacén 1'}
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Asignar a Cliente (Opcional)</label>
                <select
                  value={newProjClientId}
                  onChange={(e) => setNewProjClientId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Sin Cliente Asignado --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProj}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCreatingProj ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creando y Abriendo 3D...</span>
                    </>
                  ) : (
                    <span>Crear y Diseñar en 3D</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo / Editar Cliente */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowNewClientModal(false);
                setEditingClient(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
            </h3>

            <form onSubmit={handleSaveClientSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre o Contacto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Empresa / Razón Social</label>
                  <input
                    type="text"
                    placeholder="Ej: Distribuidora Mayorista SA"
                    value={clientForm.company}
                    onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+54 9 11 1234-5678"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Dirección de Obra / Depósito</label>
                <input
                  type="text"
                  placeholder="Av. Industrial 4500, Parque Industrial"
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas o Requisitos Especiales</label>
                <textarea
                  rows={2}
                  placeholder="Capacidades requeridas, tipo de piso, horarios de entrega..."
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewClientModal(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                >
                  {editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
