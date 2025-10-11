import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const WelcomeVideoCard = ({ title, description, videoSrc }) => {
  const [videoError, setVideoError] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  const handleVideoError = (e) => {
    console.error('Error cargando video:', e);
    setVideoError(true);
  };

  const handleVideoLoaded = () => {
    console.log('Video cargado exitosamente');
    setVideoError(false);
    
    // Forzar dimensiones antes de mostrar
    if (videoRef.current) {
      const video = videoRef.current;
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100vw';
      video.style.height = '100vh';
      video.style.objectFit = 'cover';
      video.style.objectPosition = 'center center';
    }
    
    setVideoLoaded(true);
    
    // Intentar autoplay después de fijar dimensiones
    if (videoRef.current) {
      setTimeout(() => {
        videoRef.current.play().catch(() => {
          setShowPlayButton(true);
        });
      }, 100);
    }
  };

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setShowPlayButton(false);
      }).catch(console.error);
    }
  };

  return (
    <>
      {/* Video Background Fullscreen */}
      <div className="fixed inset-0 w-screen h-screen bg-black -z-10" style={{overflow: 'hidden'}}>
        {videoSrc ? (
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              objectFit: 'cover',
              objectPosition: 'center center',
              zIndex: -5
            }}
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            onCanPlay={handleVideoLoaded}
            autoPlay={false}
            muted
            playsInline
            loop
            preload="auto"
          >
            <source src={videoSrc} type="video/mp4" />
            Tu navegador no soporta la reproducción de videos.
          </video>
        ) : (
          // Placeholder cuando no hay video
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <p className="text-sm">Video de bienvenida</p>
            </div>
          </div>
        )}
        
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Error overlay */}
        {videoError && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-red-500 p-4">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.872-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-xs">Error cargando video</p>
            </div>
          </div>
        )}
        
        {/* Botón de play manual si autoplay falla */}
        {showPlayButton && (
          <div className="fixed inset-0 flex items-center justify-center z-20">
            <button
              onClick={handlePlayClick}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-6 transition-all duration-200 transform hover:scale-110"
            >
              <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-0 h-full flex flex-col justify-center items-center text-center"
      >
        <h2 className="text-[35px] text-white w-[272px] mb-6 leading-none drop-shadow-lg">
          {title}
        </h2>

        {description && (
          <p className="text-white/90 leading-snug w-[272px] mx-auto text-[20px] drop-shadow-md">
            {description}
          </p>
        )}
      </motion.div>
    </>
  );
};

export default WelcomeVideoCard;
