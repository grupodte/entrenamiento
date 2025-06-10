import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import backgroundImage from '../assets/men.jpg'; // Asegúrate que la ruta a tu imagen sea correcta
import { motion } from 'framer-motion';

const LoginPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        }
    }, [user, navigate]);

    return (
        <div
            className="relative min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="absolute inset-0 backdrop-blur-md bg-black/30"></div>

            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md p-8 space-y-6 rounded-2xl shadow-2xl backdrop-blur-lg "
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