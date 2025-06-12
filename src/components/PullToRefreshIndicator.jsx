import { twMerge } from 'tailwind-merge';

const PULL_THRESHOLD = 80;

const PullToRefreshIndicator = ({ isRefreshing, pullDistance }) => {
    const clamped = Math.min(pullDistance, PULL_THRESHOLD + 40);
    const opacity = Math.min(clamped / (PULL_THRESHOLD / 2), 1);
    const showSpinner = clamped > 20;

    const containerClass = twMerge(
        'w-full flex justify-center items-end overflow-hidden transition-[height] duration-300 ease-out',
        clamped > 0 &&
        'backdrop-blur-md bg-white/60 dark:bg-neutral-800/40 border-b border-white/10'
    );

    return (
        <div
            className={containerClass}
            style={{ height: `${clamped}px`, opacity }}
        >
            {isRefreshing ? (
                <div className="mb-2 w-6 h-6 border-[3px] border-l-transparent border-white rounded-full animate-spin shadow-md" />
            ) : (
                showSpinner && (
                    <div className="mb-2 w-5 h-5 border-[3px] border-white/40 border-b-transparent rounded-full" />
                )
            )}
        </div>
    );
};

export default PullToRefreshIndicator;
