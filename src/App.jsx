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
        <main className="pt-20 px-4">
          <Routes>
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
