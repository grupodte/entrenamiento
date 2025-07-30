import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import backgroundImage from '../assets/FOTO_FONDO.webp';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';

const transition = { duration: 0.5, ease: 'easeInOut' };

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, rol, loading, login } = useAuth();

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
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        if (!loading && user && rol !== null) {
            const destino = rol === 'admin' ? '/admin' : '/dashboard';
            navigate(destino, { replace: true });
        }
    }, [user, rol, loading, navigate]);
    

    useEffect(() => {
        const activarCuentaYRedirigir = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId || sessionError) {
                toast.error('❌ No se pudo obtener la sesión.');
                console.error('[Verificación email] Error sesión:', sessionError);
                return;
            }

            const { error } = await supabase
                .from('perfiles')
                .update({ estado: 'Aprobado' })
                .eq('id', userId);

            if (error) {
                toast.error('❌ Error al activar la cuenta.');
                console.error('[Verificación email] Error update:', error);
            } else {
                toast.success('🙌 Cuenta activada correctamente.', {
                    id: 'cuenta-activada',
                });
            }

            navigate('/login', { replace: true });
        };

        if (location.search.includes('verified=true')) {
            activarCuentaYRedirigir();
        }
    }, [location, navigate]);
    

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                throw new Error('El correo o la contraseña son incorrectos.');
            }

            const user = data.user;
            const { data: perfil, error: perfilError } = await supabase
                .from('perfiles')
                .select('rol, estado')
                .eq('id', user.id)
                .single();

            if (perfilError || !perfil) {
                throw new Error('No pudimos verificar tu cuenta.');
            }

            if (perfil.estado !== 'Aprobado') {
                throw new Error('Tu cuenta aún no fue activada. Verificá tu correo.');
            }

            login(user, perfil.rol);

            if (perfil.rol === 'admin') navigate('/admin');
            else if (perfil.rol === 'alumno') navigate('/dashboard');
            else {
                await supabase.auth.signOut();
                throw new Error('Tu rol no tiene permisos para acceder.');
            }
        } catch (error) {
            toast.error(`❌ ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/login?verified=true`,
            },
        });

        if (signUpError) {
            const isRegistered =
                signUpError.message?.toLowerCase().includes('already') ||
                signUpError.status === 400;

            if (isRegistered) {
                toast.error('⚠️ Este correo ya está registrado. Probá iniciar sesión.');
            } else {
                toast.error(`❌ ${signUpError.message}`);
            }
            setIsLoading(false);
            return;
        }

        const { data: sessionData } = data;

        if (sessionData?.user) {
            const { error: insertError } = await supabase.from('perfiles').insert({
                id: sessionData.user.id,
                email,
                estado: 'pendiente',
                rol: 'alumno',
            });

            if (insertError) {
                console.error('[Registro] ❌ Error al insertar perfil:', insertError);
            }
        }

        toast.success('📩 Revisa tu correo para verificar tu cuenta');
        setIsLogin(true);
        setPassword('');
        setIsLoading(false);
    };

    const handleGoogle = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) {
            toast.error('❌ Error con Google');
            console.error('[Google login error]', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center z-0"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="absolute inset-0 backdrop-blur-sm bg-black/60" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={isLogin ? 'login' : 'register'}
                    initial={{ x: isLogin ? 300 : -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: isLogin ? -300 : 300, opacity: 0 }}
                    transition={transition}
                    className="relative z-10 p-8 rounded-3xl bg-gradient-to-br from-gray-800/50 to-black/70 backdrop-blur-lg shadow-2xl w-11/12 max-w-md text-white border border-gray-700"
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center tracking-tight">
                        {isLogin ? 'Bienvenido de nuevo' : 'Creá tu cuenta'}
                    </h2>

                    <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo electrónico</label>
                            <input
                                id="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                className="w-full px-4 py-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-transparent focus:border-cyan-400 transition-all duration-200"
                                placeholder="tucorreo@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                className="w-full px-4 py-3 rounded-xl bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-transparent focus:border-cyan-400 transition-all duration-200"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold text-lg text-center transition-all duration-300 shadow-lg transform hover:scale-105"
                        >
                            {isLoading ? (isLogin ? 'Ingresando...' : 'Registrando...') : (isLogin ? 'Ingresar' : 'Registrarme')}
                        </button>
                    </form>

                    <div className="my-6 text-center text-gray-400 text-sm">o</div>

                    <button
                        onClick={handleGoogle}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-md transform hover:scale-105"
                    >
                        <FcGoogle size={24} />
                        {isLogin ? 'Continuar con Google' : 'Registrarme con Google'}
                    </button>

                    <p className="text-sm text-center mt-8 text-gray-400">
                        {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-cyan-400 font-semibold ml-1 hover:underline"
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
