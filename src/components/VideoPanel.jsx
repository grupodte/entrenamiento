import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getYouTubeVideoId } from '../utils/youtube';
import { FaTimes } from 'react-icons/fa';

const VideoPanel = ({ isOpen, onClose, videoUrl }) => {
    const videoId = getYouTubeVideoId(videoUrl);
    const embedUrl = videoId
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

    if (!videoUrl || !videoId) return null;

    // No renderizar si no hay video
    if (!isOpen || !videoUrl || !videoId || !embedUrl) {
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
                        className="w-[100%] relative overflow-hidden shadow-2xl px-2"
                        onClick={(e) => e.stopPropagation()}
                        style={{ aspectRatio: '16/9' }}
                    >
                        {/* Contenedor interno del iframe */}
                        <div className="w-full h-full rounded-2xl overflow-hidden">
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
