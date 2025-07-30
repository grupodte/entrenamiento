import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStopwatch, FaForward } from 'react-icons/fa';

const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
};

const RestTimer = ({ duration = 30, exerciseName = 'Ejercicio siguiente', onFinish }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const intervalRef = useRef(null);
    const audioRef = useRef(null);

    const circumference = 2 * Math.PI * 45; // Radio de 45

    useEffect(() => {
        setTimeLeft(duration);

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    if (audioRef.current) {
                        audioRef.current.play().catch(err => console.error('Error al reproducir sonido:', err));
                    }
                    if (navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
                    onFinish?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [duration, onFinish]);

    const handleSkip = () => {
        clearInterval(intervalRef.current);
        onFinish?.();
    };

    const progress = (timeLeft / duration) * circumference;

    return (
        <>
            <audio ref={audioRef} src="/sounds/levelup.mp3" preload="auto" />
            <AnimatePresence>
                {timeLeft > 0 && (
                    <motion.div
                        key="rest-timer"
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

export default RestTimer;