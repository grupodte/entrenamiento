// src/components/BrandedLoader.jsx
const BrandedLoader = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
    );
};

export default BrandedLoader;
