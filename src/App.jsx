// src/App.jsx

import { useEffect, useState } from 'react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// 1. Importa el nuevo Layout que manejará el pull-to-refresh
import AppLayout from './components/AppLayout';

// Importa tus páginas y componentes
import RutinaDetalle from './pages/RutinaDetalle';
import EditarRutinaPersonalizada from './pages/EditarRutinaPersonalizada';
import Home from './pages/Home';
import Login from './components/LoginForm';
import DashboardAlumno from './pages/Dashboard';
import AdminPanel from './pages/Admin/AdminPanel';
import AlumnoPerfil from './pages/Admin/AlumnoPerfil';
import RutaProtegida from './components/RutaProtegida';
import RedireccionInicial from './pages/RedireccionInicial';
import CrearRutina from './pages/Admin/CrearRutina';
import SeleccionarEjercicios from './pages/Admin/SeleccionarEjercicios';
import AdminRutinas from './pages/Admin/AdminRutinas';
import AdminAlumnos from './pages/Admin/AdminAlumnos';
import AdminEjercicios from './pages/Admin/AdminEjercicios';
import AsignarRutina from './pages/Admin/AsignarRutina';
import EditarDia from './pages/Admin/EditarDia';

// Componente para el banner de instalación de la PWA
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
        {/* Se elimina la etiqueta <main> para que el Layout controle toda la pantalla */}
        <Routes>
          {/* 2. Rutas que NO tendrán pull-to-refresh se quedan fuera */}
          <Route path="/" element={<RedireccionInicial />} />
          <Route path="/login" element={<Login />} />

          {/* 3. Grupo de rutas que SÍ tendrán pull-to-refresh, envueltas en AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/rutina/:id" element={<RutinaDetalle />} />

            <Route
              path="/dashboard"
              element={
                <RutaProtegida rolPermitido="alumno">
                  <DashboardAlumno />
                </RutaProtegida>
              }
            />

            <Route
              path="/admin"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AdminPanel />
                </RutaProtegida>
              }
            />

            <Route
              path="/alumno/:id"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AlumnoPerfil />
                </RutaProtegida>
              }
            />

            <Route
              path="/editar-rutina/:id"
              element={
                <RutaProtegida rolPermitido="admin">
                  <EditarRutinaPersonalizada />
                </RutaProtegida>
              }
            />

            <Route path="/crear-rutina" element={
              <RutaProtegida rolPermitido="admin">
                <CrearRutina />
              </RutaProtegida>
            } />

            <Route
              path="/seleccionar-ejercicios"
              element={
                <RutaProtegida rolPermitido="admin">
                  <SeleccionarEjercicios />
                </RutaProtegida>
              }
            />

            <Route path="/admin/rutinas" element={<RutaProtegida rolPermitido="admin"><AdminRutinas /></RutaProtegida>} />
            <Route path="/admin/alumnos" element={<RutaProtegida rolPermitido="admin"><AdminAlumnos /></RutaProtegida>} />
            <Route path="/admin/ejercicios" element={<RutaProtegida rolPermitido="admin"><AdminEjercicios /></RutaProtegida>} />
            <Route path="/asignar-rutina/:id" element={<AsignarRutina />} />
            <Route path="/editar-rutina-dia/:id" element={<EditarDia />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;