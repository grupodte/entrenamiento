import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useViewportHeight } from '../hooks/useViewportHeight';


const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, rol, loading, login } = useAuth();
    useViewportHeight();

    // Redirigir si ya está logueado
    useEffect(() => {
        if (!loading && user && rol) {
            navigate(rol === 'admin' ? '/admin' : '/dashboard', { replace: true });
        }
    }, [user, rol, loading, navigate]);

    // Activación de cuenta
    useEffect(() => {
        if (location.search.includes('verified=true')) {
            (async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) return toast.error('❌ No se pudo obtener la sesión.');
                const { error } = await supabase.from('perfiles').update({ estado: 'Aprobado' }).eq('id', session.user.id);
                error ? toast.error('❌ Error al activar la cuenta.') : toast.success('🙌 Cuenta activada correctamente.');
                navigate('/login', { replace: true });
            })();
        }
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw new Error('El correo o la contraseña son incorrectos.');
                const { data: perfil } = await supabase.from('perfiles').select('rol, estado').eq('id', data.user.id).single();
                if (!perfil || perfil.estado !== 'Aprobado') throw new Error('Cuenta no activada. Verificá tu correo.');
                login(data.user, perfil.rol);
                navigate(perfil.rol === 'admin' ? '/admin' : '/dashboard');
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email, password,
                    options: { emailRedirectTo: `${window.location.origin}/login?verified=true` }
                });
                if (error) throw error;
                await supabase.from('perfiles').insert({ id: data.user.id, email, estado: 'pendiente', rol: 'alumno' });
                toast.success('📩 Revisa tu correo para verificar tu cuenta');
                setIsLogin(true);
            }
        } catch (err) {
            toast.error(`❌ ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
        if (error) toast.error('❌ Error con Google');
        setIsLoading(false);
    };

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
                <div
                    className="relative z-10 p-8 rounded-2xl bg-gray-900/20 w-[325px] max-w-md text-white border border-gray-700/10 shadow-2xl backdrop-blur-md"
                >
                    <h2 className="text-2xl font-bold text-center mb-6">
                        {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
                    </h2>

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
                                    ? "bg-cyan-600/20 text-white cursor-not-allowed"
                                    : "bg-cyan-600/60 hover:bg-cyan-500 text-white hover:shadow-lg"
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
                                isLogin ? 'Ingresar' : 'Registrarme'
                            )}
                        </button>
                    </form>

                    <div className="my-4 text-center text-gray-400 text-sm">o</div>

                    <button
                        onClick={handleGoogle}
                        disabled={isLoading}
                        className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-3 transition-colors duration-200 disabled:opacity-50 border border-gray-700/20 backdrop-blur-md"
                    >
                        <img src="/backgrounds/google.webp" alt="Google" className="w-6 h-6" />
                        {isLogin ? 'Iniciar rápido' : 'Iniciar rápido'}
                    </button>

                    <p className="text-sm text-center mt-6 text-gray-400">
                        {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-cyan-400 font-semibold ml-1 hover:underline transition-colors duration-200"
                        >
                            {isLogin ? 'Registrate' : 'Iniciar sesión'}
                        </button>
                    </p>
                </div>
          </div>  );
};

export default AuthPage;