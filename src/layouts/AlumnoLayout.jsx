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

  // Estilos optimizados para PWA
  const containerStyles = useMemo(() => ({
    height: '100dvh', // Altura dinámica del viewport (mejor para PWA)
    minHeight: '100dvh',
    backgroundImage: `url('/assets/FOTO_FONDO.webp')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  }), []);

  const overlayStyles = useMemo(() => ({
    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%)',
    WebkitBackdropFilter: 'blur(2px) saturate(120%)',
    backdropFilter: 'blur(2px) saturate(120%)'
  }), []);

  return (
    <div
      className="
        text-white font-sans 
        flex flex-col 
        relative 
        overflow-hidden
        will-change-transform
      "
      style={containerStyles}
    >
      {/* Overlay de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={overlayStyles}
      />

      {/* Contenido principal con safe areas */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className="
            relative z-10 
            flex-1 
            flex flex-col
            min-h-0
            pt-safe-top
            pb-safe-bottom
            overflow-hidden
            will-change-transform
          "
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Contenedor scrolleable sin barra visible */}
          <div
            className="
              flex-1 
              overflow-y-auto 
              overflow-x-hidden
              px-4 sm:px-6 lg:px-8
              py-5
              pb-[100px]
              overscroll-y-contain
              scroll-smooth
              [-webkit-overflow-scrolling:touch]
              [scrollbar-width:none]
              [-ms-overflow-style:none]
              [&::-webkit-scrollbar]:hidden
            "
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="min-h-full">
              <Outlet />
            </div>
          </div>
        </motion.main>
      </AnimatePresence>

      {/* Navbar flotante con safe area */}
      <div className="relative z-20">
        <FloatingNavBar onOpenPerfil={handleOpenPerfil} />
      </div>

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