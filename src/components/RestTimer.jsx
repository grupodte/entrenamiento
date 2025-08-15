import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { FaForward } from 'react-icons/fa';

const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(Math.round(seconds % 60)).padStart(2, '0');
    return `${m}:${s}`;
};

const TimeDisplay = ({ time }) => {
    const [displayTime, setDisplayTime] = useState(formatTime(time.get()));

    useEffect(() => {
        const unsubscribe = time.on("change", (latest) => {
            setDisplayTime(formatTime(latest));
        });
        return () => unsubscribe();
    }, [time]);

    return <span className="text-5xl font-mono font-bold">{displayTime}</span>;
};


const RestTimer = ({ duration = 30, exerciseName = 'Ejercicio siguiente', onFinish }) => {
    const timeLeft = useMotionValue(duration);
    const circumference = 2 * Math.PI * 45;
    const progress = useMotionValue(circumference);
    const audioRef = useRef(null);

    useEffect(() => {
        timeLeft.set(duration);
        progress.set(circumference);

        const timerAnimation = animate(timeLeft, 0, {
            duration,
            ease: 'linear',
            onUpdate: (latest) => {
                const newProgress = (latest / duration) * circumference;
                progress.set(newProgress);
            },
            onComplete: () => {
                if (audioRef.current) {
                    audioRef.current.play().catch(err => console.error('Error al reproducir sonido:', err));
                }
                if (navigator.vibrate) {
                    navigator.vibrate([300, 100, 300]);
                }
                onFinish?.();
            },
        });

        return () => {
            timerAnimation.stop();
        };
    }, [duration, onFinish]);

    const handleSkip = () => {
        onFinish?.();
    };

    return (
        <>
            <audio ref={audioRef} src="/sounds/levelup.mp3" preload="auto" />
            <motion.div
                key="rest-timer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex flex-col items-center justify-center p-4"
            >
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
                    className="w-full max-w-sm text-center text-white bg-gray-800/80 rounded-3xl p-8 shadow-2xl"
                >
                    <p className="font-bold text-lg text-cyan-300 tracking-wider">¡A DESCANSAR!</p>
                    <div className="relative my-8 w-48 h-48 mx-auto">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" stroke="#4A5568" strokeWidth="10" fill="none" />
                            <motion.circle
                                cx="50" cy="50" r="45"
                                stroke="#4FD1C5"
                                strokeWidth="10"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                style={{ strokeDashoffset: progress }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <TimeDisplay time={timeLeft} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-300">Siguiente:</p>
                    <p className="font-semibold text-xl mt-1">{exerciseName}</p>

                    <motion.button
                        onClick={handleSkip}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-8 w-full flex items-center justify-center gap-3 bg-cyan-500/20 text-cyan-300 font-semibold py-3 px-5 rounded-full hover:bg-cyan-500/30 transition-colors"
                    >
                        <FaForward />
                        <span>Omitir Descanso</span>
                    </motion.button>
                </motion.div>
            </motion.div>
        </>
    );
};

export default RestTimer;
