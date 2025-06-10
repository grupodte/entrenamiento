import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import backgroundImage from '../assets/men.jpg';
import { motion } from 'framer-motion';

const LoginPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirige si el usuario ya está logueado
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        }

        // Desactiva scroll al montar el componente
        document.body.style.overflow = 'hidden';

        // Restaura scroll al desmontar
        return () => {
            document.body.style.overflow = '';
        };
    }, [user, navigate]);

    return (
        <div
            className="relative  bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="inset-0 backdrop-blur-md bg-black/30"></div>

            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md p-8 space-y-6 rounded-2xl shadow-2xl backdrop-blur-lg"
                >
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white">
                            Bienvenido
                        </h1>
                        <p className="mt-2 text-sm text-white/80">
                            Inicia sesión para continuar.
                        </p>
                    </div>
                    <LoginForm />
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
