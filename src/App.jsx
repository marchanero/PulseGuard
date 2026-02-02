import { useState, useEffect } from 'react';
import ServiceList from './components/ServiceList';
import ServiceListView from './components/ServiceListView';
import ServiceForm from './components/ServiceForm';
import ServiceFilters from './components/ServiceFilters';
import ServiceDrawer from './components/ServiceDrawer';
import OnboardingGuide from './components/OnboardingGuide';
import DashboardStats from './components/DashboardStats';
import Header from './components/Header';
import Footer from './components/Footer';
import { Login } from './components/Login.jsx';
import { StatusPage } from './components/StatusPage.jsx';
import { useAuth } from './hooks/useAuth.js';
import EmptyState from './components/EmptyState';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import CommandPalette from './components/CommandPalette';
import { Card, DashboardStatsSkeleton, ServiceListSkeleton } from './components/ui';
import { useToast } from './hooks/useToast';
import { useConfirm } from './hooks/useConfirm';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useCompactMode } from './hooks/useCompactMode';
import { useTheme } from './context/theme';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedService, setSelectedService] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('serviceMonitor_onboardingSeen') === null;
  });
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();
  const { confirm } = useConfirm();
  const { isCompact, toggleCompact } = useCompactMode();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Detectar si estamos en la página de status
  const isStatusPage = window.location.pathname === '/status';

  useEffect(() => {
    fetchServices();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', ctrl: true, handler: () => setShowForm(true) },
    { key: 'k', ctrl: true, handler: () => setShowCommandPalette(true) },
    { key: '/', handler: () => {
      setShowFilters(true);
      setTimeout(() => {
        const searchInput = document.querySelector('input[type="text"]');
        searchInput?.focus();
      }, 100);
    }},
    { key: 'escape', handler: () => {
      setShowForm(false);
      setIsDrawerOpen(false);
      setShowCommandPalette(false);
      setShowShortcutsHelp(false);
    }},
    { key: 'g', handler: () => setViewMode(prev => prev === 'grid' ? 'list' : 'grid') },
    { key: 'f', handler: () => setShowFilters(prev => !prev) },
    { key: 'r', handler: () => fetchServices() },
    { key: 'c', handler: () => toggleCompact() },
    { key: '?', handler: () => setShowShortcutsHelp(true) },
  ]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/services`, {
        credentials: 'include'
      });
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (serviceData) => {
    try {
      console.log('Enviando datos:', serviceData);
      const response = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(serviceData)
      });
      
      const data = await response.json();
      console.log('Respuesta:', data);
      
      if (response.ok) {
        fetchServices();
        setShowForm(false);
        toast.success(`Servicio "${serviceData.name}" añadido correctamente`);
      } else {
        console.error('Error del servidor:', data);
        toast.error(data.error || 'Error al añadir el servicio');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Error al añadir el servicio');
    }
  };

  const handleDeleteService = async (id, serviceName) => {
    const confirmed = await confirm({
      title: 'Eliminar servicio',
      message: `¿Estás seguro de que quieres eliminar "${serviceName}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchServices();
        toast.success('Servicio eliminado correctamente');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  const handleCheckService = async (id) => {
    try {
      const response = await fetch(`${API_URL}/services/${id}/check`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchServices();
        toast.info('Verificación completada');
      }
    } catch (error) {
      console.error('Error checking service:', error);
      toast.error('Error al verificar el servicio');
    }
  };

  const handleCheckAll = async () => {
    try {
      const response = await fetch(`${API_URL}/services/check-all`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchServices();
        toast.info('Verificación de todos los servicios completada');
      }
    } catch (error) {
      console.error('Error checking all services:', error);
      toast.error('Error al verificar los servicios');
    }
  };

  const handleSelectServiceFromPalette = (service) => {
    setSelectedService(service);
    setIsDrawerOpen(true);
  };

  // Mostrar página de status pública
  if (isStatusPage) {
    return <StatusPage />;
  }

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col ${isCompact ? 'compact-mode' : ''}`}>
      <Header
        onAddClick={() => setShowForm(!showForm)}
        onCheckAll={handleCheckAll}
        servicesCount={services.length}
        isCompact={isCompact}
        onToggleCompact={toggleCompact}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />

      <main className={`flex-1 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 ${isCompact ? 'py-4' : 'py-8'} w-full`}>
        {loading ? (
          <div className="space-y-8 animate-fade-in">
            <DashboardStatsSkeleton />
            <ServiceListSkeleton count={6} />
          </div>
        ) : (
          <div className={isCompact ? 'space-y-4' : 'space-y-8'}>
            {/* Dashboard Stats */}
            {services.length > 0 && (
              <DashboardStats services={services} isCompact={isCompact} />
            )}

            {/* Add Service Form */}
            {showForm && (
              <Card className="animate-slide-up">
                <ServiceForm 
                  onSubmit={handleAddService} 
                  onCancel={() => setShowForm(false)}
                />
              </Card>
            )}

            {/* Services List */}
            {services.length === 0 ? (
              <EmptyState onAddClick={() => setShowForm(true)} />
            ) : (
              <div>
                {/* Filters */}
                <ServiceFilters
                  services={services}
                  onFilterChange={setFilteredServices}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  isOpen={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
                  isCompact={isCompact}
                />

                {/* Services Display */}
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-gray-400">
                      No se encontraron servicios que coincidan con los filtros
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <ServiceList
                    services={filteredServices}
                    onDelete={handleDeleteService}
                    onCheck={handleCheckService}
                    onViewDetails={(service) => {
                      setSelectedService(service);
                      setIsDrawerOpen(true);
                    }}
                    isCompact={isCompact}
                  />
                ) : (
                  <ServiceListView
                    services={filteredServices}
                    onDelete={handleDeleteService}
                    onCheck={handleCheckService}
                    isCompact={isCompact}
                  />
                )}

                {/* Service Drawer */}
                <ServiceDrawer
                  service={selectedService}
                  isOpen={isDrawerOpen}
                  onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedService(null);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer - Fixed at bottom */}
      <div className="mt-auto">
        <Footer />
      </div>

      {/* Onboarding Guide */}
      <OnboardingGuide
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        servicesCount={services.length}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        services={services}
        onSelectService={handleSelectServiceFromPalette}
        onAddService={() => setShowForm(true)}
        onToggleView={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={fetchServices}
        viewMode={viewMode}
        showFilters={showFilters}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;
