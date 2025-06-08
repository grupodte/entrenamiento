import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const LoginForm = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [clave, setClave] = useState('');
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: clave,
        });

        if (authError) return setError('Credenciales incorrectas');

        const user = data.user;

        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', user.id)
            .single();

        if (perfilError || !perfil) {
            setError('No se pudo obtener el perfil del usuario');
            await supabase.auth.signOut();
            return;
        }

        login(user, perfil.rol);

        if (perfil.rol === 'alumno') navigate('/dashboard');
        else if (perfil.rol === 'admin') navigate('/admin');
        else {
            setError('Rol no autorizado');
            await supabase.auth.signOut();
        }

        if (onLoginSuccess) onLoginSuccess(); // Cierra modal
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl w-full max-w-sm p-6 space-y-4">
                <h2 className="text-lg font-semibold text-center text-gray-800 dark:text-white">
                    Iniciar sesión
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={clave}
                        onChange={(e) => setClave(e.target.value)}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white text-sm py-2 rounded-md hover:bg-blue-700 transition"
                    >
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
