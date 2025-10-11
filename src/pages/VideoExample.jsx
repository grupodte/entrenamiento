import { useState } from 'react';
import MuxVideoPlayer from '../components/MuxVideoPlayer';

const VideoExample = () => {
  // Example video data - replace with your actual Mux playback IDs
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  const videoLibrary = [
    {
      id: 'video-1',
      title: 'Fitness Training Basics',
      playbackId: 'a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M', // Example from Mux docs
      description: 'Learn the fundamentals of fitness training',
      poster: null
    },
    {
      id: 'video-2', 
      title: 'Advanced Workout Techniques',
      playbackId: 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs', // Example from Mux docs
      description: 'Take your workouts to the next level',
      poster: null
    }
  ];

  // Example user data - replace with actual user info
  const currentUser = {
    id: 'user-123',
    name: 'John Doe'
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Video Training Library
          </h1>
          <p className="text-lg text-gray-600">
            Select a video to start watching
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {videoLibrary.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleVideoSelect(video)}
            >
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v10l8-5-8-5z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Click to play</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                <p className="text-sm text-gray-600">{video.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Video Player */}
        {selectedVideo && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedVideo.title}
              </h2>
              <p className="text-gray-600">{selectedVideo.description}</p>
            </div>

            {/* Basic Usage Example */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Basic Player</h3>
              <MuxVideoPlayer
                playbackId={selectedVideo.playbackId}
                metadata={{
                  video_id: selectedVideo.id,
                  video_title: selectedVideo.title,
                  viewer_user_id: currentUser.id
                }}
              />
            </div>

            {/* Advanced Usage Examples */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Custom Styled Player */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Custom Styled Player</h3>
                <MuxVideoPlayer
                  playbackId={selectedVideo.playbackId}
                  metadata={{
                    video_id: selectedVideo.id,
                    video_title: selectedVideo.title,
                    viewer_user_id: currentUser.id,
                    // Additional metadata for analytics
                    page: 'training-library',
                    section: 'custom-player'
                  }}
                  className="border-4 border-blue-500 rounded-xl"
                  muted={true}
                />
              </div>

              {/* Compact Player */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Compact Player</h3>
                <MuxVideoPlayer
                  playbackId={selectedVideo.playbackId}
                  metadata={{
                    video_id: selectedVideo.id,
                    video_title: selectedVideo.title,
                    viewer_user_id: currentUser.id,
                    player_size: 'compact'
                  }}
                  className="max-w-md"
                  style={{ aspectRatio: '4/3' }}
                />
              </div>
            </div>

            {/* Usage Code Examples */}
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Code Example</h3>
              <pre className="text-sm overflow-x-auto">
                <code>{`<MuxVideoPlayer
  playbackId="${selectedVideo.playbackId}"
  metadata={{
    video_id: "${selectedVideo.id}",
    video_title: "${selectedVideo.title}",
    viewer_user_id: "${currentUser.id}"
  }}
  className="border-2 border-gray-200"
  autoPlay={false}
  muted={false}
  controls={true}
/>`}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            Getting Started with Mux Player
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Required Props</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                <li><code>playbackId</code> - Your Mux video playback ID</li>
                <li><code>metadata.video_id</code> - Unique video identifier</li>
                <li><code>metadata.video_title</code> - Video title for analytics</li>
                <li><code>metadata.viewer_user_id</code> - User identifier for tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Optional Props</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                <li><code>className</code> - Custom CSS classes</li>
                <li><code>autoPlay</code> - Auto-play video (default: false)</li>
                <li><code>muted</code> - Start muted (default: false)</li>
                <li><code>controls</code> - Show controls (default: true)</li>
                <li><code>poster</code> - Poster image URL</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoExample;