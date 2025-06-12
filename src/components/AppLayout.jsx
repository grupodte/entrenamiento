import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

const AppLayout = () => {
    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    // 🔒 Desactivar scroll del body como en AuthPage
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleRefresh = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
    };

    const { isRefreshing, pullDistance, scrollRef } = usePullToRefresh(handleRefresh);

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden text-white">
            {/* Fondo con imagen y blur estilo iOS */}
            <div className="absolute inset-0 -z-10">
                <img
                    src="/backgrounds/admin-blur.webp"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-white/30" />

            <PullToRefreshIndicator
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
            />

            {/* Contenedor de páginas */}
            <div
                ref={scrollRef}
                className="relative z-10 h-full overflow-y-auto overscroll-contain"
            >
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;
