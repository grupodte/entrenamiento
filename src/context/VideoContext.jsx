// src/context/VideoContext.jsx
import { createContext, useContext, useState } from 'react';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const showVideo = (url) => {
        setVideoUrl(url);
        setIsOpen(true);
    };

    const hideVideo = () => {
        setIsOpen(false);
        setVideoUrl('');
    };

    return (
        <VideoContext.Provider value={{ videoUrl, isOpen, showVideo, hideVideo }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideo = () => useContext(VideoContext);
