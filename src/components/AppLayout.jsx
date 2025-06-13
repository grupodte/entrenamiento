import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { VideoProvider, useVideo } from '../context/VideoContext';
import VideoPanel from './VideoPanel'

const LayoutContent = () => {
    const { isOpen, videoUrl, hideVideo } = useVideo();
    const handleRefresh = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
    };

    const { scrollRef } = usePullToRefresh(handleRefresh);

    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden text-white">
            {/* Fondo blur iOS */}
            <div className="absolute inset-0 -z-10">
                <img
                    src="/backgrounds/admin-blur.webp"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-white/30" />

            {/* Contenido */}
            <div
                ref={scrollRef}
                className="relative z-10 h-full overflow-y-auto overscroll-contain"
            >
                <Outlet />
            </div>

            {/* Panel global de video */}
            <VideoPanel open={isOpen} onClose={hideVideo} videoUrl={videoUrl} />
        </div>
    );
};

const AppLayout = () => (
    <VideoProvider>
        <LayoutContent />
    </VideoProvider>
);

export default AppLayout;
