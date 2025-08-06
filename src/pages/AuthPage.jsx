import React from 'react';
import { useAuthForm } from '../hooks/useAuthForm';
import {
    AuthForm,
    GoogleSignInButton,
    AuthModeToggle,
} from '../components/Auth';

const AuthPage = () => {
    const {
        isLogin,
        setIsLogin,
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        handleSubmit,
        handleGoogle,
    } = useAuthForm();

    return (
        <div className="min-h-screen flex items-center justify-center">
            {/* Video de fondo */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src="/backgrounds/loginbg.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Overlay estático */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal de autenticación */}
            <div className="relative z-10 p-8 rounded-2xl bg-gray-900/20 w-[325px] max-w-md text-white border border-gray-700/10 shadow-2xl backdrop-blur-md">
                <h2 className="text-2xl font-bold text-center mb-6">
                    {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
                </h2>

                <AuthForm
                    isLogin={isLogin}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    isLoading={isLoading}
                    handleSubmit={handleSubmit}
                />

                <div className="my-4 text-center text-gray-400 text-sm">o</div>

                <GoogleSignInButton
                    isLoading={isLoading}
                    handleGoogle={handleGoogle}
                />

                <AuthModeToggle isLogin={isLogin} setIsLogin={setIsLogin} />
            </div>
        </div>
    );
};

export default AuthPage;
