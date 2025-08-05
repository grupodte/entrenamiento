import React, { useState, useCallback, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingNavBar from '../components/FloatingNavBar'; // Cambiado a FloatingNavBar
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';
import { useViewportHeight } from '../hooks/useViewportHeight';

// Optimización: Variantes memorizadas
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
      ease: [0.23, 1, 0.32, 1] // easeOutQuart
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

  // Hook global para altura dinámica
  useViewportHeight();

  // Optimización: Handlers memorizados
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

  // Optimización: Estilos memorizados
  const backgroundStyles = useMemo(() => ({
    height: 'var(--vh)',
    backgroundImage: `url('/assets/FOTO_FONDO.webp')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed' // Mejora el rendimiento en móviles
  }), []);

  const overlayStyles = useMemo(() => ({
    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%)',
    WebkitBackdropFilter: 'blur(2px) saturate(120%)',
    backdropFilter: 'blur(2px) saturate(120%)'
  }), []);

  return (
    <div
      className="text-white font-sans flex flex-col relative will-change-transform"
      style={backgroundStyles}
    >
      {/* Overlay oscuro optimizado */}
      <div
        className="absolute inset-0 pointer-events-none will-change-[backdrop-filter]"
        style={overlayStyles}
      />

      {/* Contenido principal optimizado - SIN padding bottom ya que el navbar flota */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className="
            relative z-10 flex-1 
            overflow-y-auto 
            pt-5
            pb-10       /* Espacio para el navbar flotante */
            px-4 sm:px-6 lg:px-8 
            overscroll-y-contain 
            scrollbar-hide
            will-change-transform
          "
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="pb-safe"> {/* Safe area solo para el contenido */}
            <Outlet />
          </div>
        </motion.main>
      </AnimatePresence>

      {/* Navbar flotante - sin clases de posicionamiento safe */}
      <FloatingNavBar onOpenPerfil={handleOpenPerfil} />

      {/* Drawers optimizados */}
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