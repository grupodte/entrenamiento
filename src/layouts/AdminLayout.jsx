import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { DragStateProvider, useDragState } from '../context/DragStateContext';
import { VideoProvider, useVideo } from '../context/VideoContext';
import VideoPanel from '../components/VideoPanel';

const pageVariants = {
  initial: { opacity: 0, x: 40, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, x: -40, scale: 0.98, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } }
};

const AdminLayoutInternal = () => {
    const { isOpen, videoUrl, hideVideo } = useVideo();
    const { isDragging } = useDragState();
    const location = useLocation();

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
                <AnimatePresence mode="wait" initial={false}>
                  <motion.main
                    key={location.pathname}
                    className="flex-1 min-h-full px-4 sm:px-6 lg:px-8 pl-safe pr-safe"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <Outlet />
                  </motion.main>
                </AnimatePresence>
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
