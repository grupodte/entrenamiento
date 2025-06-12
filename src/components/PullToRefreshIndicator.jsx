const PULL_THRESHOLD = 80;

const PullToRefreshIndicator = ({ isRefreshing, pullDistance }) => {
    const visible = pullDistance > 0;
    const opacity = Math.min(pullDistance / (PULL_THRESHOLD / 2), 1);

    return (
        <div
            className={`w-full flex justify-center items-center transition-all duration-300 overflow-hidden ${visible ? 'backdrop-blur-md bg-white/70 dark:bg-neutral-800/40 border-b border-white/20 dark:border-white/10' : ''
                }`}
            style={{ height: `${pullDistance}px`, opacity }}
        >
            {isRefreshing && (
                <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-md" />
            )}
        </div>
    );
};

export default PullToRefreshIndicator;
