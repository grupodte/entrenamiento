import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

const AppLayout = () => {
    // Altura real del viewport (fix para iOS)
    useEffect(() => {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        return () => window.removeEventListener('resize', setVH);
    }, []);

    const handleRefresh = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
    };

    const { isRefreshing, pullDistance, scrollRef } = usePullToRefresh(handleRefresh);

    return (
        <div className="h-[calc(var(--vh,1vh)*100)] w-full flex flex-col overflow-hidden bg-black text-white">
            <PullToRefreshIndicator
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
            />

            {/* Contenedor con scroll */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch bg-black"
            >
                <main className="min-h-full px-4 py-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
