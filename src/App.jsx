import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SpotifyCallback from './pages/SpotifyCallback';
// Debug utils
import { diagnosticarTiposEjecucion } from './utils/diagnosticoTiposEjecucion';

// --- LAYOUT Y COMPONENTES GLOBALES ---
import AdminLayout from './layouts/AdminLayout';
import RutaProtegida from './components/RutaProtegida';
import useSmoothScroll from './hooks/useSmoothScroll';
import usePreventSwipeBack from './hooks/usePreventSwipeBack';
import usePWANavigation from './hooks/usePWANavigation';
import AlumnoLayout from './layouts/AlumnoLayout';
import BrandedLoader from './components/BrandedLoader';

// --- WIDGET GUIDE ---
import { WidgetGuideProvider } from './context/WidgetGuideContext';
import WidgetGuideOverlay from './components/WidgetGuide/WidgetGuideOverlay';

// --- PÁGINAS PÚBLICAS ---
import LandingPage from './pages/LandingPage';
import CatalogoCursos from './pages/CatalogoCursos';
import VisualizarCurso from './pages/VisualizarCurso';
import AuthPage from './pages/AuthPage';
import Tyc from './pages/tyc';
import PoliticaPrivacidad from './pages/PoliticaPrivacidad';
import InstalarApp from './pages/InstalarApp';
import NotFound from './pages/NotFound';

// --- PÁGINAS DE ALUMNO ---
import DashboardAlumno from './pages/Alumno/Dashboard';
import RutinaDetalle from './pages/Alumno/RutinaDetalle';
import MisCursos from './pages/Alumno/MisCursos';
import Onboarding from './pages/Onboarding';

// --- PÁGINAS DE ADMIN ---
import AdminPanel from './pages/Admin/AdminPanel';
import AlumnoPerfil from './pages/Admin/AlumnoPerfil';
import CrearRutina from './pages/Admin/CrearRutina';
import EditarRutina from './pages/Admin/EditarRutina';
import VerRutina from './pages/Admin/VerRutina';
import SeleccionarEjercicios from './pages/Admin/SeleccionarEjercicios';
import AdminRutinas from './pages/Admin/AdminRutinas';
import AdminAlumnos from './pages/Admin/AdminAlumnos';
import AdminEjercicios from './pages/Admin/AdminEjercicios';
import AsignarRutina from './pages/Admin/AsignarRutina';
import EditarDia from './pages/Admin/EditarDia';
import CrearRutinaReal from './pages/Admin/CrearRutinaReal';
import AdminRutinasReales from './pages/Admin/AdminRutinasReales';
import VerRutinaReal from './pages/Admin/VerRutinaReal';
import EditarRutinaReal from './pages/Admin/EditarRutinaReal';
import CursosManager from './pages/Admin/CursosManager';
import CrearCurso from './pages/Admin/CrearCurso';
import AsignarCurso from './pages/Admin/AsignarCurso';

// Componente simplificado para páginas públicas
const PublicLayout = () => (
  <div className="h-screen overflow-hidden">
    <Outlet />
  </div>
);

const AppContent = () => {
  useSmoothScroll();
  const { user, rol, loading } = useAuth();

  return (
    <WidgetGuideProvider>
      <Routes>
      {/* --- RUTA DE ONBOARDING --- */}
      <Route 
        path="/onboarding" 
        element={
          <RutaProtegida rolPermitido="alumno" allowOnboarding={true}>
            <Onboarding />
          </RutaProtegida>
        } 
      />

      {/* --- RUTAS DE ALUMNO CON AlumnoLayout --- */}
      <Route
        element={
          <RutaProtegida rolPermitido="alumno">
            <AlumnoLayout />
          </RutaProtegida>
        }
      >
        <Route path="/dashboard" element={<DashboardAlumno />} />
        <Route path="/rutina/:id" element={<RutinaDetalle />} />
        <Route path="/mis-cursos" element={<MisCursos />} />
        <Route path="/curso/:cursoId" element={<VisualizarCurso />} />
      </Route>

      {/* --- RUTAS DE ADMIN CON AdminLayout --- */}
      <Route
        path="/admin"
        element={
          <RutaProtegida rolPermitido="admin">
            <AdminLayout />
          </RutaProtegida>
        }
      >
        <Route index element={<AdminPanel />} />
        <Route path="alumnos" element={<AdminAlumnos />} />
        <Route path="alumno/:id" element={<AlumnoPerfil />} />
        <Route path="rutinas" element={<AdminRutinas />} />
        <Route path="rutinas/crear" element={<CrearRutina />} />
        <Route path="rutinas/rutina" element={<CrearRutinaReal />} />
        <Route path="rutinas/editar/:id" element={<EditarRutina />} />
        <Route path="rutinas/ver/:id" element={<VerRutina />} />
        <Route path="rutinas-reales" element={<AdminRutinasReales />} />
        <Route path="rutinas-reales/ver/:id" element={<VerRutinaReal />} />
        <Route path="rutinas-reales/editar/:id" 
        element={<EditarRutinaReal />} />
        <Route path="rutinas/editar-dia/:id" element={<EditarDia />} />
        <Route path="ejercicios" element={<AdminEjercicios />} />
        <Route path="ejercicios/seleccionar" element={<SeleccionarEjercicios />} />
        <Route path="asignar-rutina/:id" element={<AsignarRutina />} />
        <Route path="cursos" element={<CursosManager />} />
        <Route path="cursos/crear" element={<CrearCurso />} />
        <Route path="cursos/editar/:cursoId" element={<CrearCurso />} />
        <Route path="cursos/asignar/:cursoId" element={<AsignarCurso />} />
      </Route>

      {/* --- RUTAS PÚBLICAS --- */}
      <Route element={<PublicLayout />}>
        <Route path="/cursos" element={<CatalogoCursos />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/instalar" element={<InstalarApp />} />
        <Route path="/tyc" element={<Tyc />} />
        <Route path="/privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/callback/spotify" element={<SpotifyCallback />} />
        
        {/* Ruta raíz */}
        <Route
          path="/"
          element={
            user ? (
              rol === 'admin' ?
                <Navigate to="/admin" replace /> :
                <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Ruta 404 - Catch all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    
    {/* Componentes de Widget Guide */}
    <WidgetGuideOverlay />
  </WidgetGuideProvider>
  );
};

const App = () => {
  const { loading } = useAuth();
  
  // Hacer disponible la función de diagnóstico globalmente
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.diagnosticarTiposEjecucion = diagnosticarTiposEjecucion;
    }
  }, []);
  
  // Sistema completo de prevención de navegación
  usePreventSwipeBack({
    enabled: true,
    edgeThreshold: 40, // Píxeles desde el borde
    swipeThreshold: 25, // Sensibilidad del swipe
    exceptions: ['.touch-interactive', '.allow-swipe-back'] // Elementos que permiten navegación
  });
  
  const { setPreventionActive } = usePWANavigation({
    preventBrowserBack: true,
    enableLogging: false, // Cambiar a true para debug
    onNavigationAttempt: (event, location) => {
      // Lógica personalizada para permitir/denegar navegación
      console.log('Navigation attempt detected on:', location.pathname);
      return false; // No permitir navegación hacia atrás
    }
  });
  
  // Activar prevención cuando la app esté lista
  React.useEffect(() => {
    if (!loading) {
      setPreventionActive(true);
    }
  }, [loading, setPreventionActive]);

  if (loading) {
    return <BrandedLoader />;
  }

  return <AppContent />;
};

export default App;
