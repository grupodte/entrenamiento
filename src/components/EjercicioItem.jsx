// src/components/EjercicioItem.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import VideoPanel from './VideoPanel'; // Asegurate de que esté en la misma carpeta o ajustá el path

const EjercicioItem = ({ ejercicio, onSetComplete, onCargaChange }) => {
    const [showVideo, setShowVideo] = useState(false);

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border"
            >
                <h3
                    onClick={() => setShowVideo(true)}
                    className="text-xl font-bold text-gray-800 mb-4 cursor-pointer hover:underline"
                >
                    {ejercicio.nombre}
                </h3>

                <div className="space-y-3">
                    {ejercicio.sets.map((set, index) => (
                        <div
                            key={set.id}
                            className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-2 p-1 rounded-lg transition-colors duration-300 ${set.completed ? 'bg-green-50 text-gray-400' : 'bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <span className={`font-bold text-lg ${set.completed ? 'line-through' : 'text-indigo-600'}`}>
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
                                    className={`p-3 rounded-full transition-all duration-300 ${set.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-green-200'
                                        }`}
                                >
                                    <FaCheck />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            <VideoPanel
                open={showVideo}
                onClose={() => setShowVideo(false)}
                videoUrl={ejercicio.video_url}
            />
        </>
    );
};

export default EjercicioItem;
