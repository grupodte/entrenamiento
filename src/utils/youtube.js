// src/utils/youtube.js
export function getYouTubeVideoId(url) {
    if (!url) return null;
    
    // Múltiples patrones para diferentes formatos de URL de YouTube
    const patterns = [
        // youtube.com/watch?v=VIDEO_ID
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        // youtu.be/VIDEO_ID
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        // youtube.com/embed/VIDEO_ID
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        // youtube.com/v/VIDEO_ID
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        // Patrón original como fallback
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    ];
    
    for (let i = 0; i < patterns.length; i++) {
        const match = url.match(patterns[i]);
        
        if (match && match[1] && match[1].length === 11) {
            return match[1];
        }
        
        // Para el patrón original (último), usar match[2]
        if (i === patterns.length - 1 && match && match[2] && match[2].length === 11) {
            return match[2];
        }
    }
    
    return null;
}
