// src/pages/AuthPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import backgroundImage from '../assets/FOTO_FONDO.webp';
import { FaFacebook } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const transition = { duration: 0.5, ease: 'easeInOut' };

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { user, rol, loading } = useAuth();

    // Efecto para redirigir al usuario si ya está autenticado y tiene un rol
    useEffect(() => {
        if (!loading && user && rol) {
            const destino = rol === 'admin' ? '/admin' : '/dashboard';
            navigate(destino, { replace: true });
        }
    }, [user, rol, loading, navigate]);

    // --- CÓDIGO CORREGIDO ---
    // Efecto para manejar el callback de verificación de email y activar la cuenta
    useEffect(() => {
        const activarCuentaYRedirigir = async () => {
            // 1. Nos aseguramos de que el contexto de autenticación ya cargó al usuario
            if (user) {
                // 2. Actualizamos el estado del perfil en la base de datos
                const { error } = await supabase
                    .from('perfiles')
                    .update({ estado: 'Activo' })
                    .eq('id', user.id); // Usamos el ID del usuario desde el contexto

                if (error) {
                    toast.error('❌ Error al activar la cuenta. Revisa los permisos.');
                } else {
                    toast.success('🙌 Cuenta activada correctamente.');
                }

                // 3. Limpiamos la URL para que el efecto no se repita.
                // El primer useEffect se encargará de la redirección final al dashboard.
                navigate('/login', { replace: true });
            }
        };

        // Se ejecuta solo si la URL contiene 'verified=true' Y el contexto ya tiene un usuario
        if (location.search.includes('verified=true') && !loading && user) {
            toast.success('✅ Correo verificado. Activando tu cuenta...');
            activarCuentaYRedirigir();
        }
    }, [location, navigate, user, loading]); // <-- Dependencias clave para un funcionamiento correcto

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return toast.error(error.message || 'Credenciales inválidas');
        } else {
            const { data: existingUser } = await supabase
                .from('perfiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (existingUser) {
                toast.error('⚠️ Este correo ya está registrado. Probá iniciar sesión.');
                return;
            }

            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/login?verified=true`,
                },
            });

            if (signUpError) {
                if (signUpError.message.includes('User already registered')) {
                    toast.error('⚠️ Este correo ya está registrado. Probá iniciar sesión.');
                } else {
                    toast.error(signUpError.message);
                }
                return;
            }

            toast.success('📩 Revisa tu correo para verificar tu cuenta');
            setIsLogin(true);
            setPassword('');
        }
    };

    const handleFacebook = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: { redirectTo: window.location.origin },
        });
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
                        {/* ... campos del formulario sin cambios ... */}
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