import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavBar from '../components/BottomNavBar';

const pageVariants = {
  initial: { opacity: 0, x: 50 }, // Más desplazamiento para una entrada más notoria
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } }, // Duración ligeramente mayor, ease más rápido al final
  exit: { opacity: 0, x: -50, transition: { duration: 0.35, ease: 'easeOut' } } // Más desplazamiento para una salida más notoria
};

const AlumnoLayout = () => {
  const location = useLocation();

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
          className="flex-1 overflow-y-auto pb-24 pt-safe px-4 sm:px-6 lg:px-8 overscroll-y-contain scrollbar-hide"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNavBar />
    </div>
  );
};

export default AlumnoLayout;
