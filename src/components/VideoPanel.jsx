import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getYouTubeVideoId } from '../utils/youtube';
import { FaTimes } from 'react-icons/fa';

const VideoPanel = ({ isOpen, onClose, videoUrl }) => {
    const videoId = getYouTubeVideoId(videoUrl);
    const embedUrl = videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0&modestbranding=1`
        : null;

    // Evita el scroll mientras está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!videoUrl || !videoId) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key={`panel-${videoId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm !mt-0"
                    onClick={onClose}
                    style={{ marginTop: '0 !important' }}
                >
                    {/* Botón cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-white bg-black/50 p-2 rounded-full hover:bg-white/20 transition-colors"
                        aria-label="Cerrar video"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>

                    {/* Contenedor del video */}
                    <motion.div
                        key={`video-${videoId}`}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="w-full h-full md:w-11/12 md:h-5/6 md:max-w-6xl md:rounded-lg overflow-hidden shadow-2xl bg-black"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            src={embedUrl}
                            title="Video del ejercicio"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
