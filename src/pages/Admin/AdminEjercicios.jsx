import EjerciciosManager from '../../components/AgregarEjercicio';
import { AnimatedLayout } from '../../components/animations';
import { FaDumbbell } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AdminEjercicios = () => {
    return (
        <AnimatedLayout className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-safe">
    
            <EjerciciosManager />
        </AnimatedLayout>
    );
};

export default AdminEjercicios;
