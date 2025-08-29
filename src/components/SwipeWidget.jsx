// ✅ SwipeWidget.jsx actualizado para compatibilidad con el fix del gesture
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music } from 'lucide-react';
import SpotifyWidget from './SpotifyWidget';

const SwipeWidget = ({ isOpen, onClose, swipeProgress = 0, closeProgress = 0 }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Aplicar clases CSS contextuales
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('widget-active');
      document.documentElement.classList.add('widget-active');
    } else {
      document.body.classList.remove('widget-active');
      document.documentElement.classList.remove('widget-active');
    }

    return () => {
      document.body.classList.remove('widget-active');
      document.documentElement.classList.remove('widget-active');
    };
  }, [isOpen]);

  const openProgress = Math.min(swipeProgress / 200, 1);
  const closeProgressNormalized = Math.min(closeProgress / 150, 1);

  let currentVariant = 'closed';
  if (closeProgress > 0) {
    currentVariant = 'closing';
  } else if (swipeProgress > 0) {
    currentVariant = 'dragging';
  } else if (isOpen) {
    currentVariant = 'open';
  }

  const widgetVariants = {
    closed: {
      x: '-100%',
      transition: { type: 'spring', stiffness: 400, damping: 40 }
    },
    open: {
      x: '0%',
      transition: { type: 'spring', stiffness: 400, damping: 40 }
    },
    dragging: {
      x: `${-100 + openProgress * 100}%`,
      transition: { type: 'tween', duration: 0 }
    },
    closing: {
      x: `${-closeProgressNormalized * 100}%`,
      transition: { type: 'tween', duration: 0 }
    }
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
    dragging: { opacity: openProgress * 0.6 },
    closing: { opacity: (1 - closeProgressNormalized) * 0.6 }
  };

  const TimeWidget = () => (
    <div className="rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20  p-6 flex flex-col justify-center items-center h-25 backdrop-blur-sm">
      <div className="text-4xl font-light text-white mb-1">
        {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-sm text-gray-300">
        {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {(isOpen || swipeProgress > 0 || closeProgress > 0) && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            variants={overlayVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            onClick={handleOverlayClick}
            style={{ backdropFilter: 'blur(8px)' }}
          />

          <motion.div
            className="fixed left-0 top-0 h-full w-80 z-50 shadow-2xl"
            variants={widgetVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            style={{
        
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              backdropFilter: 'blur(20px) saturate(150%)'
            }}
          >
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-white/20 rounded-full" />

           
            <div className="p-4 pt-16 pb-4">
              <div className="flex items-center gap-3 mb-4">
       
              </div>
            </div>

            <div
              className="px-4 pb-4 h-full overflow-y-auto scrollbar-hide"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="grid grid-cols-2 gap-3">
                <TimeWidget />
                

                <div className="col-span-2" style={{ pointerEvents: 'auto' }}>
                  <SpotifyWidget />
                </div>

                <div className="col-span-2 h-20" />
              </div>
            </div>

            {(swipeProgress > 0 || closeProgress > 0) && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-1 h-16 bg-cyan-400/60 rounded-full animate-pulse" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SwipeWidget;
