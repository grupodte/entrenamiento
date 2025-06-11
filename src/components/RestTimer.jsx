import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStopwatch } from 'react-icons/fa';

const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
};

const RestTimer = ({ duration = 30, exerciseName = 'Ejercicio siguiente', onFinish }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const intervalRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        setTimeLeft(duration);
        console.log('🟢 RestTimer iniciado con duración:', duration);

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;

                    console.log('⏰ Tiempo finalizado. Intentando reproducir sonido...');
                    if (audioRef.current) {
                        console.log('🔍 AudioRef encontrado, volumen:', audioRef.current.volume);
                        audioRef.current.currentTime = 0;
                        audioRef.current
                            .play()
                            .then(() => console.log('✅ Sonido reproducido con éxito'))
                            .catch((err) => console.error('❌ Error al reproducir sonido:', err));
                    } else {
                        console.warn('⚠️ audioRef es null');
                    }

                    // Vibración
                    if (navigator.vibrate) {
                        console.log('📳 Dispositivo soporta vibración. Vibrando...');
                        navigator.vibrate([300, 100, 300]);
                    } else {
                        console.warn('📴 Vibración no soportada');
                    }

                    onFinish?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        };
    }, [duration]);

    return (
        <>
            <audio
                ref={audioRef}
                src="https://iyipzkkiqscbzugrakeh.supabase.co/storage/v1/object/public/video//levelup.mp3"
                preload="auto"
            />
<AnimatePresence>
                {timeLeft > 0 && (
                    <motion.div
                        key="rest-timer"
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 200, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 50 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-black text-white p-4 shadow-xl"
                    >
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FaStopwatch className="text-3xl" />
                                <div>
                                    <p className="font-bold text-lg">¡A descansar!</p>
                                    <p className="text-sm text-white/70">Siguiente: {exerciseName}</p>
                                </div>
                            </div>
                            <motion.span
                                className="text-5xl font-mono font-bold"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            >
                                {formatTime(timeLeft)}
                            </motion.span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RestTimer;