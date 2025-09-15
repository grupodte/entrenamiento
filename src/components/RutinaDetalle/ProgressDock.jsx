import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Target,
  Clock,
  TrendingUp,
  Check
} from 'lucide-react';
import ProgressRing from '../UI/ProgressRing';

const ProgressDock = ({
  isVisible = true,
  rutina = null,
  elementosCompletados = {},
  progressGlobal = 0,
  seriesCompletadas = 0,
  totalSeries = 0,
  workoutTime = 0,
  formatWorkoutTime = (t) => t,
  progressPorSubBloque = {},
  onElementClick = () => { },
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generar lista de elementos para el checklist
  const generateChecklistItems = () => {
    if (!rutina) return [];

    const items = [];

    rutina.bloques.forEach(bloque => {
      bloque.subbloques.forEach(subbloque => {
        const progressInfo = progressPorSubBloque[subbloque.id] || {};

        items.push({
          id: subbloque.id,
          type: 'subbloque',
          name: subbloque.nombre || `${subbloque.tipo === 'superset' ? 'Superset' : 'Ejercicio'} #${subbloque.id}`,
          isCompleted: progressInfo.isCompleted || false,
          isInProgress: progressInfo.isInProgress || false,
          progress: progressInfo.progress || 0,
          variant: subbloque.tipo === 'superset' ? 'superset' : 'simple',
        });
      });
    });

    return items;
  };

  const checklistItems = generateChecklistItems();
  const completedCount = checklistItems.filter(item => item.isCompleted).length;
  const inProgressCount = checklistItems.filter(item => item.isInProgress).length;

  if (!isVisible) return null;


  const contentVariants = {
    collapsed: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.2 }
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      className="fixed bottom-4 left-4 right-4 mx-auto md:left-auto mb-2 md:right-4 md:mx-0 z-50 w-full max-w-[250px] md:w-100"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    >
      {/* Contenedor principal */}
      <motion.div
        className="bg-black/10 bg-blur-xl rounded-2xl shadow-2xl overflow-hidden justify-center"
        style={{
          backdropFilter: 'blur(20px) saturate(100%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
        layout
      >
        {/* Header del dock */}
        <motion.div
          className="flex items-center justify-between p-3 cursor-pointer border-b border-white/10"
          onClick={() => setIsExpanded(!isExpanded)}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2.5">
            <ProgressRing
              progress={progressGlobal}
              size={24}
              strokeWidth={2}
              color="#10b981"
              backgroundColor="rgba(255, 255, 255, 0.12)"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </ProgressRing>

            <div>
              <h3 className="text-[13px] font-semibold text-white leading-none">
                Progreso
              </h3>
              <p className="text-[11px] text-gray-400 leading-tight">
                {completedCount}/{checklistItems.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Timer compacto */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 rounded-full border border-emerald-400/20">
              <Clock className="w-3 h-3 text-emerald-300" />
              <span className="text-[12px] font-bold font-mono text-emerald-300 tracking-wide">
                {formatWorkoutTime(workoutTime)}
              </span>
            </div>

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Contenido expandido */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={contentVariants}
              className="overflow-hidden"
            >
              <div className="p-3">
                {/* Nombre de la rutina */}
                <div className="mb-3 text-center">
                  <h2 className="text-base font-bold text-white mb-0.5 truncate">
                    {rutina?.nombre || "Entrenamiento"}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">
                      Activo
                    </span>
                  </div>

                  {/* Barra de progreso principal */}
                  <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressGlobal}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {Math.round(progressGlobal)}% completado
                  </p>
                </div>

                {/* Resumen de estadísticas */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-1.5 bg-white/5 rounded-lg">
                    <div className="text-sm font-bold text-green-400 leading-none">{completedCount}</div>
                    <div className="text-[10px] text-gray-400">Done</div>
                  </div>
                  <div className="text-center p-1.5 bg-white/5 rounded-lg">
                    <div className="text-sm font-bold text-yellow-400 leading-none">{inProgressCount}</div>
                    <div className="text-[10px] text-gray-400">En curso</div>
                  </div>
                  <div className="text-center p-1.5 bg-white/5 rounded-lg">
                    <div className="text-sm font-bold text-cyan-400 leading-none">{totalSeries}</div>
                    <div className="text-[10px] text-gray-400">Series</div>
                  </div>
                </div>

                {/* Lista de checklist */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                  {checklistItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className={`
                        flex items-center gap-2.5 p-2 rounded-lg transition-all duration-150
                        cursor-pointer hover:bg-white/5
                        ${item.isCompleted ? 'bg-green-500/10 border border-green-500/20' : ''}
                        ${item.isInProgress ? 'bg-yellow-500/10 border border-yellow-500/20' : ''}
                        ${!item.isCompleted && !item.isInProgress ? 'bg-white/5' : ''}
                      `}
                      onClick={() => onElementClick(item.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    >
                      {/* Icono de estado */}
                      <div className="shrink-0">
                        {item.isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 text-white" />
                          </motion.div>
                        ) : (
                          <Square
                            className={`w-4 h-4 ${item.isInProgress ? 'text-yellow-400' : 'text-gray-400'
                              }`}
                          />
                        )}
                      </div>

                      {/* Información del elemento */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[13px] font-medium truncate ${item.isCompleted ? 'text-green-300' : 'text-white'
                            }`}>
                            {item.name}
                          </span>
                          {item.variant === 'superset' && (
                            <span className="text-[10px] px-1 py-0.5 bg-violet-500/20 text-violet-300 rounded">
                              SS
                            </span>
                          )}
                        </div>

                        {/* Mini barra de progreso */}
                        {item.progress > 0 && !item.isCompleted && (
                          <div className="mt-1 w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Progreso numérico */}
                      <div className="text-[11px] text-gray-400 font-mono shrink-0">
                        {Math.round(item.progress)}%
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
};

export default ProgressDock;
