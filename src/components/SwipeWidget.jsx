import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Award,
  Target,
  X,
} from 'lucide-react';

const SwipeWidget = ({ isOpen, onClose, swipeProgress = 0 }) => {
  const [stats] = useState({
    workoutsThisWeek: 3,
    totalWorkouts: 24,
    currentStreak: 5,
    nextWorkout: 'Mañana 9:00 AM',
  });

  const openProgress = Math.min(swipeProgress / 200, 1);
  const currentVariant = swipeProgress > 0 ? 'dragging' : isOpen ? 'open' : 'closed';

  const widgetVariants = {
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
    open: { x: '0%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
    dragging: { x: `${-100 + openProgress * 100}%`, transition: { type: 'tween', duration: 0 } },
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
    dragging: { opacity: openProgress },
  };

  return (
    <AnimatePresence>
      {(isOpen || swipeProgress > 0) && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            variants={overlayVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            onClick={onClose}
            style={{ backdropFilter: 'blur(6px)' }}
          />

          {/* Widget Panel */}
          <motion.div
            className="fixed left-0 top-0 h-full w-80 z-50 shadow-xl border-r border-white/10"
            variants={widgetVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            style={{
              background: 'rgba(18, 18, 18, 0.6)',
              backdropFilter: 'blur(30px) saturate(160%)',
              WebkitBackdropFilter: 'blur(30px) saturate(160%)',
            }}
          >
     
            {/* Widgets */}
            <div className="grid grid-cols-2 gap-4 p-4">
              {/* Widget: Esta Semana */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between h-36">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <TrendingUp className="text-cyan-400 w-5 h-5" />
                  </div>
                  <p className="text-sm text-gray-300">Esta Semana</p>
                </div>
                <p className="text-white text-2xl font-bold">{stats.workoutsThisWeek}/7</p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-cyan-400 rounded-full"
                    style={{ width: `${(stats.workoutsThisWeek / 7) * 100}%` }}
                  />
                </div>
              </div>

              {/* Widget: Racha Actual */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between h-36">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Award className="text-green-400 w-5 h-5" />
                  </div>
                  <p className="text-sm text-gray-300">Racha</p>
                </div>
                <p className="text-white text-2xl font-bold">{stats.currentStreak} días</p>
              </div>

              {/* Widget: Total Entrenamientos */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between h-36">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Target className="text-purple-400 w-5 h-5" />
                  </div>
                  <p className="text-sm text-gray-300">Total</p>
                </div>
                <p className="text-white text-2xl font-bold">{stats.totalWorkouts}</p>
              </div>

              {/* Widget: Próximo Entrenamiento */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between h-36">
                <div className="text-sm text-gray-300">Próximo</div>
                <p className="text-white text-lg font-semibold">{stats.nextWorkout}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SwipeWidget;
