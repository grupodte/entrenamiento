import EjerciciosManager from '../../components/AgregarEjercicio';
import { AnimatedLayout } from '../../components/animations';
import { FaDumbbell } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AdminEjercicios = () => {
    return (
        <AnimatedLayout className="space-y-10 px-4 md:px-8 py-10">
            {/* Encabezado animado */}
            <motion.div 
                className="flex items-center gap-3 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <FaDumbbell className="text-3xl text-orange-500 drop-shadow-sm" />
                <h1 className="text-2xl font-bold text-white">Gestión de Ejercicios</h1>
            </motion.div>

            <motion.p 
                className="text-white/70 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                Aquí podés crear, editar y administrar todos los ejercicios disponibles en la plataforma.
            </motion.p>

            <EjerciciosManager />
        </AnimatedLayout>
    );
};

export default AdminEjercicios;
