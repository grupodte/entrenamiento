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
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur">
            <div className="p-8 rounded-2xl bg-gray-900 w-11/12 max-w-md text-white border border-gray-700">
                <h2 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400"
                        placeholder="Correo electrónico" required disabled={isLoading}
                    />
                    <input
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400"
                        placeholder="Contraseña" required disabled={isLoading}
                    />
                    <button disabled={isLoading} className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                        {isLoading ? 'Procesando...' : isLogin ? 'Ingresar' : 'Registrarme'}
                    </button>
                </form>
                <div className="my-4 text-center text-gray-400 text-sm">o</div>
                <button onClick={handleGoogle} disabled={isLoading}
                    className="w-full py-3 rounded-lg bg-white text-gray-900 font-semibold flex items-center justify-center gap-3">
                    <FcGoogle size={24} /> {isLogin ? 'Continuar con Google' : 'Registrarme con Google'}
                </button>
                <p className="text-sm text-center mt-6 text-gray-400">
                    {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-cyan-400 font-semibold ml-1 hover:underline">
                        {isLogin ? 'Registrate' : 'Iniciar sesión'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
