import React, { useState, useEffect, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';

/**
 * Wrapper para MuxPlayer que maneja el remounting completo
 * cuando detecta problemas en PWAs móviles
 */
const MuxPlayerWrapper = ({ 
  playbackId, 
  forceReloadKey, 
  onPlayerReady,
  onPlayerError,
  ...props 
}) => {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const mountRef = useRef(0);

  // Incrementar mount counter cuando forceReloadKey cambia
  useEffect(() => {
    if (forceReloadKey > 0) {
      mountRef.current += 1;
      setIsReady(false);
      setHasError(false);
      console.log('MuxPlayerWrapper: Force remounting', { 
        key: forceReloadKey, 
        mount: mountRef.current 
      });
    }
  }, [forceReloadKey]);

  const handleCanPlay = () => {
    console.log('MuxPlayerWrapper: Can play');
    setIsReady(true);
    setHasError(false);
    onPlayerReady?.();
  };

  const handleError = (error) => {
    console.error('MuxPlayerWrapper: Error', error);
    setHasError(true);
    setIsReady(false);
    onPlayerError?.(error);
  };

  const handleLoadStart = () => {
    console.log('MuxPlayerWrapper: Load start');
    setIsReady(false);
    setHasError(false);
  };

  // Key único que combina playbackId, forceReloadKey y mountRef
  const uniqueKey = `mux-${playbackId}-${forceReloadKey}-${mountRef.current}`;

  return (
    <MuxPlayer
      key={uniqueKey}
      playbackId={playbackId}
      onCanPlay={handleCanPlay}
      onError={handleError}
      onLoadStart={handleLoadStart}
      {...props}
    />
  );
};

export default MuxPlayerWrapper;