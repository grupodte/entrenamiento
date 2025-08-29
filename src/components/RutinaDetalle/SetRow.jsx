import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Hash, Weight } from 'lucide-react';

const SetRow = ({
  set = {},
  variant = 'simple', // 'superset' | 'simple'
  isCompleted = false,
  isActive = false,
  lastSessionData = {},
  onComplete = () => {},
  onRestStart = () => {},
  onChange = () => {},
}) => {
  const [reps, setReps] = useState(set.reps || lastSessionData.reps || '');
  const [weight, setWeight] = useState(set.carga || lastSessionData.weight || '');
  const [notes, setNotes] = useState(set.nota || lastSessionData.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const repsRef = useRef(null);
  const weightRef = useRef(null);

  // Auto-save cuando cambian los valores
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onChange({ id: set.id, reps, weight, notes });
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [reps, weight, notes, set.id, onChange]);

  // Focus automático cuando se activa el set
  useEffect(() => {
    if (isActive && !isCompleted && repsRef.current) {
      repsRef.current.focus();
    }
  }, [isActive, isCompleted]);

  const handleComplete = () => {
    if (reps && weight) {
      onComplete({
        id: set.id,
        reps: parseInt(reps),
        weight: parseFloat(weight),
        notes,
        restTime: set.pausa || 0
      });
    }
  };

  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        handleComplete();
      }
    }
  };

  const getVariantStyles = () => {
    if (variant === 'superset') {
      return {
        active: 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20',
        completed: 'bg-green-500/10 border-green-500/30',
        pending: 'bg-violet-900/5 border-violet-500/20 hover:border-violet-500/40',
        input: 'focus:border-violet-400 focus:ring-violet-400/20',
        button: 'bg-violet-500 hover:bg-violet-600',
      };
    } else {
      return {
        active: 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20',
        completed: 'bg-green-500/10 border-green-500/30',
        pending: 'bg-cyan-900/5 border-cyan-500/20 hover:border-cyan-500/40',
        input: 'focus:border-cyan-400 focus:ring-cyan-400/20',
        button: 'bg-cyan-500 hover:bg-cyan-600',
      };
    }
  };

  const styles = getVariantStyles();

  const getContainerStyle = () => {
    if (isCompleted) return styles.completed;
    if (isActive) return styles.active;
    return styles.pending;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={`
        flex items-center gap-3 p-3 rounded-lg border backdrop-blur-sm
        transition-all duration-200 ${getContainerStyle()}
      `}
    >
      {/* Número del set */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700/50 border border-gray-600/50 shrink-0">
        <span className="text-sm font-bold text-gray-300">
          {set.nro_set || set.setNumber || 1}
        </span>
      </div>

      {/* Inputs de repeticiones y peso */}
      <div className="flex-1 flex items-center gap-2">
        {/* Reps */}
        <div className="flex-1 relative">
          <div className="flex items-center gap-1 mb-1">
            <Hash className="w-3 h-3 text-gray-400" />
            <label className="text-xs text-gray-400 font-medium">REPS</label>
          </div>
          <input
            ref={repsRef}
            type="number"
            min="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, weightRef)}
            disabled={isCompleted}
            placeholder={lastSessionData.reps || set.reps || '12'}
            className={`
              w-full px-2 py-2 rounded-md border bg-black/30 text-white text-center
              font-mono font-bold placeholder-gray-500 backdrop-blur-sm
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              ${styles.input} ${isCompleted ? 'border-green-500/30' : 'border-gray-600/50'}
            `}
          />
        </div>

        {/* Peso */}
        <div className="flex-1 relative">
          <div className="flex items-center gap-1 mb-1">
            <Weight className="w-3 h-3 text-gray-400" />
            <label className="text-xs text-gray-400 font-medium">KG</label>
          </div>
          <input
            ref={weightRef}
            type="number"
            step="0.5"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e)}
            disabled={isCompleted}
            placeholder={lastSessionData.weight || set.carga || '20'}
            className={`
              w-full px-2 py-2 rounded-md border bg-black/30 text-white text-center
              font-mono font-bold placeholder-gray-500 backdrop-blur-sm
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              ${styles.input} ${isCompleted ? 'border-green-500/30' : 'border-gray-600/50'}
            `}
          />
        </div>
      </div>

      {/* Botón de completar / indicador */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Timer de descanso */}
        {!isCompleted && (
          <div className="flex items-center gap-1 text-xs font-medium">
            <Clock className={`w-3 h-3 ${
              variant === 'superset' 
                ? 'text-violet-300' 
                : 'text-cyan-300'
            }`} />
            <span className={`${
              variant === 'superset' 
                ? 'text-violet-200' 
                : 'text-cyan-200'
            }`}>
              {set.pausa && set.pausa > 0 ? `${set.pausa}s` : 'Sin pausa'}
            </span>
          </div>
        )}

        {isCompleted ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        ) : (
          <motion.button
            onClick={handleComplete}
            disabled={!reps || !weight}
            className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center
              transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
              ${reps && weight 
                ? `${styles.button} border-transparent` 
                : 'border-gray-600 hover:border-gray-500'
              }
            `}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: reps && weight ? 1.05 : 1 }}
          >
            {reps && weight && (
              <Check className="w-4 h-4 text-white" />
            )}
          </motion.button>
        )}
      </div>

      {/* Campo de notas (expandible) */}
      {showNotes && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="absolute top-full left-0 right-0 mt-2 p-3 bg-black/50 border border-gray-600/50 rounded-lg backdrop-blur-sm z-10"
        >
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas del set..."
            className="w-full px-2 py-2 bg-transparent border-none text-white placeholder-gray-500 resize-none text-sm focus:outline-none"
            rows="2"
          />
          <button
            onClick={() => setShowNotes(false)}
            className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SetRow;
