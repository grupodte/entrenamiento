import React, { useState, useCallback, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingNavBar from '../components/FloatingNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';
import { useViewportHeight } from '../hooks/useViewportHeight';

// Variantes para animación
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }
};

const AlumnoLayout = () => {
  const location = useLocation();
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);

  useViewportHeight();

  const handleOpenPerfil = useCallback(() => setIsPerfilDrawerOpen(true), []);
  const handleClosePerfil = useCallback(() => setIsPerfilDrawerOpen(false), []);
  const handleOpenEditPerfil = useCallback(() => { setIsPerfilDrawerOpen(false); setIsEditPerfilDrawerOpen(true); }, []);
  const handleCloseEditPerfil = useCallback(() => setIsEditPerfilDrawerOpen(false), []);
  const handleBackToProfile = useCallback(() => { setIsEditPerfilDrawerOpen(false); setIsPerfilDrawerOpen(true); }, []);
  const handleProfileUpdate = useCallback(() => setIsEditPerfilDrawerOpen(false), []);

  const backgroundStyles = useMemo(() => ({
    height: '100dvh',
    minHeight: '100vh',
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    WebkitOverflowScrolling: 'touch'
  }), []);

  const overlayStyles = useMemo(() => ({
    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%)',
    WebkitBackdropFilter: 'blur(2px) saturate(120%)',
    backdropFilter: 'blur(2px) saturate(120%)'
  }), []);

  return (
    <div className="text-white font-sans flex flex-col relative" style={backgroundStyles}>
      <div className="absolute inset-0 pointer-events-none" style={overlayStyles} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className="relative z-10 flex-1 overflow-y-auto overscroll-y-contain scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="pb-safe">
            <Outlet />
          </div>
        </motion.main>
      </AnimatePresence>

      <FloatingNavBar onOpenPerfil={handleOpenPerfil} />

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
