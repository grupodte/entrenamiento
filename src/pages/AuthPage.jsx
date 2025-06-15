// src/pages/AuthPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import backgroundImage from '../assets/FOTO_FONDO.webp';
import { FaFacebook } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm'; // 👉 Asegurate que la ruta sea correcta

const transition = { duration: 0.5, ease: 'easeInOut' };

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { user, rol, loading } = useAuth();

    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        if (!loading && user && rol) {
            const destino = rol === 'admin' ? '/admin' : '/dashboard';
            navigate(destino, { replace: true });
        }
    }, [user, rol, loading, navigate]);

    useEffect(() => {
        const activarCuentaYRedirigir = async () => {
            if (user) {
                const { error } = await supabase
                    .from('perfiles')
                    .update({ estado: 'Activo' })
                    .eq('id', user.id);

                if (error) {
                    toast.error('❌ Error al activar la cuenta. Revisa los permisos.');
                } else {
                    toast.success('🙌 Cuenta activada correctamente.');
                }

                navigate('/login', { replace: true });
            }
        };

        if (location.search.includes('verified=true') && !loading && user) {
            toast.success('✅ Correo verificado. Activando tu cuenta...');
            activarCuentaYRedirigir();
        }
    }, [location, navigate, user, loading]);

    const handleRegister = async (e) => {
        e.preventDefault();

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/login?verified=true`,
            },
        });

        if (signUpError) {
            const isRegistered =
                signUpError.message?.includes('User already registered') ||
                signUpError.message?.toLowerCase().includes('already') ||
                signUpError.status === 400;

            if (isRegistered) {
                toast.error('⚠️ Este correo ya está registrado. Probá iniciar sesión.');
            } else {
                toast.error(`❌ ${signUpError.message}`);
            }
            return;
        }

        toast.success('📩 Revisa tu correo para verificar tu cuenta');
        setIsLogin(true);
        setPassword('');
    };

    const handleFacebook = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: { redirectTo: window.location.origin },
        });
        if (error) toast.error('Error con Facebook');
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center z-0"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={isLogin ? 'login' : 'register'}
                    initial={{ x: isLogin ? 300 : -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: isLogin ? -300 : 300, opacity: 0 }}
                    transition={transition}
                    className="relative z-10 p-8 rounded-[30px] bg-gradient-to-br from-white/10 to-black/30 backdrop-blur-md shadow-xl w-full max-w-sm text-white"
                >
                    <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">
                        {isLogin ? 'Iniciá sesión' : 'Creá tu cuenta'}
                    </h2>

                    {/* 👉 Modo login: usa tu componente */}
                    {isLogin ? (
                        <LoginForm />
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="text-sm text-white/80">Correo electrónico</label>
                                <input
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    className="w-full mt-1 px-4 py-2 rounded-full bg-black/70 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-lime-400"
                                    placeholder="tucorreo@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm text-white/80">Contraseña</label>
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    className="w-full mt-1 px-4 py-2 rounded-full bg-black/70 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-lime-400"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 rounded-full bg-lime-400 hover:bg-lime-500 text-black font-bold text-center transition shadow-sm"
                            >
                                Registrarme →
                            </button>
                        </form>
                    )}

                    <div className="my-4 text-center text-white/70 text-sm">o</div>

                    <button
                        onClick={handleFacebook}
                        className="w-full py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition"
                    >
                        <FaFacebook size={18} />
                        {isLogin ? 'Ingresar con Facebook' : 'Registrarme con Facebook'}
                    </button>

                    <p className="text-sm text-center mt-6 text-white/80">
                        {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-lime-400 font-semibold ml-1 hover:underline"
                        >
                            {isLogin ? 'Registrate' : 'Iniciar sesión'}
                        </button>
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AuthPage;
