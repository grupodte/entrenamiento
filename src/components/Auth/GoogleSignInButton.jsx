import React from 'react';

const GoogleSignInButton = ({ isLoading, handleGoogle }) => {
    return (
        <button
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-3 transition-colors duration-200 disabled:opacity-50 border border-gray-700/20 backdrop-blur-md"
        >
            <img src="/backgrounds/google.webp" alt="Google" className="w-6 h-6" />
            Iniciar rápido
        </button>
    );
};

export default GoogleSignInButton;
