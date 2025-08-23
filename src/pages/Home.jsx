import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StepperModal from '../components/StepperModal';

const Home = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleServiciosClick = () => {
        navigate('/servicios');
    };

    const handleContactanosClick = () => {
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Hero Section */}
            <div className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background con gradiente */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
                
                {/* Contenido principal */}
                <div className="relative z-10 text-center px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
                    >
                        Bienvenido a DTE
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl md:text-2xl mb-12 text-gray-300"
                    >
                        Tu plataforma de entrenamiento personalizado
                    </motion.p>

                    {/* Botones de acción */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <button
                            onClick={handleServiciosClick}
                            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-600/30"
                        >
                            Servicios
                        </button>
                        
                        <button
                            onClick={handleContactanosClick}
                            className="px-8 py-4 bg-transparent border-2 border-cyan-600 hover:bg-cyan-600/20 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                        >
                            Contáctanos
                        </button>
                    </motion.div>

                    {/* Botón de login */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mt-8"
                    >
                        <button
                            onClick={() => navigate('/login')}
                            className="text-gray-400 hover:text-white transition-colors duration-300 underline"
                        >
                            ¿Ya tienes cuenta? Inicia sesión
                        </button>
                    </motion.div>
                </div>

                {/* Decoración animada */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
            </div>

            {/* Modal de Contacto */}
            <StepperModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
};

export default Home;
