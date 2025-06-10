import React from 'react';
import { Outlet } from 'react-router-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';
import './AppLayout.css';

const AppLayout = () => {
    const handleRefresh = async () => {
        // Simulamos una demora para ver el spinner
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
    };

    const { isRefreshing, pullDistance, scrollRef } = usePullToRefresh(handleRefresh);

    return (
        <div className="app-layout-container">
            <PullToRefreshIndicator
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
            />

            {/* Este es el contenedor que tendrá el scroll y que el hook vigilará */}
            <div ref={scrollRef} className="scrollable-content">
                <div className="page-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AppLayout;