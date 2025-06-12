import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- LAYOUT Y COMPONENTES GLOBALES ---
import AppLayout from './components/AppLayout';
import RutaProtegida from './components/RutaProtegida';
import RedireccionInicial from './pages/RedireccionInicial';

// --- PÁGINAS PÚBLICAS ---
import AuthPage from './pages/AuthPage';
import Tyc from './pages/tyc'
import PoliticaPrivacidad from './pages/PoliticaPrivacidad';

// --- PÁGINAS DE ALUMNO ---
import DashboardAlumno from './pages/Alumno/Dashboard';
import DashboardRutinas from './pages/Alumno/DashboardRutinas';
import RutinaDetalle from './pages/Alumno/RutinaDetalle';

// --- PÁGINAS DE ADMIN ---
import AdminPanel from './pages/Admin/AdminPanel';
import AlumnoPerfil from './pages/Admin/AlumnoPerfil';
import CrearRutina from './pages/Admin/CrearRutina';
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
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg px-4 py-2 rounded-xl z-50 flex items-center gap-4 border">
      <span className="text-black dark:text-white">¿Querés instalar la app?</span>
      <button
        onClick={handleInstallClick}
        className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Instalar
      </button>
    </div>
  );
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <InstallBanner />
        <Routes>
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/" element={<RedireccionInicial />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} /> // opcional, redirecciona al mismo
          <Route path="/tyc" element={<Tyc />} />
          <Route path="/privacidad" element={<PoliticaPrivacidad />} />



          {/* --- RUTAS PROTEGIDAS CON LAYOUT GENERAL --- */}
          <Route element={<AppLayout />}>

            {/* --- RUTAS DE ALUMNO --- */}
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

            {/* --- RUTAS DE ADMIN --- */}
            <Route
              path="/admin"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AdminPanel />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/alumnos"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AdminAlumnos />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/alumnos/:id"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AlumnoPerfil />
                </RutaProtegida>
              }
            />
            {/* RUTA ALTERNATIVA /alumno/:id si aún se usa en algún lugar */}
            <Route
              path="/admin/alumno/:id"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AlumnoPerfil />
                </RutaProtegida>
              }
            />

            <Route
              path="/admin/rutinas"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AdminRutinas />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/rutinas/crear"
              element={
                <RutaProtegida rolPermitido="admin">
                  <CrearRutina />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/rutinas/editar-dia/:id"
              element={
                <RutaProtegida rolPermitido="admin">
                  <EditarDia />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/ejercicios"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AdminEjercicios />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/ejercicios/seleccionar"
              element={
                <RutaProtegida rolPermitido="admin">
                  <SeleccionarEjercicios />
                </RutaProtegida>
              }
            />
            <Route
              path="/admin/asignar-rutina/:id"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AsignarRutina />
                </RutaProtegida>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
