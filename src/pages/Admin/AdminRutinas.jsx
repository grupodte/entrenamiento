import RutinasManager from '../../components/RutinasManager';
import { AnimatedLayout } from '../../components/animations';
import { FaDumbbell } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AdminRutinas = () => {
    return (
        <AnimatedLayout className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-safe">
                 <RutinasManager />
        </AnimatedLayout>
    );
};

export default AdminRutinas;
