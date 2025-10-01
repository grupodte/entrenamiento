import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const WelcomeVideoCard = ({ title, description, videoSrc }) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  const handleVideoError = (e) => {
    console.error('Error cargando video:', e);
    setVideoError(true);
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    setVideoError(false);
    // Iniciar reproducción automática cuando se carga
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full flex flex-col justify-center items-center text-center"
    >
      <h2 className="text-[35px] text-[#000000] w-[272px] mb-6 leading-none">
        {title}
      </h2>

      {/* Contenedor del video */}
      <div className="relative w-[272px] mb-6 justify-center item-center flex flex-col">
        <div className="relative aspect-[9/16] h-[400px] bg-black rounded-lg overflow-hidden shadow-lg">
          {videoSrc ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                onError={handleVideoError}
                onLoadedMetadata={handleVideoLoaded}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                preload="auto"
              >
                <source src={videoSrc} type="video/quicktime" />
                <source src={videoSrc} type="video/mp4" />
                Tu navegador no soporta la reproducción de videos.
              </video>
            </>
          ) : (
            // Placeholder cuando no hay video
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <p className="text-sm">Video de bienvenida</p>
              </div>
            </div>
          )}
          
          {/* Mostrar mensaje de error si el video falla */}
          {videoError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500 p-4">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.872-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs">Error cargando video</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {description && (
        <p className="text-[#000000] leading-snug w-[272px] mx-auto text-[20px]">
          {description}
        </p>
      )}
    </motion.div>
  );
};

export default WelcomeVideoCard;
