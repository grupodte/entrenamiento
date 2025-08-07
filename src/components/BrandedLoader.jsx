// src/components/BrandedLoader.jsx
import AnimatedLoadingText from './animations/AnimatedLoadingText';

const BrandedLoader = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-transparent space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <AnimatedLoadingText text="..." />
        </div>
    );
};

export default BrandedLoader;
