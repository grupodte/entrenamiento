import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const LoginForm = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [clave, setClave] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        console.log('[Login] Intentando login con:', email);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password: clave,
            });

            if (authError) {
                console.warn('[Login] Error de autenticación:', authError.message);
                throw new Error('El correo o la contraseña son incorrectos.');
            }

            const user = data.user;
            console.log('[Login] Usuario autenticado:', user.id);

            const { data: perfil, error: perfilError } = await supabase
                .from('perfiles')
                .select('rol, estado')
                .eq('id', user.id)
                .single();

            if (perfilError || !perfil) {
                console.error('[Login] ❌ No se pudo obtener el perfil:', perfilError);
                throw new Error('No pudimos verificar tu cuenta.');
            }

            if (perfil.estado !== 'Aprobado') {
                console.warn('[Login] ⚠️ Cuenta no activada:', perfil.estado);
                throw new Error('Tu cuenta aún no fue activada. Verificá tu correo.');
            }

            login(user, perfil.rol);

            if (perfil.rol === 'admin') navigate('/admin');
            else if (perfil.rol === 'alumno') navigate('/dashboard');
            else {
                console.error('[Login] ❌ Rol inválido:', perfil.rol);
                await supabase.auth.signOut();
                throw new Error('Tu rol no tiene permisos para acceder.');
            }

            if (onLoginSuccess) onLoginSuccess();
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 ">
            <div>
                <label className="text-sm text-white/80">Correo electrónico</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-4 py-2 rounded-full bg-black/70 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-lime-400"
                    placeholder="tucorreo@email.com"
                    required
                    disabled={isLoading}
                />
            </div>

            <div>
                <label className="text-sm text-white/80">Contraseña</label>
                <input
                    id="password"
                    type="password"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    className="w-full mt-1 px-4 py-2 rounded-full bg-black/70 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-lime-400"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                />
            </div>

            {error && (
                <div className="text-sm text-red-400 font-semibold bg-red-500/10 p-2 rounded text-center">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 rounded-full bg-lime-400 hover:bg-lime-500 text-black font-bold text-center transition shadow-sm"
            >
                {isLoading ? 'Ingresando...' : 'Ingresar →'}
            </button>
        </form>
    );
};

export default LoginForm;
