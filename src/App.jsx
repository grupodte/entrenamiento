import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// --- LAYOUT Y COMPONENTES GLOBALES ---
import AppLayout from './components/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import RutaProtegida from './components/RutaProtegida';
import RedireccionInicial from './pages/RedireccionInicial';

// --- PÁGINAS PÚBLICAS ---
import AuthPage from './pages/AuthPage';
import Tyc from './pages/tyc';
import PoliticaPrivacidad from './pages/PoliticaPrivacidad';

// --- PÁGINAS DE ALUMNO ---
import DashboardAlumno from './pages/Alumno/Dashboard';
import DashboardRutinas from './pages/Alumno/DashboardRutinas';
import RutinaDetalle from './pages/Alumno/RutinaDetalle';
import PerfilAlumno from './pages/Alumno/Perfil';
import SeleccionOrdenBloques from './pages/Alumno/SeleccionOrdenBloques'; // nuevo import

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

// --- COMPONENTE PWA ---
function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installation accepted');
        } else {
          console.log('PWA installation dismissed');
        }
        setDeferredPrompt(null);
        setShowInstallButton(false);
      });
    }
  };

  if (!showInstallButton) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] rounded-xl z-50 flex items-center gap-4 border">
      <span className="text-black dark:text-white">¿Querés instalar la app?</span>
      <button
        onClick={handleInstallClick}
        className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-150"
      >
        Instalar
      </button>
    </div>
  );
}

const AppContent = () => {
  const location = useLocation();

  return (
    <>
      <InstallBanner />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* --- RUTAS PÚBLICAS Y DE ALUMNO CON AppLayout --- */}
          <Route element={<AppLayout />}>
            {/* Rutas Públicas */}
            <Route path="/" element={<RedireccionInicial />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/tyc" element={<Tyc />} />
            <Route path="/privacidad" element={<PoliticaPrivacidad />} />

            {/* Rutas de Alumno */}
            <Route
              path="/dashboard"
              element={
                <RutaProtegida rolPermitido="alumno">
                  <DashboardAlumno />
                </RutaProtegida>
              }
            />
            <Route
              path="/dashboard/rutinas"
              element={
                <RutaProtegida rolPermitido="alumno">
                  <DashboardRutinas />
                </RutaProtegida>
              }
            />
            <Route
              path="/rutina/:id"
              element={
                <RutaProtegida rolPermitido="alumno">
                  <RutinaDetalle />
                </RutaProtegida>
              }
            />
            <Route
              path="/rutina/:id/orden"
              element={
                <RutaProtegida rolPermitido="alumno">
                  <SeleccionOrdenBloques />
                </RutaProtegida>
              }
            />
            <Route
              path="/alumno/perfil"
              element={
                <RutaProtegida rolPermitido="alumno">
                  <PerfilAlumno />
                </RutaProtegida>
              }
            />
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
            <Route path="alumnos/:id" element={<AlumnoPerfil />} />
            <Route path="alumno/:id" element={<AlumnoPerfil />} />
            <Route path="rutinas" element={<AdminRutinas />} />
            <Route path="rutinas/crear" element={<CrearRutina />} />
            <Route path="rutinas/editar/:id" element={<EditarRutina />} />
            <Route path="rutinas/ver/:id" element={<VerRutina />} />
            <Route path="rutinas/editar-dia/:id" element={<EditarDia />} />
            <Route path="ejercicios" element={<AdminEjercicios />} />
            <Route path="ejercicios/seleccionar" element={<SeleccionarEjercicios />} />
            <Route path="asignar-rutina/:id" element={<AsignarRutina />} />
          </Route>

          {/* Podrías agregar aquí un catch-all de 404 si querés */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </AnimatePresence>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
