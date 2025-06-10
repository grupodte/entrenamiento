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

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password: clave,
            });

            if (authError) throw new Error('El correo o la contraseña son incorrectos.');

            const user = data.user;
            const { data: perfil, error: perfilError } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', user.id)
                .single();

            if (perfilError || !perfil) throw new Error('No pudimos verificar tu rol.');

            login(user, perfil.rol);

            if (perfil.rol === 'admin') navigate('/admin');
            else if (perfil.rol === 'alumno') navigate('/dashboard');
            else {
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
        <form onSubmit={handleSubmit} className="space-y-8 mt-[100px] justify-center mx-auto rounded-lg ">
            {/* Campo de Correo Electrónico */}
            <div>
                <label htmlFor="email" className=" block text-sm text-white">
                    Correo Electrónico
                </label>
                <div className="relative mt-1 text-white">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                    </div>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-lg border-white/40 bg-white/25 pl-10 py-2.5 text-white  focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Campo de Contraseña */}
            <div>
                <label htmlFor="password" className="block text-sm  text-white">
                    Contraseña
                </label>
                <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                    </div>
                    <input
                        id="password"
                        type="password"
                        value={clave}
                        onChange={(e) => setClave(e.target.value)}
                        className="block w-full rounded-lg border-white/40 bg-white/25 pl-10 py-2.5 text-white  focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
                <div className="flex items-center space-x-2 rounded-md bg-red-500/20 p-3">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                    <p className="text-sm font-semibold text-red-800">{error}</p>
                </div>
            )}

            {/* Botón de Ingresar */}
            <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-lg border border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 py-3 px-4 text-sm font-bold text-white shadow-lg hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition-shadow"
            >
                {isLoading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Ingresar'}
            </button>
        </form>
    );
};

export default LoginForm;