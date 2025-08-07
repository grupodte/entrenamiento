import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import SpotifyWidget from './SpotifyWidget';

const SwipeWidget = ({ isOpen, onClose, swipeProgress = 0, closeProgress = 0 }) => {
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

  return (
    <AnimatePresence>
      {(isOpen || swipeProgress > 0 || closeProgress > 0) && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            variants={overlayVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            onClick={onClose}
            style={{ backdropFilter: 'blur(8px)' }}
          />

          {/* Widget Panel */}
          <motion.div
            className="fixed left-0 top-0 h-full w-80 z-50 shadow-2xl"
            variants={widgetVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Handle Bar */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-white/20 rounded-full" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Content */}
            <div className="p-4 pt-16 h-full overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 gap-3">
                <SpotifyWidget />

                {/* Spacer for bottom padding */}
                <div className="col-span-2 h-20" />
              </div>
            </div>

            {/* Drag Indicator */}
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