import RutinasManager from '../../components/RutinasManager';
import { AnimatedLayout } from '../../components/animations';
import { FaDumbbell } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AdminRutinas = () => {
    return (
        <AnimatedLayout className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-[calc(4rem+env(safe-area-inset-bottom))]">
            {/* Encabezado animado */}
            <motion.div 
                className="flex items-center gap-3 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <FaDumbbell className="text-3xl text-green-500 drop-shadow-sm" />
                <h1 className="text-2xl font-bold text-white">Gestión de Rutinas</h1>
            </motion.div>
            
            <motion.p 
                className="text-white/70 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                Crea, edita y administra las rutinas base para tus alumnos.
            </motion.p>
            
            <RutinasManager />
        </AnimatedLayout>
    );
};

export default AdminRutinas;
