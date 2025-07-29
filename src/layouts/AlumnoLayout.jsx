import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavBar from '../components/BottomNavBar';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: 'easeInOut' } }
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
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className="pb-24 pt-safe px-4 sm:px-6 lg:px-8"
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
