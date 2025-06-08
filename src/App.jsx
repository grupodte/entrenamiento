import { useEffect, useState } from 'react';
import RutinaDetalle from './pages/RutinaDetalle';


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

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/LoginForm';
import DashboardAlumno from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import AlumnoPerfil from './pages/AlumnoPerfil';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <InstallBanner />
        <main className="pt-20 px-4">
          <Routes>
            <Route path="/rutina/:id" element={<RutinaDetalle />} />

            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Solo alumnos pueden ver su dashboard */}
            <Route
              path="/dashboard"
              element={
                <RutaProtegida rolPermitido="alumno">
                  <DashboardAlumno />
                </RutaProtegida>
              }
            />

            {/* Solo entrenadores pueden ver su panel */}
            <Route
              path="/admin"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AdminPanel />
                </RutaProtegida>
              }
            />

            {/* Perfil individual de alumno visible solo para entrenador */}
            <Route
              path="/alumno/:id"
              element={
                <RutaProtegida rolPermitido="admin">
                  <AlumnoPerfil />
                </RutaProtegida>
              }
            />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
};

export default App;
