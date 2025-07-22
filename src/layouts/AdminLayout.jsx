import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { DragStateProvider, useDragState } from '../context/DragStateContext';
import { VideoProvider, useVideo } from '../context/VideoContext';
import VideoPanel from '../components/VideoPanel';

const AdminLayoutInternal = () => {
    const { isOpen, videoUrl, hideVideo } = useVideo();
    const { isDragging } = useDragState();

    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    const handleRefresh = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        window.location.reload();
    };

    const { isRefreshing, pullDistance, scrollRef } = usePullToRefresh(handleRefresh, isDragging);

    return (
        <div
            className="
          relative
          w-full
            h-screen
          text-white
          overflow-hidden
    
        "
        >
            <div className="absolute inset-0 -z-20">
                <img
                    src="/backgrounds/admin-blur.png"
                    alt="Fondo panel de administración"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-black/30" />

            <PullToRefreshIndicator
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
            />

            <div
                ref={scrollRef}
                className="
                    relative
                    z-10
                    flex
                   h-screen
                    overflow-y-scroll
                    overscroll-contain
                    pt-safe
                    pb-safe
                    scrollbar-hide
                "
            >
                <AdminSidebarDesktop />
                <motion.main
                    className="flex-1 min-h-full px-4 sm:px-6 lg:px-8 pl-safe pr-safe"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <Outlet />
                </motion.main>
                <AdminSidebarMobile />
            </div>
            <VideoPanel open={isOpen} onClose={hideVideo} videoUrl={videoUrl} />
        </div>
    );
};

const AdminLayout = () => {
    return (
        <VideoProvider>
            <DragStateProvider>
                <AdminLayoutInternal />
            </DragStateProvider>
        </VideoProvider>
    );
};

export default AdminLayout;
