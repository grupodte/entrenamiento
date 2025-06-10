import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

const AppLayout = () => {
    // Fix de altura 100vh real en móviles
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
        <div
            className="app-wrapper h-[calc(var(--vh,1vh)*100)] w-full overflow-hidden bg-white text-black"
        >
            <PullToRefreshIndicator
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
            />

            <div
                ref={scrollRef}
                className="scroll-zone h-full overflow-y-auto overscroll-contain"
            >
                <main className="min-h-full px-4 py-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
