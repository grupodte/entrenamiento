import React, { useState, useCallback, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingNavBar from '../components/FloatingNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';
import { useViewportHeight } from '../hooks/useViewportHeight';

// Variantes de animación optimizadas
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.23, 1, 0.32, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const AlumnoLayout = () => {
  const location = useLocation();
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);

  // Hook para altura dinámica de viewport
  useViewportHeight();

  // Handlers memorizados
  const handleOpenPerfil = useCallback(() => {
    setIsPerfilDrawerOpen(true);
  }, []);

  const handleClosePerfil = useCallback(() => {
    setIsPerfilDrawerOpen(false);
  }, []);

  const handleOpenEditPerfil = useCallback(() => {
    setIsPerfilDrawerOpen(false);
    setIsEditPerfilDrawerOpen(true);
  }, []);

  const handleCloseEditPerfil = useCallback(() => {
    setIsEditPerfilDrawerOpen(false);
  }, []);

  const handleBackToProfile = useCallback(() => {
    setIsEditPerfilDrawerOpen(false);
    setIsPerfilDrawerOpen(true);
  }, []);

  const handleProfileUpdate = useCallback(() => {
    setIsEditPerfilDrawerOpen(false);
  }, []);


  return (
    // 1. El contenedor principal ahora es más simple y actúa como referencia
    <div className="fullscreen">

      {/* 2. El contenido principal ocupa el espacio restante y maneja el scroll */}
      <motion.main
        key={location.pathname}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Padding superior para la safe area y padding inferior para dejar espacio a la navbar */}
        <div className="pt-safe pb-24 px-4 sm:px-6">
          <Outlet />
        </div>
      </motion.main>

      {/* 3. La navbar se posiciona de forma absoluta sobre el contenido */}
      <div className="relative z-20">
        <FloatingNavBar onOpenPerfil={handleOpenPerfil} />
      </div>

      {/* Los drawers manejan su propia posición, por lo que no cambian */}
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