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

    const handleRefresh = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
    };

    const { isRefreshing, pullDistance, scrollRef } = usePullToRefresh(handleRefresh);

    return (
        <div className="relative h-[calc(var(--vh,1vh)*100)] w-full overflow-hidden text-white">

            {/* Imagen de fondo con estilo iOS blur */}
            <div className="absolute inset-0 -z-10">
                <img
                    src="/backgrounds/admin-blur.webp"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>

            {/* Capa de blur y oscurecimiento */}
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-white/30" />

            {/* Indicador de refresco */}
            <PullToRefreshIndicator
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
            />

            {/* Contenido scrollable */}
            <div
                ref={scrollRef}
                className="scroll-zone h-full overflow-y-auto overscroll-contain"
            >
                    <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;
