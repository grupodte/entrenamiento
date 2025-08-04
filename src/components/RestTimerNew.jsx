import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStopwatch, FaForward } from 'react-icons/fa';

const RestTimerNew = ({ 
  isResting, 
  timeLeft, 
  exerciseName, 
  onSkip,
  formatTime 
}) => {
  const audioRef = useRef(null);
  const circumference = 2 * Math.PI * 45; // Radio de 45

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/levelup.mp3');
      audioRef.current.load();
    }
  }, []);

  // Reproducir sonido cuando el timer termine
  useEffect(() => {
    if (timeLeft === 0 && isResting) {
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.error('Error al reproducir sonido:', err));
      }
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300]);
      }
    }
  }, [timeLeft, isResting]);

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // Calcular progreso para el círculo
  const progress = timeLeft > 0 ? (timeLeft / 60) * circumference : 0; // Asumiendo máximo 60s

  return (
    <>
      <audio ref={audioRef} src="/sounds/levelup.mp3" preload="auto" />
      <AnimatePresence>
        {isResting && timeLeft > 0 && (
          <motion.div
            key="rest-timer-new"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-sm text-center text-white bg-gray-800/80 rounded-3xl p-8 shadow-2xl"
            >
              <p className="font-bold text-lg text-cyan-300">¡A DESCANSAR!</p>
              <div className="relative my-8 w-48 h-48 mx-auto">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="#4A5568" strokeWidth="10" fill="none" />
                  <motion.circle
                    cx="50" cy="50" r="45"
                    stroke="#4FD1C5" // Color cian
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: progress }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-mono font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-300">Siguiente:</p>
              <p className="font-semibold text-xl mt-1">{exerciseName}</p>

              <button 
                onClick={handleSkip}
                className="mt-8 w-full flex items-center justify-center gap-2 bg-gray-700/80 text-white font-semibold py-3 px-5 rounded-full hover:bg-gray-600 transition-colors"
              >
                <FaForward />
                <span>Omitir Descanso</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RestTimerNew;
