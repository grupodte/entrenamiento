import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import bgWeb from '../assets/bg-auth-web.png';
import bgMov from '../assets/bg-auth-mov.png';
import imgWeb from '../assets/img-auth-w.png';
import googleIcon from '../assets/google.svg';

const AuthPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, rol, loading } = useAuth();

    // Redirigir si ya está logueado
    useEffect(() => {
        if (!loading && user && rol) {
            navigate(rol === 'admin' ? '/admin' : '/dashboard', { replace: true });
        }
    }, [user, rol, loading, navigate]);

    // Flujo legado de verificación manual (se mantiene para no romper onboarding existente)
    useEffect(() => {
        if (location.search.includes('verified=true')) {
            (async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) return toast.error('❌ No se pudo obtener la sesión.');
                const { error } = await supabase
                    .from('perfiles')
                    .update({ estado: 'Aprobado' })
                    .eq('id', session.user.id);
                if (error) {
                    toast.error('❌ Error al activar la cuenta.');
                } else {
                    toast.success('🙌 Cuenta activada correctamente.');
                }
                navigate('/login', { replace: true });
            })();
        }
    }, [location, navigate]);

    const handleMagicLink = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('❌ Por favor ingresa tu correo electrónico');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/login`,
                    shouldCreateUser: true,
                },
            });

            if (error) throw error;

            toast.success('📬 Te enviamos un enlace de acceso. Revísalo en los próximos minutos.');
            setMagicLinkSent(true);
        } catch (err) {
            toast.error(`❌ ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) toast.error('❌ Error con Google');
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 ">
            {/* Fondos distintos para móvil y desktop */}
            <img src={bgMov} alt="Fondo móvil" className="absolute inset-0 w-full h-full object-cover md:hidden" />
            <img src={bgWeb} alt="Fondo web" className="absolute inset-0 w-full h-full object-cover hidden md:block" />

            {/* Contenido */}
            <div className="relative z-10 h-full flex flex-col md:flex-row items-center  justify-between md:w-[1440px] mx-auto ">
                {/* Encabezado móvil */}
                <div className="w-full md:hidden pt-10 items-center justify-center  flex">
                    <h1 className="text-[#FFFFFF] leading-none mt-[50px] text-[43px] w-[288px] ">
                        La app para entrenar que necesitabas
                    </h1>
                </div>

                {/* Lado izquierdo (solo web): imagen + título grande */}
                <div className="hidden md:flex items-center ">
                    <img
                        src={imgWeb}
                        alt="Atleta"
                        className="w-[663px] h-[899px] select-none pointer-events-none "
                    />
                    <h1 className=" -ml-[200px] text-[#FFFFFF]  leading-none  text-[83px] max-w-[500px] ">
                        La app para entrar que necesitabas
                    </h1>
                </div>

                {/* Formulario */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                    className="w-full md:w-[380px] lg:w-[420px] md:ml-auto mb-8 md:mb-0 flex items-center justify-center"
                >
                    <div className=" w-[288px] pb-[20px]">
                        <h2 className="text-[23px] text-[#FFFFFF] mb-4">
                            Accedé con tu correo
                        </h2>

                        <p className="text-sm text-[#FFFFFF]/70 mb-6">
                            Te enviamos un enlace mágico para ingresar sin contraseña. Funciona tanto para registrarte como para volver a entrar.
                        </p>

                        <form onSubmit={handleMagicLink} className="space-y-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#000000]/50 rounded-[10px] border-none placeholder-[#FFFFFF]/50 text-[#FFFFFF] focus:border-none focus:ring-0 "
                                placeholder="Correo electrónico"
                                required
                                disabled={isLoading}
                            />

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full px-4 py-3 rounded-[10px] text-[15px]  ${isLoading
                                    ? 'bg-[#0037FF] text-[#000000]'
                                    : 'bg-[#0037FF] text-[#000000]'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                        Procesando...
                                    </div>
                                ) : (
                                    magicLinkSent ? 'Reenviar enlace mágico' : 'Enviar enlace mágico'
                                )}
                            </button>
                        </form>

                        {magicLinkSent && (
                            <div className="mt-4 text-sm text-[#FFFFFF]/70 bg-[#000000]/40 rounded-[10px] px-4 py-3">
                                Revisá tu casilla (y el spam). El enlace expira en unos minutos y te llevará nuevamente a esta página para completar el acceso.
                            </div>
                        )}

                        <button
                            onClick={handleGoogle}
                            disabled={isLoading}
                            className=" mt-4 w-full py-3 rounded-[10px] bg-[#0037FF] text-[#000000] flex items-center justify-center gap-3 transition-colors duration-200 disabled:opacity-50 border border-white/10 backdrop-blur-md"
                        >
                            <img src={googleIcon} alt="Google" className="w-6 h-6 absolute left-8" />
                            Continuar con Google
                        </button>

                        <div className="text-center mt-8 text-[15px] text-[#FFFFFF]/70">
                            ¿Necesitás ayuda? Escribinos a soporte para validar tu acceso.
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuthPage;
