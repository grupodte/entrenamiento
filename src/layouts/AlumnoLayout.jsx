import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavBar from '../components/BottomNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';
import { useViewportHeight } from '../hooks/useViewportHeight'; // 👈 importamos el hook

const pageVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.35, ease: 'easeOut' } }
};

const AlumnoLayout = () => {
  const location = useLocation();
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);

  // 👇 Hook para altura dinámica
  useViewportHeight();

  const handleOpenPerfilDrawer = () => setIsPerfilDrawerOpen(true);
  const handleClosePerfilDrawer = () => setIsPerfilDrawerOpen(false);
  const handleOpenEditPerfilDrawer = () => {
    setIsPerfilDrawerOpen(false);
    setIsEditPerfilDrawerOpen(true);
  };
  const handleCloseEditPerfilDrawer = () => setIsEditPerfilDrawerOpen(false);
  const handleBackToProfileDrawer = () => {
    setIsEditPerfilDrawerOpen(false);
    setIsPerfilDrawerOpen(true);
  };
  const handleProfileUpdate = () => handleCloseEditPerfilDrawer();

  return (
    <div
      className="text-white font-sans flex flex-col relative"
      style={{
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        backgroundImage: `url('/assets/FOTO_FONDO.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm pointer-events-none"></div>

      {/* Contenido */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className="relative z-10 flex-1 overflow-y-auto pt-safe px-4 sm:px-6 lg:px-8 overscroll-y-contain scrollbar-hide"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* BottomNavBar fijo con safe area */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <BottomNavBar onOpenPerfil={handleOpenPerfilDrawer} />
      </div>

      {/* Drawers */}
      <PerfilDrawer
        isOpen={isPerfilDrawerOpen}
        onClose={handleClosePerfilDrawer}
        onEdit={handleOpenEditPerfilDrawer}
      />
      <EditarPerfilDrawer
        isOpen={isEditPerfilDrawerOpen}
        onClose={handleCloseEditPerfilDrawer}
        onBack={handleBackToProfileDrawer}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default AlumnoLayout;
