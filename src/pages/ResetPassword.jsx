import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import bgWeb from '../assets/bg-auth-web.png';
import bgMov from '../assets/bg-auth-mov.png';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (password.length < 6) {
            toast.error('❌ La contraseña debe tener al menos 6 caracteres.');
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                throw new Error(error.message || 'No se pudo actualizar la contraseña.');
            }

            toast.success('🙌 ¡Contraseña actualizada con éxito!');
            navigate('/dashboard', { replace: true });

        } catch (err) {
            toast.error(`❌ ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0">
            <img src={bgMov} alt="Fondo móvil" className="absolute inset-0 w-full h-full object-cover md:hidden" />
            <img src={bgWeb} alt="Fondo web" className="absolute inset-0 w-full h-full object-cover hidden md:block" />

            <div className="relative z-10 h-full flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="bg-black/50 backdrop-blur-sm rounded-xl p-8 shadow-lg">
                        <h2 className="text-2xl font-bold text-white text-center mb-6">Restablecer Contraseña</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#000000]/50 rounded-[10px] border-none placeholder-[#FFFFFF]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#0037FF]"
                                placeholder="Nueva contraseña"
                                required
                                disabled={isLoading}
                            />

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full px-4 py-3 rounded-[10px] text-[15px] font-semibold transition-colors duration-200 ${isLoading
                                    ? 'bg-gray-500 text-gray-300'
                                    : 'bg-[#0037FF] text-white hover:bg-blue-700'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                        <span>Actualizando...</span>
                                    </div>
                                ) : (
                                    'Actualizar Contraseña'
                                )}
                            </button>
                        </form>
                         <p className="text-xs text-gray-400 text-center mt-4">
                            Serás redirigido al panel principal después de actualizar tu contraseña.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;