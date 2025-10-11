import MuxPlayer from '@mux/mux-player-react';

/**
 * Hero Video Player - Full-width hero section video
 */
export const HeroVideoPlayer = ({ playbackId, metadata, ...props }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <MuxPlayer
        playbackId={playbackId}
        metadata={metadata}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay={true}
        muted={true}
        loop={true}
        controls={false}
        {...props}
      />
      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to Fitness
          </h1>
          <p className="text-xl md:text-2xl">Transform your workout experience</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Card Video Player - Video in a card layout
 */
export const CardVideoPlayer = ({ 
  playbackId, 
  metadata, 
  title, 
  description, 
  duration,
  className = '',
  ...props 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <div className="relative">
        <MuxPlayer
          playbackId={playbackId}
          metadata={metadata}
          className="w-full aspect-video"
          {...props}
        />
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {duration}
          </div>
        )}
      </div>
      {(title || description) && (
        <div className="p-4">
          {title && <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}
    </div>
  );
};

/**
 * Floating Video Player - Picture-in-picture style
 */
export const FloatingVideoPlayer = ({ 
  playbackId, 
  metadata, 
  isVisible = true,
  position = 'bottom-right',
  onClose,
  ...props 
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 w-80 bg-black rounded-lg shadow-2xl overflow-hidden`}>
      <div className="relative">
        <MuxPlayer
          playbackId={playbackId}
          metadata={metadata}
          className="w-full aspect-video"
          controls={true}
          {...props}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Grid Video Player - For video galleries
 */
export const GridVideoPlayer = ({ 
  videos, 
  columns = 3,
  gap = 'gap-6',
  onVideoSelect,
  className = '',
  ...props 
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} ${gap} ${className}`}>
      {videos.map((video, index) => (
        <CardVideoPlayer
          key={video.id || index}
          playbackId={video.playbackId}
          metadata={video.metadata}
          title={video.title}
          description={video.description}
          duration={video.duration}
          onClick={() => onVideoSelect && onVideoSelect(video)}
          className="cursor-pointer"
          {...props}
        />
      ))}
    </div>
  );
};

/**
 * Responsive Video Player with custom themes
 */
export const ThemedVideoPlayer = ({ 
  playbackId, 
  metadata, 
  theme = 'default',
  className = '',
  ...props 
}) => {
  const themes = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    dark: 'bg-gray-900 border border-gray-700 rounded-lg shadow-lg',
    fitness: 'bg-gradient-to-br from-blue-500 to-purple-600 p-1 rounded-xl shadow-lg',
    minimal: 'bg-transparent',
    premium: 'bg-white border-2 border-gold-400 rounded-xl shadow-xl',
  };

  const playerClasses = {
    default: 'rounded-lg',
    dark: 'rounded-lg',
    fitness: 'rounded-lg',
    minimal: 'rounded-none',
    premium: 'rounded-xl',
  };

  return (
    <div className={`${themes[theme]} ${className}`}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={metadata}
        className={`w-full aspect-video ${playerClasses[theme]}`}
        {...props}
      />
    </div>
  );
};

/**
 * Interactive Video Player with custom controls overlay
 */
export const InteractiveVideoPlayer = ({ 
  playbackId, 
  metadata, 
  onPlay,
  onPause,
  onEnded,
  customControls = false,
  overlayContent,
  className = '',
  ...props 
}) => {
  return (
    <div className={`relative group ${className}`}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={metadata}
        className="w-full aspect-video rounded-lg"
        controls={!customControls}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        {...props}
      />
      
      {/* Custom overlay content */}
      {overlayContent && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 rounded-lg">
          {overlayContent}
        </div>
      )}
      
      {/* Custom controls */}
      {customControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="text-white hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5v10l8-5-8-5z"/>
                </svg>
              </button>
              <span className="text-white text-sm">0:00 / 10:30</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-white hover:text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
              <button className="text-white hover:text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Video Player with loading states and error handling
 */
export const RobustVideoPlayer = ({ 
  playbackId, 
  metadata, 
  className = '',
  fallbackContent,
  loadingContent,
  ...props 
}) => {
  const defaultLoading = (
    <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading video...</p>
      </div>
    </div>
  );

  const defaultFallback = (
    <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600">Video unavailable</p>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={metadata}
        className="w-full aspect-video rounded-lg"
        onLoadStart={() => console.log('Video loading started')}
        onCanPlay={() => console.log('Video can play')}
        onError={(e) => console.error('Video error:', e)}
        {...props}
      />
    </div>
  );
};