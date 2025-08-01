import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// --- LAYOUT Y COMPONENTES GLOBALES ---
import AppLayout from './components/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import RutaProtegida from './components/RutaProtegida';
import RedireccionInicial from './pages/RedireccionInicial';

import AlumnoLayout from './layouts/AlumnoLayout';

// --- PÁGINAS PÚBLICAS ---
import AuthPage from './pages/AuthPage';
import Tyc from './pages/tyc';
import PoliticaPrivacidad from './pages/PoliticaPrivacidad';

// --- PÁGINAS DE ALUMNO ---
import DashboardAlumno from './pages/Alumno/Dashboard';

import RutinaDetalle from './pages/Alumno/RutinaDetalle';
import PerfilAlumno from './pages/Alumno/Perfil';
import EditarPerfilPage from './pages/Alumno/EditarPerfil';
import SeleccionOrdenBloques from './pages/Alumno/SeleccionOrdenBloques';

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
          <Route path="/dashboard" element={<DashboardAlumno />} />
          
          <Route path="/rutina/:id" element={<RutinaDetalle />} />
          <Route path="/rutina/:id/orden" element={<SeleccionOrdenBloques />} />
          <Route path="/alumno/perfil" element={<PerfilAlumno />} />
          <Route path="/alumno/editar-perfil" element={<EditarPerfilPage />} />
        </Route>

        {/* --- RUTAS PÚBLICAS --- */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<RedireccionInicial />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/tyc" element={<Tyc />} />
          <Route path="/privacidad" element={<PoliticaPrivacidad />} />
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
      </Routes>
    </AnimatePresence>
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
