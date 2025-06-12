import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import backgroundImage from '../assets/FOTO_FONDO.webp';
import { FaFacebook } from 'react-icons/fa';

const transition = { duration: 0.5, ease: 'easeInOut' };

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // ✅ Recupera sesión si viene del email (access_token en hash)
    useEffect(() => {
        const checkRecovery = async () => {
            if (window.location.hash.includes('access_token')) {
                const { data, error } = await supabase.auth.getSessionFromUrl();
                if (error) {
                    toast.error('Error recuperando sesión');
                    console.error(error);
                } else if (data.session) {
                    const { error: errorEstado } = await supabase
                        .from('perfiles')
                        .update({ estado: 'activo' })
                        .eq('id', data.session.user.id);

                    if (errorEstado) {
                        console.error('❌ Error actualizando estado del usuario:', errorEstado);
                    } else {
                        toast.success('✅ Estado actualizado: cuenta activa');
              }
                }
            }

            if (location.search.includes('verified=true')) {
                toast.success('✅ Correo verificado. Ahora podés iniciar sesión');
                setIsLogin(true);
            }
        };
        checkRecovery();
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLogin) {
            const { data: sessionData, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return toast.error('Credenciales inválidas');

            const userId = sessionData?.user?.id;
            if (!userId) return toast.error('No se pudo obtener el usuario');

            const { data: perfil, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', userId)
                .maybeSingle();

            if (errorPerfil || !perfil?.rol) {
                console.error('❌ Error perfil:', errorPerfil);
                return toast.error('No se pudo obtener tu perfil');
            }

            toast.success('🔓 Bienvenido');
            navigate(perfil.rol === 'admin' ? '/admin' : '/dashboard');
        } else {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/login?verified=true`,
                },
            });

            if (signUpError) return toast.error(signUpError.message);

            toast.success('📩 Revisá tu correo para verificar tu cuenta');
            setIsLogin(true);
            setPassword('');
        }
    };

    const handleFacebook = async () => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
        if (error) toast.error('Error con Facebook');
    };

    return (
        <div
            className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
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
                    <h2 className="text-2xl font-bold mb-4">
                        {isLogin ? 'Inicia sesión' : 'Crear cuenta nueva'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2 mt-1 rounded-full bg-black/70 text-white placeholder-white focus:outline-none"
                                placeholder="tucorreo@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm">Contraseña</label>
                            <input
                                type="password"
                                className="w-full px-4 py-2 mt-1 rounded-full bg-black/70 text-white placeholder-white focus:outline-none"
                                placeholder="***********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 rounded-full bg-lime-400 hover:bg-lime-500 text-black font-bold transition"
                        >
                            {isLogin ? 'Ingresar →' : 'Registrarse →'}
                        </button>
                    </form>

                    <div className="my-4 flex items-center justify-center">
                        <span className="text-white/70 text-sm">o</span>
                    </div>

                    <button
                        onClick={handleFacebook}
                        className="w-full py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition"
                    >
                        <FaFacebook size={18} />
                        {isLogin ? 'Ingresar con Facebook' : 'Registrarse con Facebook'}
                    </button>

                    <p className="text-sm text-center mt-6 text-white/80">
                        {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-lime-400 font-semibold ml-1 hover:underline"
                        >
                            {isLogin ? 'Registrate acá' : 'Iniciar sesión'}
                        </button>
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AuthPage;
