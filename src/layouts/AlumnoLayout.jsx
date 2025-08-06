import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingNavBar from '../components/FloatingNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';
import { useViewportHeight } from '../hooks/useViewportHeight';

// Variantes de animación para las transiciones de página
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
  }
};

const AlumnoLayout = () => {
  const location = useLocation();
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);

  // Hook para establecer la altura correcta del viewport en CSS (--dvh)
  useViewportHeight();

  // --- Handlers para los drawers (paneles laterales) ---
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
    // CONTENEDOR PRINCIPAL: Ocupa toda la pantalla y sirve de referencia
    // para los elementos posicionados de forma absoluta.
    <div className="fullscreen">

      {/* ÁREA DE CONTENIDO PRINCIPAL: Es flexible para ocupar el espacio
          disponible y permite el scroll interno. */}
      <motion.main
        key={location.pathname}
        className="flex-1 min-h-0 overflow-y-auto" // min-h-0 es clave para que flexbox funcione bien con overflow
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Wrapper interno con padding.
            - pt-safe: Para no chocar con el notch/Dynamic Island.
            - pb-24: Espacio inferior para que el último contenido no quede oculto por la navbar.
            - px-4/sm:px-6: Padding horizontal. */}
        <div className="pt-safe pb-24 px-4 sm:px-6">
          <Outlet />
        </div>
      </motion.main>

      {/* BARRA DE NAVEGACIÓN FLOTANTE: Se posiciona sobre el contenido en
          la parte inferior de la pantalla. */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
        <FloatingNavBar onOpenPerfil={handleOpenPerfil} />
      </div>

      {/* DRAWERS: Se renderizan aquí pero manejan su propia posición y visibilidad.
          AnimatePresence asegura que tengan animación de entrada y salida. */}
      <AnimatePresence>
        {isPerfilDrawerOpen && (
          <PerfilDrawer onClose={handleClosePerfil} onEdit={handleOpenEditPerfil} />
        )}
        {isEditPerfilDrawerOpen && (
          <EditarPerfilDrawer
            onClose={handleCloseEditPerfil}
            onBack={handleBackToProfile}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlumnoLayout;