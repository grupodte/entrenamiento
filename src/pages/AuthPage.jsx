import React from 'react';
import { useAuthForm } from '../hooks/useAuthForm';
import {
    AuthForm,
    GoogleSignInButton,
    AuthModeToggle,
} from '../components/Auth';
import { motion } from 'framer-motion';
import { commonVariants } from '../components/animations';
import { useViewportHeight } from '../hooks/useViewportHeight';

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

    useViewportHeight();

    return (
        <div className="fixed inset-0 flex items-center justify-center">
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

            {/* Capa de blur y overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

            {/* Modal de autenticación */}
            <motion.div
                variants={commonVariants.scale}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative z-10 p-8 rounded-2xl bg-gray-900/20 w-[325px] max-w-md text-white border border-gray-700/10 shadow-2xl backdrop-blur-md"
            >
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
            </motion.div>
        </div>
    );
};

export default AuthPage;