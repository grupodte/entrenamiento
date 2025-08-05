import AlumnosManager from '../../components/AlumnosManager';
import { AnimatedLayout } from '../../components/animations';
import { FaUsers } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AdminAlumnos = () => {
    return (
        <AnimatedLayout className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-safe">
            {/* Encabezado animado */}
            <motion.div 
                className="flex items-center gap-3 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <FaUsers className="text-3xl text-blue-500 drop-shadow-sm" />
                <h1 className="text-2xl font-bold text-white">Gestión de Alumnos</h1>
            </motion.div>
            
            <motion.p 
                className="text-white/70 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                Administra todos los alumnos y sus rutinas personalizadas.
            </motion.p>
            
            <AlumnosManager />
        </AnimatedLayout>
    );
};

export default AdminAlumnos;
