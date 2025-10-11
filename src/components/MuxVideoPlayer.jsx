import MuxPlayer from '@mux/mux-player-react';

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