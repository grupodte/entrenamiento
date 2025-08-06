import React from 'react';

const AuthForm = ({
    isLogin,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleSubmit,
}) => {
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-900/20 text-white border border-gray-700/10 backdrop-blur-md placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors duration-200"
                placeholder="Correo electrónico"
                required
                disabled={isLoading}
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-900/20 text-white border border-gray-700/10 backdrop-blur-md placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-colors duration-200"
                placeholder="Contraseña"
                required
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-2xl font-bold text-lg transition-all duration-200 ${isLoading
                        ? 'bg-cyan-600/20 text-white cursor-not-allowed'
                        : 'bg-cyan-600/60 hover:bg-cyan-500 text-white hover:shadow-lg'
                    }`}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                        </svg>
                        Procesando...
                    </div>
                ) : isLogin ? (
                    'Ingresar'
                ) : (
                    'Registrarme'
                )}
            </button>
        </form>
    );
};

export default AuthForm;
