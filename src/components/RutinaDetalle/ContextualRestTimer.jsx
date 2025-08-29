import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Clock, Coffee, Zap } from 'lucide-react';

const ContextualRestTimer = ({
  isActive = false,
  duration = 60, // Duration in seconds
  exerciseName = '',
  variant = 'simple', // 'simple' | 'superset'
  onComplete = () => {},
  onSkip = () => {},
  onPause = () => {},
  onResume = () => {},
  autoStart = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Reset timer when props change
  useEffect(() => {
    if (isActive && duration > 0) {
      setTimeLeft(duration);
      setIsCompleted(false);
      if (autoStart) {
        setIsRunning(true);
      }
    }
  }, [isActive, duration, autoStart]);

  // Timer logic
  useEffect(() => {
    if (isActive && isRunning && timeLeft > 0 && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            onComplete();
            // Play completion sound
            if (audioRef.current) {
              audioRef.current.play().catch(() => {}); // Ignore audio play errors
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isRunning, timeLeft, isCompleted, onComplete]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (isRunning) {
      setIsRunning(false);
      onPause();
    } else {
      setIsRunning(true);
      onResume();
    }
  };

  // Handle skip
  const handleSkip = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setIsCompleted(true);
    onSkip();
  };

  // Get variant styles
  const getVariantStyles = () => {
    if (variant === 'superset') {
      return {
        gradient: 'from-violet-500/20 to-purple-500/20',
        border: 'border-violet-500/40',
        text: 'text-violet-300',
        button: 'bg-violet-500 hover:bg-violet-600',
        progress: 'from-violet-400 to-purple-500',
        icon: Zap,
        title: 'Pausa entre bloques'
      };
    } else {
      return {
        gradient: 'from-cyan-500/20 to-blue-500/20',
        border: 'border-cyan-500/40',
        text: 'text-cyan-300',
        button: 'bg-cyan-500 hover:bg-cyan-600',
        progress: 'from-cyan-400 to-blue-500',
        icon: Coffee,
        title: 'Pausa entre sets'
      };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = styles.icon;
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  if (!isActive) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          fixed bottom-20 left-4 right-4 z-40
          backdrop-blur-xl rounded-2xl border ${styles.border}
          bg-gradient-to-r ${styles.gradient}
          shadow-2xl
        `}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 rounded-t-2xl overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${styles.progress} rounded-t-2xl`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Left section - Icon and info */}
            <div className="flex items-center gap-3">
              <motion.div
                className={`
                  flex items-center justify-center w-12 h-12 rounded-full
                  bg-black/20 border ${styles.border}
                `}
                animate={{ 
                  rotate: isRunning ? 360 : 0,
                  scale: isCompleted ? [1, 1.2, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: isRunning ? Infinity : 0, ease: "linear" },
                  scale: { duration: 0.5 }
                }}
              >
                <IconComponent className={`w-6 h-6 ${styles.text}`} />
              </motion.div>

              <div>
                <h3 className={`text-sm font-semibold ${styles.text}`}>
                  {styles.title}
                </h3>
                {exerciseName && (
                  <p className="text-xs text-gray-400 truncate max-w-32">
                    Siguiente: {exerciseName}
                  </p>
                )}
              </div>
            </div>

            {/* Center section - Timer */}
            <div className="flex-1 flex flex-col items-center">
              <motion.div
                className="text-3xl font-mono font-bold text-white"
                animate={{ 
                  scale: timeLeft <= 10 && isRunning ? [1, 1.05, 1] : 1,
                  color: timeLeft <= 10 ? "#ef4444" : "#ffffff"
                }}
                transition={{ 
                  scale: { duration: 0.5, repeat: timeLeft <= 10 && isRunning ? Infinity : 0 },
                  color: { duration: 0.3 }
                }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-green-400 font-medium"
                >
                  ¡Descanso completado!
                </motion.div>
              )}
            </div>

            {/* Right section - Controls */}
            <div className="flex items-center gap-2">
              {!isCompleted && (
                <>
                  {/* Play/Pause button */}
                  <motion.button
                    onClick={handlePlayPause}
                    className={`
                      w-10 h-10 rounded-full ${styles.button}
                      flex items-center justify-center
                      transition-all duration-200
                    `}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {isRunning ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </motion.button>

                  {/* Skip button */}
                  <motion.button
                    onClick={handleSkip}
                    className="
                      w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-500
                      flex items-center justify-center
                      transition-all duration-200
                    "
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <SkipForward className="w-4 h-4 text-white" />
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Additional info for supersets */}
          {variant === 'superset' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <p className="text-xs text-gray-300 text-center">
                Pausa única después de completar todos los ejercicios del bloque
              </p>
            </motion.div>
          )}
        </div>

        {/* Completion celebration */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-2 -right-2"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                ✓
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Audio element for completion sound */}
        <audio
          ref={audioRef}
          preload="auto"
        >
          <source src="/sounds/levelup.mp3" type="audio/mpeg" />
        </audio>

        {/* Pulsing glow effect when active */}
        {isRunning && (
          <motion.div
            className={`
              absolute inset-0 rounded-2xl
              ${variant === 'superset' ? 'shadow-violet-500/25' : 'shadow-cyan-500/25'}
              shadow-lg
            `}
            animate={{ 
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ filter: 'blur(8px)' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ContextualRestTimer;
