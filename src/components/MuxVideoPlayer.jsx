import MuxPlayer from '@mux/mux-player-react';
import PWAVideoPlayer from './PWAVideoPlayer';
import { useState, useEffect } from 'react';

/**
 * A reusable Mux video player component with responsive design and customizable styling
 * 
 * @param {Object} props - Component props
 * @param {string} props.playbackId - Mux playback ID for the video
 * @param {Object} props.metadata - Video metadata for tracking
 * @param {string} props.metadata.video_id - Unique video identifier
 * @param {string} props.metadata.video_title - Video title
 * @param {string} props.metadata.viewer_user_id - Viewer user identifier
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.autoPlay=false] - Auto-play video
 * @param {boolean} [props.muted=false] - Start video muted
 * @param {boolean} [props.controls=true] - Show player controls
 * @param {string} [props.poster] - Poster image URL
 * @param {Object} [props.style] - Inline styles
 * @returns {JSX.Element} MuxPlayer component
 */
const MuxVideoPlayer = ({
  playbackId,
  metadata,
  className = '',
  autoPlay = false,
  muted = false,
  controls = true,
  poster,
  style = {},
  ...props
}) => {
  const [isPWA, setIsPWA] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar PWA y móvil
  useEffect(() => {
    const detectEnvironment = () => {
      // Detectar PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
      setIsPWA(isStandalone);
      
      // Detectar móvil
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                            window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(isMobileDevice);
    };

    detectEnvironment();
    
    // Escuchar cambios en el tamaño de ventana
    const handleResize = () => {
      const isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(isMobileDevice);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Si es PWA móvil, usar el componente especializado
  if (isPWA && isMobile) {
    console.log('Using PWAVideoPlayer for mobile PWA');
    return (
      <PWAVideoPlayer
        playbackId={playbackId}
        metadata={metadata}
        className={className}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        poster={poster}
        style={style}
        {...props}
      />
    );
  }

  // Default responsive styling with Tailwind
  const defaultClasses = 'w-full aspect-video rounded-lg shadow-lg';
  const combinedClasses = `${defaultClasses} ${className}`.trim();

  // Ensure required metadata fields are present
  const playerMetadata = {
    video_id: metadata?.video_id || 'unknown',
    video_title: metadata?.video_title || 'Video',
    viewer_user_id: metadata?.viewer_user_id || 'anonymous',
    ...metadata
  };

  return (
    <div className="relative">
      <MuxPlayer
        playbackId={playbackId}
        metadata={playerMetadata}
        className={combinedClasses}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        poster={poster}
        style={style}
        {...props}
      />
    </div>
  );
};

export default MuxVideoPlayer;