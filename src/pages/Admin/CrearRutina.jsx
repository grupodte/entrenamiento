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
