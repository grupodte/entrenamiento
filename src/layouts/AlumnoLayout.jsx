import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavBar from '../components/BottomNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';

const pageVariants = {
  initial: { opacity: 0, x: 50 }, // Más desplazamiento para una entrada más notoria
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } }, // Duración ligeramente mayor, ease más rápido al final
  exit: { opacity: 0, x: -50, transition: { duration: 0.35, ease: 'easeOut' } } // Más desplazamiento para una salida más notoria
};

const AlumnoLayout = () => {
  const location = useLocation();
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);

  const handleOpenPerfilDrawer = () => {
    setIsPerfilDrawerOpen(true);
  };

  const handleClosePerfilDrawer = () => {
    setIsPerfilDrawerOpen(false);
  };

  const handleOpenEditPerfilDrawer = () => {
    setIsPerfilDrawerOpen(false); // Cierra el drawer de perfil
    setIsEditPerfilDrawerOpen(true);
  };

  const handleCloseEditPerfilDrawer = () => {
    setIsEditPerfilDrawerOpen(false);
  };

  const handleBackToProfileDrawer = () => {
    setIsEditPerfilDrawerOpen(false);
    setIsPerfilDrawerOpen(true);
  };

  const handleProfileUpdate = () => {
    handleCloseEditPerfilDrawer();
    // Opcional: podrías querer reabrir el drawer de perfil para ver los cambios
    // handleOpenPerfilDrawer();
  };

  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    return () => window.removeEventListener('resize', setViewportHeight);
  }, []);

  return (
    <div className="bg-gray-900 text-white h-screen font-sans flex flex-col overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className="flex-1 overflow-y-auto pt-safe px-4 sm:px-6 lg:px-8 overscroll-y-contain scrollbar-hide"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNavBar onOpenPerfil={handleOpenPerfilDrawer} />
      <PerfilDrawer isOpen={isPerfilDrawerOpen} onClose={handleClosePerfilDrawer} onEdit={handleOpenEditPerfilDrawer} />
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
