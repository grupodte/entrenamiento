import { motion, AnimatePresence } from 'framer-motion';
import { getYouTubeVideoId } from '../utils/youtube'; // Import the utility

const VideoPanel = ({ open, onClose, videoUrl }) => {
    if (!videoUrl) return null;

    // Use the existing utility to get the ID
    const videoId = getYouTubeVideoId(videoUrl);

    // If no ID, don't render
    if (!videoId) return null;

    // Construct the correct embed URL
    const embedUrl = `https://www.youtube.com/embed/$${videoId}?autoplay=1`;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-3xl aspect-video"
                        onClick={(e) => e.stopPropagation()} // evita cerrar al tocar el iframe
                    >
                        <iframe
                            src={embedUrl}
                            title="Video del ejercicio"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-xl shadow-2xl border-0"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VideoPanel;