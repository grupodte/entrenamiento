import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { AnimatedFeedback, useFeedback } from './components/animations';

// --- LAYOUT Y COMPONENTES GLOBALES ---
import AppLayout from './components/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import RutaProtegida from './components/RutaProtegida';
import PageTransition from './components/PageTransition';
import useSmoothScroll from './hooks/useSmoothScroll';
import AlumnoLayout from './layouts/AlumnoLayout';
import BrandedLoader from './components/BrandedLoader'; // Import BrandedLoader

// --- PÁGINAS PÚBLICAS ---
import AuthPage from './pages/AuthPage';
import Tyc from './pages/tyc';
import PoliticaPrivacidad from './pages/PoliticaPrivacidad';

// --- PÁGINAS DE ALUMNO ---
import DashboardAlumno from './pages/Alumno/Dashboard';
import RutinaDetalle from './pages/Alumno/RutinaDetalle';

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


const AppContent = () => {
  const location = useLocation();
  useSmoothScroll();
  const { user, rol, loading } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* --- RUTAS DE ALUMNO CON AlumnoLayout --- */}
        <Route
          element={
            <RutaProtegida rolPermitido="alumno">

              <AlumnoLayout />

            </RutaProtegida>
          }
        >


          <Route path="/dashboard" element={<PageTransition><DashboardAlumno /></PageTransition>} />
          <Route path="/rutina/:id" element={<PageTransition><RutinaDetalle /></PageTransition>} />
        </Route>

        {/* --- RUTAS PÚBLICAS --- */}
        <Route element={<AppLayout />}>
          <Route path="/login" element={<PageTransition><AuthPage /></PageTransition>} />
          <Route path="/register" element={<PageTransition><AuthPage /></PageTransition>} />
          <Route path="/tyc" element={<PageTransition><Tyc /></PageTransition>} />
          <Route path="/privacidad" element={<PageTransition><PoliticaPrivacidad /></PageTransition>} />
          <Route path="/" element={user ? (rol === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />) : <Navigate to="/login" replace />} />
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
          <Route index element={<PageTransition><AdminPanel /></PageTransition>} />
          <Route path="alumnos" element={<PageTransition><AdminAlumnos /></PageTransition>} />
          <Route path="alumno/:id" element={<PageTransition><AlumnoPerfil /></PageTransition>} />
          <Route path="rutinas" element={<PageTransition><AdminRutinas /></PageTransition>} />
          <Route path="rutinas/crear" element={<PageTransition><CrearRutina /></PageTransition>} />
          <Route path="rutinas/editar/:id" element={<PageTransition><EditarRutina /></PageTransition>} />
          <Route path="rutinas/ver/:id" element={<PageTransition><VerRutina /></PageTransition>} />
          <Route path="rutinas/editar-dia/:id" element={<PageTransition><EditarDia /></PageTransition>} />
          <Route path="ejercicios" element={<PageTransition><AdminEjercicios /></PageTransition>} />
          <Route path="ejercicios/seleccionar" element={<PageTransition><SeleccionarEjercicios /></PageTransition>} />
          <Route path="asignar-rutina/:id" element={<PageTransition><AsignarRutina /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return <BrandedLoader />;
  }

  return (
    <AppContent />
  );
};

export default App;
