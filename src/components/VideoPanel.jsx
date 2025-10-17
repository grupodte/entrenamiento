import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getYouTubeVideoId } from '../utils/youtube';
import { FaTimes } from 'react-icons/fa';

const VideoPanel = ({ isOpen, onClose, videoUrl }) => {
    // Detectar si es un video de YouTube o un archivo directo
    const videoId = getYouTubeVideoId(videoUrl);
    const isYouTubeVideo = !!videoId;
    const isDirectVideo = !isYouTubeVideo && videoUrl && (
        videoUrl.includes('.mp4') || 
        videoUrl.includes('.webm') || 
        videoUrl.includes('.mov') || 
        videoUrl.includes('.avi') ||
        videoUrl.includes('supabase') // Videos de Supabase Storage
    );
    
    const embedUrl = isYouTubeVideo
        ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&showinfo=0&modestbranding=1`
        : null;

    // Cerrar con tecla Escape
    const handleEscapeKey = useCallback((event) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    // Evita el scroll mientras está abierto y añade listener para Escape
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscapeKey);
        } else {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscapeKey);
        }
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, handleEscapeKey]);

    // No renderizar si no hay video válido
    if (!videoUrl || (!isYouTubeVideo && !isDirectVideo)) return null;

    // No renderizar si no hay video válido
    if (!isOpen || !videoUrl || (!isYouTubeVideo && !isDirectVideo)) {
        return null;
    }

    // Crear el contenido del modal
    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="video-panel-overlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999999,
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={onClose}
                >
            

                    {/* Contenedor del video */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="w-[90%] max-w-[400px] sm:max-w-[350px] relative overflow-hidden shadow-2xl px-2"
                        onClick={(e) => e.stopPropagation()}
                        style={{ aspectRatio: '9/16' }}
                    >
                        {/* Botón de cerrar */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200"
                            aria-label="Cerrar video"
                        >
                            <FaTimes className="w-4 h-4" />
                        </button>
                        {/* Contenedor interno del video */}
                        <div className="w-full h-full rounded-2xl overflow-hidden">
                            {isYouTubeVideo ? (
                                <iframe
                                    src={embedUrl}
                                    title="Video del ejercicio"
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    style={{
                                        borderRadius: 'inherit'
                                    }}
                                />
                            ) : isDirectVideo ? (
                                <video
                                    src={videoUrl}
                                    title="Video del ejercicio"
                                    className="w-full h-full object-cover bg-black"
                                    controls
                                    preload="metadata"
                                    style={{
                                        borderRadius: 'inherit'
                                    }}
                                >
                                    Tu navegador no soporta la reproducción de video.
                                </video>
                            ) : null}
                        </div>
                        
                    
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Renderizar usando Portal para evitar problemas de posicionamiento
    return createPortal(modalContent, document.body);
};

export default VideoPanel;
