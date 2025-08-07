import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import FloatingNavBar from '../components/FloatingNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';
import SwipeWidget from '../components/SwipeWidget';
import { useViewportHeight } from '../hooks/useViewportHeight';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

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
  const [isSwipeWidgetOpen, setIsSwipeWidgetOpen] = useState(false);

  useViewportHeight();

  // Configurar gestos de swipe
  const { containerRef, swipeProgress, isEdgeSwipe } = useSwipeGesture({
    onSwipeFromEdge: (distance) => {
      if (distance > 100) {
        setIsSwipeWidgetOpen(true);
      }
    },
    preventBrowserBack: true,
    edgeThreshold: 30,
    threshold: 50
  });

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

  const handleCloseSwipeWidget = useCallback(() => setIsSwipeWidgetOpen(false), []);

  return (
    <div className="app-container" ref={containerRef}>
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
          {/* Navegación flotante */}
          <FloatingNavBar onOpenPerfil={handleOpenPerfil} />

        </div>
      </motion.main>


      {/* Widget de swipe */}
      <SwipeWidget
        isOpen={isSwipeWidgetOpen}
        onClose={handleCloseSwipeWidget}
        swipeProgress={isEdgeSwipe ? swipeProgress : 0}
      />

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
