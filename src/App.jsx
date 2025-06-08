// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/LoginForm';
import DashboardAlumno from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import AlumnoPerfil from './pages/AlumnoPerfil';
import { AuthProvider, useAuth } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';

const RedireccionPostLogin = () => {
  const { user, rol } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Si el usuario viene de /login y ya está autenticado, redireccionamos según su rol
    if (user && location.pathname === '/login') {
      if (rol === 'admin') {
        navigate('/admin', { replace: true });
      } else if (rol === 'alumno') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, rol, location, navigate]);

  return null;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <main className="pt-20 px-4">
          <RedireccionPostLogin />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

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
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
};

export default App;
