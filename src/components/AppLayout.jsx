import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { VideoProvider, useVideo } from '../context/VideoContext';
import VideoPanel from './VideoPanel';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';

const LayoutContent = () => {
    const { isOpen, videoUrl, hideVideo } = useVideo();

    const handleRefresh = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
    };

    const { isRefreshing, pullDistance, scrollRef } = usePullToRefresh(handleRefresh); // ✅ Solo una vez

    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);


    return (
        <div className="w-full min-h-screen text-white">
<div className="absolute inset-0 -z-10">
                <img
                    src="/backgrounds/admin-blur.webp"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-white/30" />

            {/* Indicador de pull-to-refresh */}
            <PullToRefreshIndicator
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
            />

            {/* Estructura scrollable */}
            <div
                ref={scrollRef}
                data-scroll
                className="relative z-10 flex flex-col min-h-screen overflow-y-auto"
            >
                {/* Barra superior */}
                <div className="h-[25px] backdrop-blur-xl bg-black/30 border-b border-white/10 flex items-center justify-center">
                    <img
                        src="/icons/iconodte.svg"
                        alt="Icono"
                        className="h-4 opacity-80"
                    />
                </div>

                {/* Contenido */}
                <div className="flex-1">
                    <Outlet />
                </div>
            </div>

            {/* Panel de video */}
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
