import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import bgWeb from '../assets/bg-auth-web.png';
import bgMov from '../assets/bg-auth-mov.png';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasValidSession, setHasValidSession] = useState(false);
    const navigate = useNavigate();

    // Verificar si tenemos una sesión válida para reset password
    useEffect(() => {
        let isMounted = true;

        const cleanUrl = () => {
            if (typeof window === 'undefined') return;
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        };

        const checkSession = async () => {
            try {
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const queryParams = new URLSearchParams(window.location.search);

                const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
                const code = queryParams.get('code');

                let session = null;

                if (accessToken && refreshToken) {
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) throw error;
                    session = data.session;
                    cleanUrl();
                } else if (code) {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;
                    session = data.session;
                    cleanUrl();
                } else {
                    const { data, error } = await supabase.auth.getSession();
                    if (error) throw error;
                    session = data.session;
                }

                if (!session) {
                    throw new Error('No se pudo validar la sesión de recuperación');
                }

                if (isMounted) {
                    setHasValidSession(true);
                }
            } catch (error) {
                console.error('Error verificando sesión:', error);
                toast.error('Error al verificar el enlace de restablecimiento');
                setTimeout(() => navigate('/login', { replace: true }), 3000);
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return;

            if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
                setHasValidSession(true);
            }
        });

        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Validaciones
        if (password.length < 6) {
            toast.error('❌ La contraseña debe tener al menos 6 caracteres');
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            toast.error('❌ Las contraseñas no coinciden');
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                throw new Error(error.message || 'No se pudo actualizar la contraseña');
            }

            await supabase.auth.signOut();

            toast.success('¡Contraseña actualizada con éxito!');
            
            // Esperar un momento antes de redirigir
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2000);

        } catch (err) {
            console.error('Error actualizando contraseña:', err);
            toast.error(`❌ ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // No mostrar nada hasta verificar la sesión
    if (!hasValidSession) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Verificando enlace de restablecimiento...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0">
            <img src={bgMov} alt="Fondo móvil" className="absolute inset-0 w-full h-full object-cover md:hidden" />
            <img src={bgWeb} alt="Fondo web" className="absolute inset-0 w-full h-full object-cover hidden md:block" />

            <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="bg-black/50 backdrop-blur-sm rounded-xl p-8 shadow-lg">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Nueva Contraseña</h2>
                            <p className="text-sm text-gray-300">Ingresa tu nueva contraseña para tu cuenta</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#000000]/50 rounded-[10px] border-none placeholder-[#FFFFFF]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#0037FF]"
                                    placeholder="Nueva contraseña (mínimo 6 caracteres)"
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                />
                            </div>
                            
                            <div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#000000]/50 rounded-[10px] border-none placeholder-[#FFFFFF]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#0037FF]"
                                    placeholder="Confirmar nueva contraseña"
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !password || !confirmPassword}
                                className={`w-full px-4 py-3 rounded-[10px] text-[15px] font-semibold transition-colors duration-200 mt-6 ${
                                    isLoading || !password || !confirmPassword
                                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                        : 'bg-[#0037FF] text-white hover:bg-blue-700'
                                }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                        <span>Actualizando contraseña...</span>
                                    </div>
                                ) : (
                                    'Cambiar Contraseña'
                                )}
                            </button>
                        </form>
                        
                 
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;
