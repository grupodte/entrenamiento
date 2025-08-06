import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import FloatingNavBar from '../components/FloatingNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';
import { useViewportHeight } from '../hooks/useViewportHeight';

// Variantes de animación optimizadas
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
  }
};

const AlumnoLayout = () => {
  const location = useLocation();
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);

  useViewportHeight();

  // Handlers memorizados
  const handleOpenPerfil = useCallback(() => setIsPerfilDrawerOpen(true), []);
  const handleClosePerfil = useCallback(() => setIsPerfilDrawerOpen(false), []);

  const handleOpenEditPerfil = useCallback(() => {
    setIsPerfilDrawerOpen(false);
    setIsEditPerfilDrawerOpen(true);
  }, []);

  const handleCloseEditPerfil = useCallback(() => setIsEditPerfilDrawerOpen(false), []);

  const handleBackToProfile = useCallback(() => {
    setIsEditPerfilDrawerOpen(false);
    setIsPerfilDrawerOpen(true);
  }, []);

  const handleProfileUpdate = useCallback(() => setIsEditPerfilDrawerOpen(false), []);

  return (
    <div className="app-container">
      {/* Contenido principal con scroll sin barra visible */}
      <motion.main
        key={location.pathname}
        className="main-content scroll-smooth-hidden"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="content-wrapper">
          <Outlet />
        </div>
      </motion.main>

      {/* Navegación flotante */}
      <FloatingNavBar onOpenPerfil={handleOpenPerfil} />

      {/* Drawers */}
      <PerfilDrawer
        isOpen={isPerfilDrawerOpen}
        onClose={handleClosePerfil}
        onEdit={handleOpenEditPerfil}
      />
      <EditarPerfilDrawer
        isOpen={isEditPerfilDrawerOpen}
        onClose={handleCloseEditPerfil}
        onBack={handleBackToProfile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default AlumnoLayout;
