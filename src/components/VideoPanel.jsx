import { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getYouTubeVideoId } from '../utils/youtube';
import { FaTimes } from 'react-icons/fa';

const VideoPanel = ({ isOpen, onClose, videoUrl }) => {
    // Estados para manejo de reproducción
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const videoRef = useRef(null);
    
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
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0&modestbranding=1`
        : null;
    
    // Funciones de optimización de carga
    const handleLoadStart = useCallback(() => {
        setIsLoading(true);
        setLoadProgress(0);
    }, []);
    
    const handleProgress = useCallback(() => {
        if (videoRef.current) {
            const video = videoRef.current;
            if (video.buffered.length > 0) {
                const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                const duration = video.duration;
                if (duration > 0) {
                    setLoadProgress((bufferedEnd / duration) * 100);
                }
            }
        }
    }, []);
    
    const handleCanPlay = useCallback(() => {
        setIsLoading(false);
        // Auto-reproducir cuando el video esté listo
        if (videoRef.current && isDirectVideo) {
            videoRef.current.play().catch(error => {
                console.log('Error al auto-reproducir:', error);
                setShowPlayButton(true);
            });
        }
    }, [isDirectVideo]);
    
    const handleLoadedData = useCallback(() => {
        setIsLoading(false);
    }, []);
    
    // Precarga inteligente y auto-reproducir cuando se abre el panel
    useEffect(() => {
        if (isOpen && videoRef.current && isDirectVideo) {
            const video = videoRef.current;
            
            // Configuraciones de optimización
            video.setAttribute('preload', 'auto');
            video.setAttribute('x-webkit-airplay', 'allow');
            video.setAttribute('webkit-playsinline', 'true');
            
            // Forzar inicio de precarga
            video.load();
            
            console.log('Iniciando precarga optimizada del video');
        }
        
        // Resetear estados cuando se cierra
        if (!isOpen) {
            setIsPlaying(false);
            setShowPlayButton(true);
            setIsLoading(true);
            setLoadProgress(0);
            
            // Limpiar video para liberar memoria
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isOpen, isDirectVideo]);

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
                        className="w-[90%] max-w-[400px] sm:max-w-[350px] relative overflow-hidden"
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
                                <div className="relative w-full h-full">
                                    <video
                                        ref={videoRef}
                                        src={videoUrl}
                                        title="Video del ejercicio"
                                        className="w-full h-full object-cover bg-black cursor-pointer"
                                        preload="auto"
                                        loop
                                        playsInline
                                        muted
                                        crossOrigin="anonymous"
                                        onLoadStart={handleLoadStart}
                                        onProgress={handleProgress}
                                        onCanPlay={handleCanPlay}
                                        onLoadedData={handleLoadedData}
                                        onPlay={() => {
                                            setIsPlaying(true);
                                            setShowPlayButton(false);
                                        }}
                                        onPause={() => {
                                            setIsPlaying(false);
                                            setShowPlayButton(true);
                                        }}
                                        onEnded={() => {
                                            setIsPlaying(false);
                                            setShowPlayButton(true);
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const video = e.target;
                                            if (video.paused) {
                                                video.play();
                                            } else {
                                                video.pause();
                                            }
                                        }}
                                        style={{
                                            borderRadius: 'inherit'
                                        }}
                                    >
                                        Tu navegador no soporta la reproducción de video.
                                    </video>
                                    
                                    {/* Indicador de carga */}
                                    {isLoading && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                                            <div className="flex flex-col items-center space-y-4">
                                                {/* Spinner de carga */}
                                                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                
                                                {/* Barra de progreso */}
                                                {loadProgress > 0 && (
                                                    <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-white transition-all duration-300 ease-out"
                                                            style={{ width: `${loadProgress}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                                
                                                {/* Texto de carga */}
                                                <p className="text-white text-sm font-medium">
                                                    {loadProgress > 0 ? `Cargando... ${Math.round(loadProgress)}%` : 'Preparando video...'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Botón de reproducción clickeable */}
                                    {showPlayButton && !isLoading && (
                                        <button 
                                            className="absolute inset-0 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const video = e.target.closest('.relative').querySelector('video');
                                                if (video && video.paused) {
                                                    video.play();
                                                }
                                            }}
                                            aria-label="Reproducir video"
                                        >
                                            <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-black/60 hover:scale-110">
                                                {/* Icono de play */}
                                                <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[12px] border-y-transparent ml-1"></div>
                                            </div>
                                        </button>
                                    )}
                                </div>
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
