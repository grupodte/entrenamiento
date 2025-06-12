import logo from '/icons/icon-512x512-removebg-preview.png';

const BrandedLoader = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center backdrop-blur-md bg-transparent animate-fadeIn">
            <img
                src={logo}
                alt="Logo"
                className="w-16 h-16 mb-4 animate-pulse"
            />
        </div>
    );
};

export default BrandedLoader;
