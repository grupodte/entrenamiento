// src/components/VideoPanel.jsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getYouTubeVideoId } from '../utils/youtube';
import { FaTimes } from 'react-icons/fa';

const VideoPanel = ({ open, onClose, videoUrl }) => {
    const videoId = getYouTubeVideoId(videoUrl);
    const embedUrl = videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
        : null;

    // Evita el scroll mientras está abierto
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!videoUrl || !videoId) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key={`panel-${videoId}`} // 👈 clave dinámica
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl px-4"
                    onClick={onClose}
                >
                    {/* Botón cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-white/10 transition"
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>

                    {/* Contenedor del video */}
                    <motion.div
                        key={`video-${videoId}`} // 👈 también clave para reiniciar iframe
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-4xl aspect-video rounded-xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            src={embedUrl}
                            title="Video del ejercicio"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VideoPanel;
