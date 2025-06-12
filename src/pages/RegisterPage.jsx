import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import backgroundImage from '../assets/men.jpg';
import { FaFacebook } from 'react-icons/fa';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => (document.body.style.overflow = '');
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) return alert(error.message);
        alert('Revisá tu correo para verificar tu cuenta');
        navigate('/login');
    };

    const handleFacebookSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
        if (error) alert('Error al registrarse con Facebook');
    };

    return (
        <div
            className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="absolute inset-0 backdrop-blur-md bg-black/40" />
            <div className="relative z-10 p-8 rounded-[30px] bg-gradient-to-br from-white/10 to-black/30 backdrop-blur-md shadow-xl w-full max-w-sm text-white">
                <h2 className="text-2xl font-bold mb-4">Crear cuenta nueva</h2>
                <form onSubmit={handleRegister} className="space-y-4">
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
                        Registrarse →
                    </button>
                </form>

                <div className="my-4 flex items-center justify-center">
                    <span className="text-white/70 text-sm">o</span>
                </div>

                <button
                    onClick={handleFacebookSignup}
                    className="w-full py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition"
                >
                    <FaFacebook size={18} />
                    Registrarse con Facebook
                </button>

                <p className="text-sm text-center mt-6 text-white/80">
                    ¿Ya tenés cuenta?
                    <Link to="/login" className="text-lime-400 font-semibold ml-1 hover:underline">
                        Iniciar sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
