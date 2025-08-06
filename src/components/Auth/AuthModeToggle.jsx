import React from 'react';

const AuthModeToggle = ({ isLogin, setIsLogin }) => {
    return (
        <p className="text-sm text-center mt-6 text-gray-400">
            {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
            <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-cyan-400 font-semibold ml-1 hover:underline transition-colors duration-200"
            >
                {isLogin ? 'Registrate' : 'Iniciar sesión'}
            </button>
        </p>
    );
};

export default AuthModeToggle;
