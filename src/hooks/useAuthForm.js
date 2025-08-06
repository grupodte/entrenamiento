import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const useAuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, rol, loading, login } = useAuth();

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
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (!session?.user?.id)
                    return toast.error('❌ No se pudo obtener la sesión.');
                const { error } = await supabase
                    .from('perfiles')
                    .update({ estado: 'Aprobado' })
                    .eq('id', session.user.id);
                error
                    ? toast.error('❌ Error al activar la cuenta.')
                    : toast.success('🙌 Cuenta activada correctamente.');
                navigate('/login', { replace: true });
            })();
        }
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error)
                    throw new Error('El correo o la contraseña son incorrectos.');
                const { data: perfil } = await supabase
                    .from('perfiles')
                    .select('rol, estado')
                    .eq('id', data.user.id)
                    .single();
                if (!perfil || perfil.estado !== 'Aprobado')
                    throw new Error('Cuenta no activada. Verificá tu correo.');
                login(data.user, perfil.rol);
                navigate(perfil.rol === 'admin' ? '/admin' : '/dashboard');
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/login?verified=true`,
                    },
                });
                if (error) throw error;
                await supabase
                    .from('perfiles')
                    .insert({ id: data.user.id, email, estado: 'pendiente', rol: 'alumno' });
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
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) toast.error('❌ Error con Google');
        setIsLoading(false);
    };

    return {
        isLogin,
        setIsLogin,
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        handleSubmit,
        handleGoogle,
    };
};
