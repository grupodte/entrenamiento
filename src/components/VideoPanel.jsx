// src/components/VideoPanel.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';

const VideoPanel = ({ open, onClose, ejercicio, onSetComplete, onCargaChange }) => {
    if (!ejercicio) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'tween', duration: 0.3 }}
                    className="fixed inset-0 z-50 bg-black/40 flex justify-end"
                >
                    <div className="bg-white w-full max-w-md h-full shadow-xl relative overflow-y-auto p-6 rounded-l-2xl">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 text-2xl font-bold">
                            &times;
                        </button>

                        <h2 className="text-2xl font-bold mb-4">{ejercicio.nombre}</h2>

                        {ejercicio.video_url && (
                            <video src={ejercicio.video_url} controls className="w-full rounded-lg shadow mb-6" />
                        )}

                        <div className="space-y-3">
                            {ejercicio.sets.map((set, index) => (
                                <div
                                    key={set.id}
                                    className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-2 p-1 rounded-lg transition-colors duration-300 ${set.completed ? 'bg-green-50 text-gray-400' : 'bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <span
                                            className={`font-bold text-lg ${set.completed ? 'line-through' : 'text-indigo-600'
                                                }`}
                                        >
                                            Set {index + 1}
                                        </span>
                                        <p className="font-semibold text-gray-800">{set.reps} reps</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-grow justify-end">
                                        <input
                                            type="text"
                                            placeholder={set.cargaSugerida ? `Sug: ${set.cargaSugerida}` : 'Carga'}
                                            value={set.cargaRealizada || ''}
                                            onChange={(e) => onCargaChange(ejercicio.id, set.id, e.target.value)}
                                            disabled={set.completed}
                                            className="input text-sm w-full max-w-[75px]"
                                        />
                                        <button
                                            onClick={() => onSetComplete(ejercicio.id, set.id)}
                                            disabled={set.completed}
                                            className={`p-3 rounded-full transition-all duration-300 ${set.completed
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-500 hover:bg-green-200'
                                                }`}
                                        >
                                            <FaCheck />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VideoPanel;
