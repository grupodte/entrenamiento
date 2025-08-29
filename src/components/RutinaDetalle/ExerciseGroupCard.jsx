import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Dumbbell, Check, ChevronDown, Pause } from 'lucide-react';
import SetRow from './SetRow';

// Variantes de estilo para diferentes tipos de ejercicio
const EXERCISE_VARIANTS = {
  superset: {
    badge: 'Sin pausa entre ejercicios',
    icon: ArrowLeftRight,
    borderColor: 'border-violet-500/40',
    bgGradient: 'bg-gradient-to-r from-violet-900/20 to-purple-900/20',
    sidebarGradient: 'bg-gradient-to-b from-violet-500 to-purple-600',
    glowColor: 'shadow-violet-500/25',
    activeGlow: 'ring-violet-500/50',
  },
  simple: {
    badge: 'Ejercicio simple',
    icon: Dumbbell,
    borderColor: 'border-cyan-500/40',
    bgGradient: 'bg-gradient-to-r from-cyan-900/20 to-blue-900/20',
    sidebarGradient: 'bg-gradient-to-b from-cyan-500 to-blue-600',
    glowColor: 'shadow-cyan-500/25',
    activeGlow: 'ring-cyan-500/50',
  }
};

// Estados del ejercicio
const EXERCISE_STATES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

const ExerciseGroupCard = ({
  variant = 'simple', // 'superset' | 'simple'
  title = 'Ejercicio',
  exercises = [], // Array de ejercicios
  sets = [], // Array de sets
  state = EXERCISE_STATES.PENDING,
  isExpanded = false,
  onToggleExpanded = () => {},
  onSetComplete = () => {},
  onRestStart = () => {},
  setsCompleted = 0,
  totalSets = 0,
  lastSessionData = {},
  elementosCompletados = {},
  elementoActivoId = null,
}) => {
  const [isCollapsing, setIsCollapsing] = useState(false);
  const styleVariant = EXERCISE_VARIANTS[variant] || EXERCISE_VARIANTS.simple;
  const IconComponent = styleVariant.icon;

  // Manejar expansión/colapso
  const handleToggleExpand = () => {
    if (state === EXERCISE_STATES.COMPLETED && isExpanded) {
      setIsCollapsing(true);
      setTimeout(() => {
        onToggleExpanded();
        setIsCollapsing(false);
      }, 300);
    } else {
      onToggleExpanded();
    }
  };

  // Determinar el estilo basado en el estado
  const getStateStyles = () => {
    switch (state) {
      case EXERCISE_STATES.COMPLETED:
        return {
          container: `${styleVariant.bgGradient} ${styleVariant.borderColor} opacity-75`,
          sidebar: `${styleVariant.sidebarGradient}`,
          shadow: '',
        };
      case EXERCISE_STATES.IN_PROGRESS:
        return {
          container: `${styleVariant.bgGradient} ${styleVariant.borderColor} ring-2 ${styleVariant.activeGlow}`,
          sidebar: `${styleVariant.sidebarGradient} animate-pulse`,
          shadow: `shadow-lg ${styleVariant.glowColor}`,
        };
      default:
        return {
          container: `${styleVariant.bgGradient} ${styleVariant.borderColor} hover:${styleVariant.borderColor.replace('/40', '/60')}`,
          sidebar: `${styleVariant.sidebarGradient} opacity-60`,
          shadow: '',
        };
    }
  };

  const stateStyles = getStateStyles();
  const progress = totalSets > 0 ? (setsCompleted / totalSets) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        relative rounded-xl border backdrop-blur-md transition-all duration-300
        ${stateStyles.container} ${stateStyles.shadow}
      `}
    >
      {/* Banda lateral */}
      <div 
        className={`absolute left-0 top-0 w-1 h-full rounded-l-xl ${stateStyles.sidebar}`}
      />

      {/* Header del ejercicio */}
      <motion.div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={handleToggleExpand}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Icono del tipo de ejercicio */}
          <motion.div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full
              ${variant === 'superset' ? 'bg-violet-500/20' : 'bg-cyan-500/20'}
              border ${styleVariant.borderColor}
            `}
            animate={{ rotate: state === EXERCISE_STATES.IN_PROGRESS ? 360 : 0 }}
            transition={{ duration: 2, repeat: state === EXERCISE_STATES.IN_PROGRESS ? Infinity : 0 }}
          >
            <IconComponent className="w-5 h-5 text-white" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate">{title}</h3>
            
            {/* Badge del tipo */}
            <div className="flex items-center gap-2 mt-1">
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${variant === 'superset' 
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }
              `}>
                {styleVariant.badge}
              </span>
              
              {/* Progreso de sets */}
              <span className="text-xs text-gray-400">
                {setsCompleted}/{totalSets} sets
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores de estado */}
        <div className="flex items-center gap-2">
          {/* Progreso circular mini */}
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
                fill="transparent"
              />
              <motion.circle
                cx="16"
                cy="16"
                r="14"
                stroke={variant === 'superset' ? '#8b5cf6' : '#06b6d4'}
                strokeWidth="2"
                fill="transparent"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 87.96,
                  strokeDashoffset: 87.96 - (87.96 * progress) / 100,
                }}
                initial={{ strokeDashoffset: 87.96 }}
                animate={{ strokeDashoffset: 87.96 - (87.96 * progress) / 100 }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
              {Math.round(progress)}
            </span>
          </div>

          {/* Check de completado */}
          {state === EXERCISE_STATES.COMPLETED && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}

          {/* Flecha de expansión */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>
      </motion.div>

      {/* Contenido expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-4 space-y-3">
              {/* Lista de sets */}
              {sets.map((set, index) => (
                <SetRow
                  key={set.id || index}
                  set={set}
                  variant={variant}
                  isCompleted={elementosCompletados[set.id]}
                  isActive={elementoActivoId === set.id}
                  lastSessionData={lastSessionData[set.id]}
                  onComplete={() => onSetComplete(set)}
                  onRestStart={() => onRestStart(set)}
                />
              ))}

              {/* Pausa contextual para supersets */}
              {variant === 'superset' && state === EXERCISE_STATES.IN_PROGRESS && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20"
                >
                  <Pause className="w-4 h-4 text-violet-300" />
                  <span className="text-sm text-violet-300">
                    Pausa única al completar todos los ejercicios del set
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de colapso */}
      {isCollapsing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-green-500/20 rounded-xl flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"
          >
            <Check className="w-6 h-6 text-white" />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Exportar también los estados y variantes para uso externo
ExerciseGroupCard.STATES = EXERCISE_STATES;
ExerciseGroupCard.VARIANTS = EXERCISE_VARIANTS;

export default ExerciseGroupCard;
