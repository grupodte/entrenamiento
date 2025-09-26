import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// --- IMPORTACIONES INMEDIATAS (CRÍTICAS) ---
import RutaProtegida from './components/RutaProtegida';
import useSmoothScroll from './hooks/useSmoothScroll';
import useScrollToTop from './hooks/useScrollToTop';
import useSimpleSwipeBackPrevention from './hooks/useSimpleSwipeBackPrevention';
import { useLocation } from 'react-router-dom';
import { WidgetGuideProvider } from './context/WidgetGuideContext';

// --- LAZY LOADING DE COMPONENTES GRANDES ---
// Layouts
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout'));
const AlumnoLayout = React.lazy(() => import('./layouts/AlumnoLayout'));

// Widget Guide
const WidgetGuideOverlay = React.lazy(() => import('./components/WidgetGuide/WidgetGuideOverlay'));


// Páginas públicas
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const CatalogoCursos = React.lazy(() => import('./pages/CatalogoCursos'));
const VisualizarCurso = React.lazy(() => import('./pages/VisualizarCurso'));
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const Tyc = React.lazy(() => import('./pages/tyc'));
const PoliticaPrivacidad = React.lazy(() => import('./pages/PoliticaPrivacidad'));
const InstalarApp = React.lazy(() => import('./pages/InstalarApp'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const SpotifyCallback = React.lazy(() => import('./pages/SpotifyCallback'));

// Páginas de alumno
const DashboardAlumno = React.lazy(() => import('./pages/Alumno/Dashboard'));
const RutinaDetalle = React.lazy(() => import('./pages/Alumno/RutinaDetalle'));
const MisCursos = React.lazy(() => import('./pages/Alumno/MisCursos'));
const DietasAlumno = React.lazy(() => import('./pages/Alumno/DietasAlumno'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const NotificationSettings = React.lazy(() => import('./pages/NotificationSettings'));

// Páginas de admin
const AdminPanel = React.lazy(() => import('./pages/Admin/AdminPanel'));
const AlumnoPerfil = React.lazy(() => import('./pages/Admin/AlumnoPerfil'));
const CrearRutina = React.lazy(() => import('./pages/Admin/CrearRutina'));
const EditarRutina = React.lazy(() => import('./pages/Admin/EditarRutina'));
const DuplicarRutina = React.lazy(() => import('./pages/Admin/DuplicarRutina'));
const VerRutina = React.lazy(() => import('./pages/Admin/VerRutina'));
const SeleccionarEjercicios = React.lazy(() => import('./pages/Admin/SeleccionarEjercicios'));
const AdminRutinas = React.lazy(() => import('./pages/Admin/AdminRutinas'));
const AdminAlumnos = React.lazy(() => import('./pages/Admin/AdminAlumnos'));
const AdminEjercicios = React.lazy(() => import('./pages/Admin/AdminEjercicios'));
const AsignarRutina = React.lazy(() => import('./pages/Admin/AsignarRutina'));
const EditarDia = React.lazy(() => import('./pages/Admin/EditarDia'));
const CrearRutinaReal = React.lazy(() => import('./pages/Admin/CrearRutinaReal'));
const AdminRutinasReales = React.lazy(() => import('./pages/Admin/AdminRutinasReales'));
const VerRutinaReal = React.lazy(() => import('./pages/Admin/VerRutinaReal'));
const EditarRutinaReal = React.lazy(() => import('./pages/Admin/EditarRutinaReal'));
const CursosManager = React.lazy(() => import('./pages/Admin/CursosManager'));
const CrearCurso = React.lazy(() => import('./pages/Admin/CrearCurso'));
const AsignarCurso = React.lazy(() => import('./pages/Admin/AsignarCurso'));
const AdminGrupos = React.lazy(() => import('./pages/Admin/AdminGrupos'));
const GrupoDetalleAdmin = React.lazy(() => import('./pages/Admin/GrupoDetalleAdmin'));
const AdminDietas = React.lazy(() => import('./pages/Admin/AdminDietas'));

// Componente simplificado para páginas públicas
const PublicLayout = () => (
  <div className="h-screen overflow-hidden">
    <Outlet />
  </div>
);

const AppContent = () => {
  useSmoothScroll();
  useScrollToTop(); // Hook para resetear scroll al cambiar de página
  const { user, rol } = useAuth();
  const location = useLocation();
  
  // Prevención simple y no intrusiva de swipe back
  useSimpleSwipeBackPrevention(true);

  return (
    <WidgetGuideProvider>
      <Suspense fallback={<div></div>}>
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
        <Route path="/mis-dietas" element={<DietasAlumno />} />
        <Route path="/notificaciones" element={<NotificationSettings />} />
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
        <Route path="grupos" element={<AdminGrupos />} />
        <Route path="grupos/:grupoId" element={<GrupoDetalleAdmin />} />
        <Route path="rutinas" element={<AdminRutinas />} />
        <Route path="rutinas/crear" element={<CrearRutina />} />
        <Route path="rutinas/rutina" element={<CrearRutinaReal />} />
        <Route path="rutinas/editar/:id" element={<EditarRutina />} />
        <Route path="rutinas/duplicar/:id" element={<DuplicarRutina />} />
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
        <Route path="dietas" element={<AdminDietas />} />
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
      </Suspense>
      
      {/* Componentes de Widget Guide */}
      <Suspense fallback={<div></div>}>
        <WidgetGuideOverlay />
      </Suspense>
      
    </WidgetGuideProvider>
  );
};

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div></div>;
  }

  return <AppContent />;
};

export default App;
