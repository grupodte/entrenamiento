import React from 'react';

const SkeletonCard = ({ className = '' }) => (
    <div className={`bg-gray-800 rounded-xl p-4 shadow-md animate-pulse ${className}`}>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-gray-700 rounded-lg w-full"></div>
    </div>
);

const SmallSkeletonCard = () => (
    <div className="bg-gray-800 rounded-xl shadow-md animate-pulse flex justify-between items-center">
        <div>
            <div className="h-3 bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-5 bg-gray-700 rounded w-40"></div>
        </div>
        <div className="h-4 w-4 bg-gray-700 rounded-full"></div>
    </div>
);

const DashboardSkeleton = () => {
    return (
        <div className="p-4 space-y-6">
            {/* Header Skeleton */}
            <header>
                <div className="h-5 bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </header>

            {/* Grid for Progress and Tip Skeleton */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-24 mb-3"></div>
                    <div className="relative w-20 h-20">
                        <div className="w-full h-full bg-gray-700 rounded-full"></div>
                    </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 flex flex-col justify-center animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-20 mb-3"></div>
                    <div className="h-3 bg-gray-700 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                </div>
            </div>

            {/* Today's workout Skeleton */}
            <div>
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-3 animate-pulse"></div>
                <SkeletonCard />
            </div>

            {/* Next workouts Skeleton */}
            <div>
                <div className="h-6 bg-gray-700 rounded w-1/2 mb-3 animate-pulse"></div>
                <div className="space-y-3">
                    <SmallSkeletonCard />
                    <SmallSkeletonCard />
                </div>
            </div>

            {/* More options Skeleton */}
            <div>
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-3 animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                        <div className="flex-1">
                            <div className="h-5 bg-gray-700 rounded w-3/4"></div>
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                        <div className="flex-1">
                            <div className="h-5 bg-gray-700 rounded w-3/4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
