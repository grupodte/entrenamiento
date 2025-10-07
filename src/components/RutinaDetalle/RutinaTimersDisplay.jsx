import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Minimize2, Maximize2 } from 'lucide-react';
import ClockRestImg from '../../assets/rest-timer.svg';

// Helper para formatear pantalla grande con JSX (ej. "30s" o "1:05")
const formatBig = (seconds) => {
  if (seconds < 60) {
    return (
      <>
        {seconds}<span className="font-normal text-[45px] align-middle ml-1">s</span>
      </>
    );
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Progreso 0..1
const clamp01 = (v) => Math.min(1, Math.max(0, v));

const useProgress = (timeLeft, duration) => {
  return useMemo(() => {
    if (!duration || duration <= 0) return 0;
    const p = (duration - timeLeft) / duration;
    return clamp01(p);
  }, [timeLeft, duration]);
};

const FullScreenRest = ({ visible, timeLeft, duration, exerciseName, onSkip, onMinimize }) => {
  // Motion values para interpolar suavemente
  const mv = useMotionValue(timeLeft);
  const smooth = useSpring(mv, { damping: 38, stiffness: 220, mass: 0.6 });
  // Progreso derivado del valor suavizado
  const progressMV = useTransform(smooth, (v) => (duration > 0 ? clamp01((duration - v) / duration) : 0));
  const progressWidth = useTransform(progressMV, (p) => `${p * 100}%`);

  // Actualizar objetivo en cada tick entero
  React.useEffect(() => {
    mv.set(timeLeft);
  }, [timeLeft, mv]);

  // Valor mostrado redondeado
  const [display, setDisplay] = React.useState(timeLeft);
  React.useEffect(() => {
    const unsub = smooth.on('change', (v) => setDisplay(Math.max(0, Math.round(v))));
    return () => unsub();
  }, [smooth]);

  if (!visible) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="rest-full"
          className="fixed inset-0 z-[1000001]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Fondo con blur y color */}
          <div className="absolute inset-0 backdrop-blur-md pointer-events-none " />
          <motion.div
            className="absolute inset-0 bg-[#FF1313]/75 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Contenido centrado */}
            <div className="relative w-full h-full flex flex-col items-center justify-center  select-none pointer-events-auto">
            {/* Botón minimizar */}
            <button
              onClick={onMinimize}
              className="absolute top-[55px] right-4 p-4 z-10"
              aria-label="Minimizar"
            >
              <Minimize2 className="w-5 h-5" />
            </button>

            {/* Imagen del reloj de descanso */}
            <img src={ClockRestImg} alt="Descanso" className="w-[73px] h-[91px] mb-10 " />

            <div className="flex items-center justify-center overflow-hidden">
              <span className="text-[75px] leading-none font-extrabold ">
                {formatBig(display)}
              </span>
            </div>
            <div className="  text-[25px]  font-bold">Pausa</div>

            <div className="mt-10 text-white/85 text-sm">Respirá profundo y descansá</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const MiniRest = ({ visible, timeLeft, duration, exerciseName, onSkip, onExpand }) => {
  // MV para suavizar en mini pill
  const mv = useMotionValue(timeLeft);
  const smooth = useSpring(mv, { damping: 38, stiffness: 220, mass: 0.6 });
  const progressMV = useTransform(smooth, (v) => (duration > 0 ? clamp01((duration - v) / duration) : 0));
  const progressDash = useTransform(progressMV, (p) => (1 - p) * 2 * Math.PI * 16);

  React.useEffect(() => { mv.set(timeLeft); }, [timeLeft, mv]);

  const [display, setDisplay] = React.useState(timeLeft);
  React.useEffect(() => {
    const unsub = smooth.on('change', (v) => setDisplay(Math.max(0, Math.round(v))));
    return () => unsub();
  }, [smooth]);

  if (!visible) return null;
  const safeBottom = typeof window !== 'undefined' ? (parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0) : 0;
  const bottomOffset = 75 + 12 + safeBottom; // altura aproximada BottomNavBar (75) + margen

  return createPortal(
    <motion.div
      key="rest-mini"
      className="fixed left-0 right-0 z-floating-nav flex justify-center"
      style={{ bottom: bottomOffset }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div className="pointer-events-auto">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-900/90 text-white shadow-lg backdrop-blur-md border border-white/10">
          {/* Indicador circular */}
          <div className="relative w-8 h-8">
            <svg className="absolute inset-0 w-8 h-8 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
              <motion.circle
                cx="18" cy="18" r="16"
                stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 16}
                style={{ strokeDashoffset: progressDash }}
              />
            </svg>
          </div>

          <div className="h-6 overflow-hidden flex items-center">
            <span className="font-mono text-xl tracking-wide">{Math.max(0, display)}s</span>
          </div>

          <button
            onClick={onExpand}
            className="ml-1 p-2 rounded-lg bg-white/10 hover:bg-white/20"
            aria-label="Expandir"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </motion.div>,
    document.body
  );
};

const RutinaTimersDisplay = ({
    isResting,
    restTimeLeft,
    restOriginalDuration,
    restExerciseName,
    skipRest,
}) => {
    // Siempre iniciar en pantalla completa en cada nueva pausa
    const [isMinimized, setIsMinimized] = useState(false);

    // Cuando comienza un descanso, forzar vista expandida
    React.useEffect(() => {
      if (isResting) {
        setIsMinimized(false);
      }
    }, [isResting]);

    if (!isResting) return null;

    return (
      <>
        {/* Vista de pantalla completa */}
        <FullScreenRest
          visible={isResting && !isMinimized}
          timeLeft={restTimeLeft}
          duration={restOriginalDuration}
          exerciseName={restExerciseName}
          onSkip={skipRest}
          onMinimize={() => setIsMinimized(true)}
        />

        {/* Vista minimizada, flotando encima de la BottomNavBar */}
        <MiniRest
          visible={isResting && isMinimized}
          timeLeft={restTimeLeft}
          duration={restOriginalDuration}
          exerciseName={restExerciseName}
          onSkip={skipRest}
          onExpand={() => setIsMinimized(false)}
        />
      </>
    );
};

export default RutinaTimersDisplay;
