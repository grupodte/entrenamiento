import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import FloatingNavBar from '../components/FloatingNavBar'; // Componente original funcional
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';
import SwipeWidget from '../components/SwipeWidget';
import GradualBlur from '../components/GradualBlur';
import { ProgressDockProvider, useProgressDock } from '../context/ProgressDockContext';
import { BackNavigationProvider, useBackNavigation } from '../context/BackNavigationContext';
import { useViewportHeight } from '../hooks/useViewportHeight';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useSwipeBackContext } from '../hooks/useSwipeBackContext';

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

// Componente interno que usa el contexto
const AlumnoLayoutContent = () => {
  const location = useLocation();
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);
  const [isSwipeWidgetOpen, setIsSwipeWidgetOpen] = useState(true);
  
  // Usar el contexto de ProgressDock y BackNavigation
  const { showProgressDock, toggleProgressDock, progressGlobal } = useProgressDock();
  const { onBackClick } = useBackNavigation();

  useViewportHeight();


  // Handlers memorizados - definir ANTES de los hooks que los usan
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
  const handleOpenSwipeWidget = useCallback(() => setIsSwipeWidgetOpen(prev => !prev), []);

  // Configurar gestos de swipe simplificados
  const { containerRef, swipeProgress, closeProgress, isEdgeSwipe } = useSwipeGesture({
    onSwipeFromEdge: (distance) => {
      console.log('AlumnoLayout: onSwipeFromEdge called with distance:', distance);
      if (distance > 30) {
        console.log('AlumnoLayout: Opening SwipeWidget from edge');
        setIsSwipeWidgetOpen(true);
      }
    },
    onSwipeToClose: (distance) => {
      if (distance > 40) {
        console.log('AlumnoLayout: Closing SwipeWidget');
        setIsSwipeWidgetOpen(false);
      }
    },
    edgeThreshold: 50,
    threshold: 20,
    isWidgetOpen: isSwipeWidgetOpen
  });

  // Configurar contexto de swipe back
  const { currentContext } = useSwipeBackContext({
    isDrawerOpen: isPerfilDrawerOpen || isEditPerfilDrawerOpen,
    isWidgetOpen: isSwipeWidgetOpen,
    onDrawerClose: () => {
      if (isEditPerfilDrawerOpen) handleCloseEditPerfil();
      else if (isPerfilDrawerOpen) handleClosePerfil();
    },
    onWidgetClose: handleCloseSwipeWidget,
    preventGlobalSwipeBack: true,
    swipeThreshold: 80
  });

  return (
    <div className="min-h-screen flex flex-col overflow-clip" ref={containerRef}>
      {/* GradualBlur fijo a nivel página */}
      <GradualBlur
        target="page"
        position="top"
        height="6rem"
        strength={2}
        divCount={5}
        curve="bezier"
        opacity={1}
        exponential={true}
        className="pointer-events-none"
        zIndex={30}
      />
      <GradualBlur
        target="page"
        position="bottom"
        height="3rem"
        strength={1}
        divCount={5}
        curve="bezier"
        opacity={1}
        exponential={true}
        className="pointer-events-none"
        zIndex={30}
      />

      {/* Contenido principal con scroll */}
      <motion.main
        key={location.pathname}
        className="flex-1 overflow-y-auto scrollbar-hide"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="content-wrapper" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
          <Outlet />

          {/* Navegación flotante original funcional */}
          <FloatingNavBar 
            onOpenPerfil={handleOpenPerfil}
            isPerfilOpen={isPerfilDrawerOpen}
            showProgressDock={showProgressDock}
            onToggleProgressDock={toggleProgressDock}
            progressGlobal={progressGlobal}
            onBackClick={onBackClick}
            onOpenSwipeWidget={handleOpenSwipeWidget}
            isSwipeWidgetOpen={isSwipeWidgetOpen}
          />
        </div>
      </motion.main>


      {/* Widget de swipe */}
      <SwipeWidget
        isOpen={isSwipeWidgetOpen}
        onClose={handleCloseSwipeWidget}
        swipeProgress={isEdgeSwipe ? swipeProgress : 0}
        closeProgress={closeProgress}
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

// Componente principal con Provider
const AlumnoLayout = () => {
  return (
    <ProgressDockProvider>
      <BackNavigationProvider>
        <AlumnoLayoutContent />
      </BackNavigationProvider>
    </ProgressDockProvider>
  );
};

export default AlumnoLayout;
