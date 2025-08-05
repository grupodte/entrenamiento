import React from 'react';
import { useNavigate } from 'react-router-dom';
import RutinaForm from '../../components/Rutina/RutinaForm';
import { AnimatedLayout } from '../../components/animations';
import { motion } from 'framer-motion';
import { Plus, Dumbbell } from 'lucide-react';

const CrearRutina = () => {
    const navigate = useNavigate();

    const handleGuardarCrear = (rutinaGuardada) => {
        // Ya se muestra toast en RutinaForm
        navigate('/admin/rutinas');
    };

    return (
        <AnimatedLayout className="min-h-[calc(100dvh-4rem)] pb-[90px] py-6 text-white">
            {/* Encabezado animado */}
            <motion.div 
                className="max-w-5xl mx-auto mb-6 px-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Plus className="text-2xl text-green-500" />
                        <Dumbbell className="text-2xl text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Crear Nueva Rutina</h1>
                </div>
                
                <motion.p 
                    className="text-white/70 text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    Diseña una rutina personalizada para tus alumnos
                </motion.p>
            </motion.div>

            {/* Formulario */}
            <motion.div 
                className="max-w-6xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                <RutinaForm modo="crear" onGuardar={handleGuardarCrear} />
            </motion.div>
        </AnimatedLayout>
    );
};

export default CrearRutina;
