// src/components/YouTubeEmbed.jsx
import { getYouTubeVideoId } from '../utils/youtube';

const YouTubeEmbed = ({ url, title = 'Video de ejercicio' }) => {
    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
        return <p className="text-xs text-gray-500 italic mt-2">Link de video no válido.</p>;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    return (
        <div className="aspect-w-16 aspect-h-9 w-full mt-3">
            <iframe
                src={embedUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-lg shadow-md"
            ></iframe>
        </div>
    );
};

export default YouTubeEmbed;