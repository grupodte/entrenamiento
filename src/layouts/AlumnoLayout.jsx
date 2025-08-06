import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingNavBar from '../components/FloatingNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';
import { useViewportHeight } from '../hooks/useViewportHeight';

// Las variantes de animación y los handlers se mantienen igual...
const pageVariants = { /* ... */ };

const AlumnoLayout = () => {
  const location = useLocation();
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);

  useViewportHeight();

  // Todos tus handlers (handleOpenPerfil, etc.) se quedan aquí...
  const handleOpenPerfil = useCallback(() => { /* ... */ }, []);


  return (
    // 1. El contenedor principal ahora es más simple y actúa como referencia
    <div className="fullscreen ">

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
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
        <FloatingNavBar onOpenPerfil={handleOpenPerfil} />
      </div>

      {/* Los drawers manejan su propia posición, por lo que no cambian */}
      <AnimatePresence>
        {isPerfilDrawerOpen && (
          <PerfilDrawer
            onClose={() => setIsPerfilDrawerOpen(false)}
            onEdit={() => {
              setIsPerfilDrawerOpen(false);
              setIsEditPerfilDrawerOpen(true);
            }}
          />
        )}
        {isEditPerfilDrawerOpen && (
          <EditarPerfilDrawer
            onClose={() => setIsEditPerfilDrawerOpen(false)}
            onBack={() => {
              setIsEditPerfilDrawerOpen(false);
              setIsPerfilDrawerOpen(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlumnoLayout;