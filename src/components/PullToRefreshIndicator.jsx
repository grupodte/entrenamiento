import React from 'react';
import './PullToRefreshIndicator.css';

const PULL_THRESHOLD = 80;

const PullToRefreshIndicator = ({ isRefreshing, pullDistance }) => {
    const rotation = Math.min(pullDistance / PULL_THRESHOLD, 1) * 180;
    const opacity = Math.min(pullDistance / (PULL_THRESHOLD / 2), 1);

    return (
        <div className="ptr-indicator-container" style={{ height: `${pullDistance}px`, opacity }}>
            {isRefreshing ? (
                <div className="ptr-spinner"></div>
            ) : (
                <div className="ptr-arrow" style={{ transform: `rotate(${rotation}deg)` }}>
                    ⬇️
                </div>
            )}
        </div>
    );
};

export default PullToRefreshIndicator;